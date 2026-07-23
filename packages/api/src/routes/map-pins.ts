import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '../middleware/auth';
import { CreateMapPinSchema, UpdateMapPinSchema, MapPinGeoQuerySchema } from '../validators/map-pin';
import { query } from '../db';
import { broadcast } from '../ws/broadcast';

const router = Router();

// POST /api/v1/map-pins — public (community contributions)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateMapPinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { category, title, description, lat, lon, language, expires_at } = parsed.data;
  const id = uuidv4();

  try {
    const result = await query(
      `INSERT INTO map_pins (id, category, title, description, lat, lon, language, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, category, title, description ?? null, lat, lon, language, expires_at ?? null]
    );

    const pin = result.rows[0];
    broadcast('map-pin:new', pin);
    res.status(201).json(pin);
  } catch (err) {
    console.error('Failed to create map pin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/map-pins — public, optional geo + category + animal_alerts layer filter
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = MapPinGeoQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    return;
  }

  const { lat, lon, radius_km, category, include_animal_alerts } = parsed.data;
  const hasGeo = lat !== undefined && lon !== undefined && radius_km !== undefined;

  try {
    let pinsResult;
    if (hasGeo) {
      const categoryClause = category ? `AND category = $5` : '';
      const params: unknown[] = [lat, lon, radius_km, 'active_or_null'];
      if (category) params.push(category);

      pinsResult = await query(
        `SELECT *, 'map_pin' AS _type FROM (
           SELECT *, (6371 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(lat)) * cos(radians(lon) - radians($2)) + sin(radians($1)) * sin(radians(lat))))) AS distance_km
           FROM map_pins WHERE (expires_at IS NULL OR expires_at > NOW())
         ) sub WHERE distance_km <= $3 ${categoryClause} ORDER BY created_at DESC LIMIT 200`,
        category ? [lat, lon, radius_km, category] : [lat, lon, radius_km]
      );
    } else {
      const categoryClause = category ? `AND category = $1` : '';
      pinsResult = await query(
        `SELECT *, 'map_pin' AS _type FROM map_pins WHERE (expires_at IS NULL OR expires_at > NOW()) ${categoryClause} ORDER BY created_at DESC LIMIT 200`,
        category ? [category] : []
      );
    }

    const rows: unknown[] = [...pinsResult.rows];

    if (include_animal_alerts && hasGeo) {
      const animalResult = await query(
        `SELECT *, 'animal_alert' AS _type FROM (
           SELECT *, (6371 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(last_seen_lat)) * cos(radians(last_seen_lon) - radians($2)) + sin(radians($1)) * sin(radians(last_seen_lat))))) AS distance_km
           FROM animal_alerts WHERE status = 'LOST'
         ) sub WHERE distance_km <= $3 ORDER BY created_at DESC LIMIT 100`,
        [lat, lon, radius_km]
      );
      rows.push(...animalResult.rows);
    } else if (include_animal_alerts) {
      const animalResult = await query(
        `SELECT *, 'animal_alert' AS _type FROM animal_alerts WHERE status = 'LOST' ORDER BY created_at DESC LIMIT 100`,
        []
      );
      rows.push(...animalResult.rows);
    }

    res.json(rows);
  } catch (err) {
    console.error('Failed to list map pins:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/map-pins/:id — public
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(`SELECT * FROM map_pins WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Map pin not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to get map pin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/map-pins/:id — admin only
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateMapPinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { id } = req.params;
  const updates = parsed.data;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.category !== undefined) { fields.push(`category = $${idx++}`); values.push(updates.category); }
  if (updates.title !== undefined) { fields.push(`title = $${idx++}`); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
  if (updates.lat !== undefined) { fields.push(`lat = $${idx++}`); values.push(updates.lat); }
  if (updates.lon !== undefined) { fields.push(`lon = $${idx++}`); values.push(updates.lon); }
  if (updates.language !== undefined) { fields.push(`language = $${idx++}`); values.push(updates.language); }
  if (updates.verified !== undefined) { fields.push(`verified = $${idx++}`); values.push(updates.verified); }
  if (updates.expires_at !== undefined) { fields.push(`expires_at = $${idx++}`); values.push(updates.expires_at); }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  try {
    const result = await query(
      `UPDATE map_pins SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Map pin not found' });
      return;
    }

    const pin = result.rows[0];
    broadcast('map-pin:updated', pin);
    res.json(pin);
  } catch (err) {
    console.error('Failed to update map pin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/map-pins/:id/upvote — public
router.post('/:id/upvote', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE map_pins SET upvotes = upvotes + 1, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Map pin not found' });
      return;
    }

    const pin = result.rows[0];
    broadcast('map-pin:upvoted', { id: pin.id, upvotes: pin.upvotes });
    res.json({ upvotes: pin.upvotes });
  } catch (err) {
    console.error('Failed to upvote map pin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/map-pins/:id — admin only (soft delete via expiry)
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE map_pins SET expires_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Map pin not found' });
      return;
    }

    broadcast('map-pin:removed', { id });
    res.json({ message: 'Map pin removed' });
  } catch (err) {
    console.error('Failed to delete map pin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

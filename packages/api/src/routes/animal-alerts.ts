import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CreateAnimalAlertSchema, UpdateAnimalAlertSchema, GeoQuerySchema } from '../validators/animal-alert';
import { query } from '../db';
import { broadcast } from '../ws/broadcast';

const router = Router();

// POST /api/v1/animal-alerts — no auth required (PetWhisper integration, always free)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateAnimalAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { species, name, photo_url, last_seen_lat, last_seen_lon, contact_hash, status, description, language } = parsed.data;
  const id = uuidv4();

  try {
    const result = await query(
      `INSERT INTO animal_alerts (id, species, name, photo_url, last_seen_lat, last_seen_lon, contact_hash, status, description, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, species, name ?? null, photo_url ?? null, last_seen_lat, last_seen_lon, contact_hash, status, description ?? null, language]
    );

    const alert = result.rows[0];
    broadcast('animal-alert:new', alert);
    res.status(201).json(alert);
  } catch (err) {
    console.error('Failed to create animal alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/animal-alerts — public, optional geo filter
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = GeoQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    return;
  }

  const { lat, lon, radius_km, status } = parsed.data;
  const statusFilter = status ?? 'LOST';
  const hasGeo = lat !== undefined && lon !== undefined && radius_km !== undefined;

  try {
    let result;
    if (hasGeo) {
      result = await query(
        `SELECT * FROM (
           SELECT *, (6371 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(last_seen_lat)) * cos(radians(last_seen_lon) - radians($2)) + sin(radians($1)) * sin(radians(last_seen_lat))))) AS distance_km
           FROM animal_alerts WHERE status = $3
         ) sub WHERE distance_km <= $4 ORDER BY created_at DESC LIMIT 200`,
        [lat, lon, statusFilter, radius_km]
      );
    } else {
      result = await query(
        `SELECT * FROM animal_alerts WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
        [statusFilter]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to list animal alerts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/animal-alerts/:id — public
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(`SELECT * FROM animal_alerts WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Animal alert not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to get animal alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/animal-alerts/:id/status — public (contact_hash verification via body)
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateAnimalAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { id } = req.params;
  const { contact_hash } = req.body as { contact_hash?: string };

  if (!contact_hash) {
    res.status(400).json({ error: 'contact_hash is required to update status' });
    return;
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  try {
    const existing = await query(`SELECT * FROM animal_alerts WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Animal alert not found' });
      return;
    }

    const row = existing.rows[0] as Record<string, unknown>;
    if (row['contact_hash'] !== contact_hash) {
      res.status(403).json({ error: 'contact_hash does not match' });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.language !== undefined) { fields.push(`language = $${idx++}`); values.push(updates.language); }
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE animal_alerts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    const updated = result.rows[0];
    broadcast('animal-alert:updated', updated);
    res.json(updated);
  } catch (err) {
    console.error('Failed to update animal alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '../middleware/auth';
import { CreateAlertSchema, UpdateAlertSchema } from '../validators/alert';
import { query } from '../db';
import { broadcast } from '../ws/broadcast';

const router = Router();

router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { type, severity, title, description, location, radius_km, language, expires_at } = parsed.data;
  const id = uuidv4();

  try {
    const result = await query(
      `INSERT INTO alerts (id, type, severity, status, title, description, lat, lon, radius_km, language, created_by, expires_at)
       VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, type, severity, title, description, location.lat, location.lon, radius_km, language, req.user?.sub ?? null, expires_at ?? null]
    );

    const alert = result.rows[0];
    broadcast('alert:new', alert);
    res.status(201).json(alert);
  } catch (err) {
    console.error('Failed to create alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
  const lon = req.query.lon ? parseFloat(req.query.lon as string) : null;
  const radius_km = req.query.radius_km ? parseFloat(req.query.radius_km as string) : null;
  const status = (req.query.status as string) ?? 'active';

  try {
    let result;
    if (lat !== null && lon !== null && radius_km !== null && !isNaN(lat) && !isNaN(lon) && !isNaN(radius_km)) {
      result = await query(
        `SELECT * FROM (
           SELECT *, (6371 * acos(LEAST(1.0, cos(radians($1)) * cos(radians(lat)) * cos(radians(lon) - radians($2)) + sin(radians($1)) * sin(radians(lat))))) AS distance_km
           FROM alerts WHERE status = $3
         ) sub WHERE distance_km <= $4 ORDER BY created_at DESC LIMIT 200`,
        [lat, lon, status, radius_km]
      );
    } else {
      result = await query(
        `SELECT * FROM alerts WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
        [status]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to list alerts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(`SELECT * FROM alerts WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to get alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateAlertSchema.safeParse(req.body);
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

  if (updates.type !== undefined) { fields.push(`type = $${idx++}`); values.push(updates.type); }
  if (updates.severity !== undefined) { fields.push(`severity = $${idx++}`); values.push(updates.severity); }
  if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
  if (updates.title !== undefined) { fields.push(`title = $${idx++}`); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
  if (updates.location !== undefined) {
    fields.push(`lat = $${idx++}`); values.push(updates.location.lat);
    fields.push(`lon = $${idx++}`); values.push(updates.location.lon);
  }
  if (updates.radius_km !== undefined) { fields.push(`radius_km = $${idx++}`); values.push(updates.radius_km); }
  if (updates.language !== undefined) { fields.push(`language = $${idx++}`); values.push(updates.language); }
  if (updates.expires_at !== undefined) { fields.push(`expires_at = $${idx++}`); values.push(updates.expires_at); }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  try {
    const result = await query(
      `UPDATE alerts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    const alert = result.rows[0];
    broadcast('alert:updated', alert);
    res.json(alert);
  } catch (err) {
    console.error('Failed to update alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE alerts SET status = 'resolved', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    const alert = result.rows[0];
    broadcast('alert:resolved', alert);
    res.json({ message: 'Alert resolved', alert });
  } catch (err) {
    console.error('Failed to resolve alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

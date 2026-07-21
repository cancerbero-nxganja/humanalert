import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '../middleware/auth';
import { CreateMissingPersonSchema, UpdateMissingPersonSchema } from '../validators/missing-person';
import { query } from '../db';
import { broadcast } from '../ws/broadcast';

const router = Router();

router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateMissingPersonSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const {
    first_name, last_name_initial, age_range_min, age_range_max, gender,
    physical_description, last_seen_at, last_seen_location, photo_hash,
    contact_hash, amber_alert, language, expires_at,
  } = parsed.data;

  const id = uuidv4();

  try {
    const result = await query(
      `INSERT INTO missing_persons
         (id, status, first_name, last_name_initial, age_range_min, age_range_max, gender,
          physical_description, last_seen_at, last_seen_lat, last_seen_lon,
          last_seen_location_desc, photo_hash, contact_hash, amber_alert, language, expires_at)
       VALUES ($1,'missing',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id, first_name, last_name_initial, age_range_min, age_range_max, gender,
        physical_description ?? null, last_seen_at,
        last_seen_location.lat, last_seen_location.lon,
        last_seen_location.description ?? null,
        photo_hash ?? null, contact_hash, amber_alert, language, expires_at ?? null,
      ]
    );

    const person = rowToResponse(result.rows[0]);
    const event = amber_alert ? 'missing_person:amber_alert' : 'missing_person:new';
    broadcast(event, person);
    res.status(201).json(person);
  } catch (err) {
    console.error('Failed to create missing person:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
  const lon = req.query.lon ? parseFloat(req.query.lon as string) : null;
  const radius_km = req.query.radius_km ? parseFloat(req.query.radius_km as string) : null;
  const status = (req.query.status as string) ?? 'missing';
  const amber_only = req.query.amber_only === 'true';

  try {
    let result;
    const baseWhere = `status = $1${amber_only ? ' AND amber_alert = TRUE' : ''}`;

    if (lat !== null && lon !== null && radius_km !== null && !isNaN(lat) && !isNaN(lon) && !isNaN(radius_km)) {
      result = await query(
        `SELECT * FROM (
           SELECT *, (6371 * acos(LEAST(1.0, cos(radians($2)) * cos(radians(last_seen_lat)) *
             cos(radians(last_seen_lon) - radians($3)) +
             sin(radians($2)) * sin(radians(last_seen_lat))))) AS distance_km
           FROM missing_persons WHERE ${baseWhere}
         ) sub WHERE distance_km <= $4 ORDER BY amber_alert DESC, created_at DESC LIMIT 200`,
        [status, lat, lon, radius_km]
      );
    } else {
      result = await query(
        `SELECT * FROM missing_persons WHERE ${baseWhere} ORDER BY amber_alert DESC, created_at DESC LIMIT 200`,
        [status]
      );
    }
    res.json(result.rows.map(rowToResponse));
  } catch (err) {
    console.error('Failed to list missing persons:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(`SELECT * FROM missing_persons WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Missing person not found' });
      return;
    }
    res.json(rowToResponse(result.rows[0]));
  } catch (err) {
    console.error('Failed to get missing person:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateMissingPersonSchema.safeParse(req.body);
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

  if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
  if (updates.first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(updates.first_name); }
  if (updates.last_name_initial !== undefined) { fields.push(`last_name_initial = $${idx++}`); values.push(updates.last_name_initial); }
  if (updates.age_range_min !== undefined) { fields.push(`age_range_min = $${idx++}`); values.push(updates.age_range_min); }
  if (updates.age_range_max !== undefined) { fields.push(`age_range_max = $${idx++}`); values.push(updates.age_range_max); }
  if (updates.gender !== undefined) { fields.push(`gender = $${idx++}`); values.push(updates.gender); }
  if (updates.physical_description !== undefined) { fields.push(`physical_description = $${idx++}`); values.push(updates.physical_description); }
  if (updates.last_seen_at !== undefined) { fields.push(`last_seen_at = $${idx++}`); values.push(updates.last_seen_at); }
  if (updates.last_seen_location !== undefined) {
    fields.push(`last_seen_lat = $${idx++}`); values.push(updates.last_seen_location.lat);
    fields.push(`last_seen_lon = $${idx++}`); values.push(updates.last_seen_location.lon);
    fields.push(`last_seen_location_desc = $${idx++}`); values.push(updates.last_seen_location.description ?? null);
  }
  if (updates.photo_hash !== undefined) { fields.push(`photo_hash = $${idx++}`); values.push(updates.photo_hash); }
  if (updates.contact_hash !== undefined) { fields.push(`contact_hash = $${idx++}`); values.push(updates.contact_hash); }
  if (updates.amber_alert !== undefined) { fields.push(`amber_alert = $${idx++}`); values.push(updates.amber_alert); }
  if (updates.language !== undefined) { fields.push(`language = $${idx++}`); values.push(updates.language); }
  if (updates.expires_at !== undefined) { fields.push(`expires_at = $${idx++}`); values.push(updates.expires_at); }

  fields.push('updated_at = NOW()');
  values.push(id);

  try {
    const result = await query(
      `UPDATE missing_persons SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Missing person not found' });
      return;
    }

    const person = rowToResponse(result.rows[0]);
    const event = updates.status === 'found' ? 'missing_person:found' : 'missing_person:updated';
    broadcast(event, person);
    res.json(person);
  } catch (err) {
    console.error('Failed to update missing person:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE missing_persons SET status = 'case_closed', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Missing person not found' });
      return;
    }

    const person = rowToResponse(result.rows[0]);
    broadcast('missing_person:case_closed', person);
    res.json({ message: 'Case closed', person });
  } catch (err) {
    console.error('Failed to close missing person case:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function rowToResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    status: row.status,
    first_name: row.first_name,
    last_name_initial: row.last_name_initial,
    age_range_min: row.age_range_min,
    age_range_max: row.age_range_max,
    gender: row.gender,
    physical_description: row.physical_description ?? undefined,
    last_seen_at: row.last_seen_at,
    last_seen_location: {
      lat: row.last_seen_lat,
      lon: row.last_seen_lon,
      description: row.last_seen_location_desc ?? undefined,
    },
    photo_hash: row.photo_hash ?? undefined,
    contact_hash: row.contact_hash,
    amber_alert: row.amber_alert,
    language: row.language,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at ?? undefined,
  };
}

export default router;

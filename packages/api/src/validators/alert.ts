import { z } from 'zod';

export const AlertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const AlertTypeSchema = z.enum(['emergency', 'warning', 'info', 'missing_person', 'animal', 'community']);
export const AlertStatusSchema = z.enum(['active', 'resolved', 'expired']);

const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const CreateAlertSchema = z.object({
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  location: GeoPointSchema,
  radius_km: z.number().positive().max(500).default(5),
  language: z.string().min(2).max(10).default('en'),
  expires_at: z.string().datetime().optional(),
});

export const UpdateAlertSchema = z.object({
  type: AlertTypeSchema.optional(),
  severity: AlertSeveritySchema.optional(),
  status: AlertStatusSchema.optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(5000).optional(),
  location: GeoPointSchema.optional(),
  radius_km: z.number().positive().max(500).optional(),
  language: z.string().min(2).max(10).optional(),
  expires_at: z.string().datetime().optional(),
});

export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
export type UpdateAlertInput = z.infer<typeof UpdateAlertSchema>;

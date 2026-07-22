import { z } from 'zod';

export const AnimalSpeciesSchema = z.enum(['dog', 'cat', 'bird', 'rabbit', 'horse', 'wildlife', 'other']);
export const AnimalAlertStatusSchema = z.enum(['LOST', 'FOUND', 'REUNITED']);

export const CreateAnimalAlertSchema = z.object({
  species: AnimalSpeciesSchema,
  name: z.string().min(1).max(100).optional(),
  photo_url: z.string().url().max(2048).optional(),
  last_seen_lat: z.number().min(-90).max(90),
  last_seen_lon: z.number().min(-180).max(180),
  contact_hash: z.string().min(1).max(256),
  status: AnimalAlertStatusSchema.default('LOST'),
  description: z.string().max(2000).optional(),
  language: z.string().min(2).max(10).default('en'),
});

export const UpdateAnimalAlertSchema = z.object({
  status: AnimalAlertStatusSchema.optional(),
  description: z.string().max(2000).optional(),
  language: z.string().min(2).max(10).optional(),
});

export const GeoQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().max(500).optional(),
  status: AnimalAlertStatusSchema.optional(),
});

export type CreateAnimalAlertInput = z.infer<typeof CreateAnimalAlertSchema>;
export type UpdateAnimalAlertInput = z.infer<typeof UpdateAnimalAlertSchema>;

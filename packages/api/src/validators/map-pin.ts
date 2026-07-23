import { z } from 'zod';

export const MapPinCategorySchema = z.enum([
  'shelter',
  'water',
  'food',
  'medical',
  'evacuation',
  'danger',
  'community',
  'animal_rescue',
  'other',
]);

export const CreateMapPinSchema = z.object({
  category: MapPinCategorySchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  language: z.string().min(2).max(10).default('en'),
  expires_at: z.string().datetime().optional(),
});

export const UpdateMapPinSchema = z.object({
  category: MapPinCategorySchema.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  language: z.string().min(2).max(10).optional(),
  verified: z.boolean().optional(),
  expires_at: z.string().datetime().optional(),
});

export const MapPinGeoQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().max(500).optional(),
  category: MapPinCategorySchema.optional(),
  include_animal_alerts: z.coerce.boolean().optional(),
});

export type CreateMapPinInput = z.infer<typeof CreateMapPinSchema>;
export type UpdateMapPinInput = z.infer<typeof UpdateMapPinSchema>;

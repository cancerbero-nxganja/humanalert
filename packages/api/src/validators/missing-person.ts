import { z } from 'zod';

const LastSeenLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  description: z.string().max(500).optional(),
});

export const CreateMissingPersonSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name_initial: z.string().length(1).regex(/^[A-Za-z]$/),
  age_range_min: z.number().int().min(0).max(150),
  age_range_max: z.number().int().min(0).max(150),
  gender: z.enum(['male', 'female', 'nonbinary', 'unknown']),
  physical_description: z.string().max(1000).optional(),
  last_seen_at: z.string().datetime(),
  last_seen_location: LastSeenLocationSchema,
  photo_hash: z.string().max(256).optional(),
  contact_hash: z.string().min(1).max(256),
  amber_alert: z.boolean().optional().default(false),
  language: z.string().min(2).max(10).default('en'),
  expires_at: z.string().datetime().optional(),
}).refine(d => d.age_range_max >= d.age_range_min, {
  message: 'age_range_max must be >= age_range_min',
  path: ['age_range_max'],
});

export const UpdateMissingPersonSchema = z.object({
  status: z.enum(['missing', 'found', 'case_closed']).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name_initial: z.string().length(1).regex(/^[A-Za-z]$/).optional(),
  age_range_min: z.number().int().min(0).max(150).optional(),
  age_range_max: z.number().int().min(0).max(150).optional(),
  gender: z.enum(['male', 'female', 'nonbinary', 'unknown']).optional(),
  physical_description: z.string().max(1000).optional(),
  last_seen_at: z.string().datetime().optional(),
  last_seen_location: LastSeenLocationSchema.optional(),
  photo_hash: z.string().max(256).optional(),
  contact_hash: z.string().min(1).max(256).optional(),
  amber_alert: z.boolean().optional(),
  language: z.string().min(2).max(10).optional(),
  expires_at: z.string().datetime().optional(),
});

export type CreateMissingPersonInput = z.infer<typeof CreateMissingPersonSchema>;
export type UpdateMissingPersonInput = z.infer<typeof UpdateMissingPersonSchema>;

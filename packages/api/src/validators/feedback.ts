import { z } from 'zod';

export const FeedbackRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal('thumbs-up'),
  z.literal('thumbs-down'),
]);

export const CreateFeedbackSchema = z.object({
  source: z.enum(['app', 'web', 'landing']),
  context: z.string().min(1).max(500),
  rating: FeedbackRatingSchema,
  message: z.string().max(2000).optional(),
  email: z.string().email().max(255).optional(),
  language: z.string().min(2).max(10).default('en'),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;

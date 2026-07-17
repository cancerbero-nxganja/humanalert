export type FeedbackSource = 'app' | 'web' | 'landing';
export type FeedbackRating = 1 | 2 | 3 | 4 | 5 | 'thumbs-up' | 'thumbs-down';

export interface Feedback {
  id: string;
  source: FeedbackSource;
  context: string;
  rating: FeedbackRating;
  message?: string;
  email?: string;
  language: string;
  created_at: string;
}

export interface CreateFeedbackInput {
  source: FeedbackSource;
  context: string;
  rating: FeedbackRating;
  message?: string;
  email?: string;
  language: string;
}

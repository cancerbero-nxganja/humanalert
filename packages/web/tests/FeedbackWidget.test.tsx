import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FeedbackWidget } from '@/components/FeedbackWidget';

// Mock the API and offline queue
jest.mock('@/lib/api', () => ({
  postFeedback: jest.fn(),
  API_BASE: 'http://localhost:3001',
}));

jest.mock('@/lib/offlineQueue', () => ({
  enqueue: jest.fn(),
  getQueue: jest.fn(() => []),
  dequeue: jest.fn(),
}));

import { postFeedback } from '@/lib/api';
import { enqueue } from '@/lib/offlineQueue';

const mockPost = postFeedback as jest.Mock;
const mockEnqueue = enqueue as jest.Mock;

describe('FeedbackWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (navigator as { onLine: boolean }).onLine = true;
  });

  it('renders rating step initially', () => {
    render(<FeedbackWidget context="test_ctx" language="en" />);
    expect(screen.getByLabelText('Was this helpful?')).toBeInTheDocument();
    expect(screen.getByLabelText('Thumbs up — helpful')).toBeInTheDocument();
    expect(screen.getByLabelText('Thumbs down — not helpful')).toBeInTheDocument();
  });

  it('renders in Spanish', () => {
    render(<FeedbackWidget context="test" language="es" />);
    expect(screen.getByLabelText('¿Fue útil?')).toBeInTheDocument();
  });

  it('renders in Arabic (RTL)', () => {
    render(<FeedbackWidget context="test" language="ar" />);
    expect(screen.getByLabelText('هل كان هذا مفيدًا؟')).toBeInTheDocument();
  });

  it('advances to optional step after thumbs-up', async () => {
    render(<FeedbackWidget context="test_ctx" language="en" />);
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    expect(await screen.findByPlaceholderText('Tell us more (optional)')).toBeInTheDocument();
  });

  it('advances to optional step after thumbs-down', async () => {
    render(<FeedbackWidget context="test_ctx" language="en" />);
    fireEvent.click(screen.getByLabelText('Thumbs down — not helpful'));
    expect(await screen.findByPlaceholderText('Tell us more (optional)')).toBeInTheDocument();
  });

  it('submits feedback with message on form submit', async () => {
    mockPost.mockResolvedValueOnce(true);
    render(<FeedbackWidget context="test_ctx" language="en" />);

    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    const input = await screen.findByPlaceholderText('Tell us more (optional)');
    fireEvent.change(input, { target: { value: 'Very helpful!' } });

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Send'));
    });

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 'thumbs-up', message: 'Very helpful!', context: 'test_ctx' })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Thank you!');
  });

  it('skips to done without message on skip', async () => {
    mockPost.mockResolvedValueOnce(true);
    render(<FeedbackWidget context="test_ctx" language="en" />);
    fireEvent.click(screen.getByLabelText('Thumbs down — not helpful'));
    await screen.findByPlaceholderText('Tell us more (optional)');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Skip'));
    });

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 'thumbs-down', context: 'test_ctx' })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Thank you!');
  });

  it('enqueues to localStorage when offline', async () => {
    (navigator as { onLine: boolean }).onLine = false;
    render(<FeedbackWidget context="test_ctx" language="en" />);
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    await screen.findByPlaceholderText('Tell us more (optional)');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Skip'));
    });

    expect(mockEnqueue).toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('Thank you!');
  });

  it('enqueues when API returns failure', async () => {
    mockPost.mockResolvedValueOnce(false);
    render(<FeedbackWidget context="test_ctx" language="en" />);
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    await screen.findByPlaceholderText('Tell us more (optional)');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Skip'));
    });

    expect(mockEnqueue).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('Thank you!');
  });

  it('enqueues when API throws network error', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));
    render(<FeedbackWidget context="test_ctx" language="en" />);
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    await screen.findByPlaceholderText('Tell us more (optional)');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Skip'));
    });

    expect(mockEnqueue).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('Thank you!');
  });

  it('calls onComplete callback when done', async () => {
    mockPost.mockResolvedValueOnce(true);
    const onComplete = jest.fn();
    render(<FeedbackWidget context="test_ctx" language="en" onComplete={onComplete} />);
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    await screen.findByPlaceholderText('Tell us more (optional)');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Skip'));
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('uses default English labels when no language prop given', () => {
    render(<FeedbackWidget context="test_ctx" />);
    expect(screen.getByLabelText('Was this helpful?')).toBeInTheDocument();
  });

  it('uses className prop when provided', () => {
    render(<FeedbackWidget context="test_ctx" language="en" className="my-custom-class" />);
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('my-custom-class');
  });

  it('falls back to English labels for unknown language', () => {
    render(<FeedbackWidget context="test_ctx" language="xx" />);
    expect(screen.getByLabelText('Was this helpful?')).toBeInTheDocument();
  });

  it('calls onComplete when offline and feedback enqueued', async () => {
    (navigator as { onLine: boolean }).onLine = false;
    const onComplete = jest.fn();
    render(<FeedbackWidget context="test_ctx" language="en" onComplete={onComplete} />);
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    await screen.findByPlaceholderText('Tell us more (optional)');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Skip'));
    });

    expect(mockEnqueue).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('submits form with empty message sending undefined for message', async () => {
    mockPost.mockResolvedValueOnce(true);
    render(<FeedbackWidget context="test_ctx" language="en" />);
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));
    await screen.findByPlaceholderText('Tell us more (optional)');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Send'));
    });

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 'thumbs-up' })
    );
    const call = mockPost.mock.calls[0][0];
    expect(call.message).toBeUndefined();
    expect(await screen.findByRole('status')).toHaveTextContent('Thank you!');
  });

  it('max two interaction steps before done', async () => {
    mockPost.mockResolvedValueOnce(true);
    render(<FeedbackWidget context="test_ctx" language="en" />);

    // Step 1: rating
    expect(screen.getByLabelText('Was this helpful?')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Thumbs up — helpful'));

    // Step 2: optional message
    expect(await screen.findByPlaceholderText('Tell us more (optional)')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Skip'));
    });

    // Done — no more steps
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.queryByLabelText('Was this helpful?')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Tell us more (optional)')).not.toBeInTheDocument();
  });
});

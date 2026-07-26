import React, { useState, useCallback } from 'react';
import { postFeedback, FeedbackPayload } from '@/lib/api';
import { enqueue } from '@/lib/offlineQueue';

type WidgetStep = 'rating' | 'optional' | 'done';

interface FeedbackWidgetProps {
  context: string;
  language?: string;
  onComplete?: () => void;
  className?: string;
}

const LABELS: Record<string, { title: string; placeholder: string; submit: string; thanks: string }> = {
  en: { title: 'Was this helpful?', placeholder: 'Tell us more (optional)', submit: 'Send', thanks: 'Thank you!' },
  es: { title: '¿Fue útil?', placeholder: 'Cuéntanos más (opcional)', submit: 'Enviar', thanks: '¡Gracias!' },
  fr: { title: 'Était-ce utile?', placeholder: 'Dites-nous en plus (facultatif)', submit: 'Envoyer', thanks: 'Merci!' },
  ar: { title: 'هل كان هذا مفيدًا؟', placeholder: 'أخبرنا بالمزيد (اختياري)', submit: 'إرسال', thanks: 'شكراً لك!' },
  pt: { title: 'Foi útil?', placeholder: 'Conte-nos mais (opcional)', submit: 'Enviar', thanks: 'Obrigado!' },
  de: { title: 'War das hilfreich?', placeholder: 'Erzählen Sie uns mehr (optional)', submit: 'Senden', thanks: 'Danke!' },
  zh: { title: '这有帮助吗？', placeholder: '告诉我们更多（可选）', submit: '发送', thanks: '谢谢！' },
  hi: { title: 'क्या यह मददगार था?', placeholder: 'हमें और बताएं (वैकल्पिक)', submit: 'भेजें', thanks: 'धन्यवाद!' },
};

export function FeedbackWidget({ context, language = 'en', onComplete, className = '' }: FeedbackWidgetProps) {
  const [step, setStep] = useState<WidgetStep>('rating');
  const [rating, setRating] = useState<'thumbs-up' | 'thumbs-down' | null>(null);
  const [message, setMessage] = useState('');

  const labels = LABELS[language] ?? LABELS['en'];

  const submitFeedback = useCallback(
    async (thumbRating: 'thumbs-up' | 'thumbs-down', optionalMessage?: string) => {
      const payload: FeedbackPayload = {
        source: 'web',
        context,
        rating: thumbRating,
        language,
        ...(optionalMessage ? { message: optionalMessage } : {}),
      };

      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!online) {
        enqueue(payload as unknown as Record<string, unknown>);
        setStep('done');
        onComplete?.();
        return;
      }

      try {
        const ok = await postFeedback(payload);
        if (!ok) {
          enqueue(payload as unknown as Record<string, unknown>);
        }
      } catch {
        enqueue(payload as unknown as Record<string, unknown>);
      }

      setStep('done');
      onComplete?.();
    },
    [context, language, onComplete]
  );

  const handleThumb = useCallback(
    (thumb: 'thumbs-up' | 'thumbs-down') => {
      setRating(thumb);
      setStep('optional');
    },
    []
  );

  const handleOptionalSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (rating) {
        submitFeedback(rating, message.trim() || undefined);
      }
    },
    [rating, message, submitFeedback]
  );

  const handleSkip = useCallback(() => {
    if (rating) {
      submitFeedback(rating);
    }
  }, [rating, submitFeedback]);

  if (step === 'done') {
    return (
      <aside
        className={`humanalert-feedback humanalert-feedback--done ${className}`}
        role="status"
        aria-live="polite"
        aria-label={labels.thanks}
      >
        <span aria-hidden="true">✓</span> {labels.thanks}
      </aside>
    );
  }

  if (step === 'optional') {
    return (
      <aside
        className={`humanalert-feedback humanalert-feedback--optional ${className}`}
        role="complementary"
        aria-label="Feedback details"
      >
        <form onSubmit={handleOptionalSubmit}>
          <label htmlFor="feedback-message" className="visually-hidden">
            {labels.placeholder}
          </label>
          <input
            id="feedback-message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={labels.placeholder}
            maxLength={500}
            autoFocus
            aria-describedby="feedback-char-count"
          />
          <span id="feedback-char-count" className="visually-hidden">
            {message.length} / 500
          </span>
          <div className="humanalert-feedback__actions">
            <button type="submit" aria-label={labels.submit}>
              {labels.submit}
            </button>
            <button type="button" onClick={handleSkip} aria-label="Skip">
              Skip
            </button>
          </div>
        </form>
      </aside>
    );
  }

  return (
    <aside
      className={`humanalert-feedback humanalert-feedback--rating ${className}`}
      role="complementary"
      aria-label={labels.title}
    >
      <span className="humanalert-feedback__question">{labels.title}</span>
      <div className="humanalert-feedback__thumbs" role="group" aria-label="Rating">
        <button
          type="button"
          onClick={() => handleThumb('thumbs-up')}
          aria-label="Thumbs up — helpful"
          aria-pressed={rating === 'thumbs-up'}
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => handleThumb('thumbs-down')}
          aria-label="Thumbs down — not helpful"
          aria-pressed={rating === 'thumbs-down'}
        >
          👎
        </button>
      </div>
    </aside>
  );
}

export default FeedbackWidget;

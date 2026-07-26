import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const MESSAGES: Record<string, string> = {
  en: 'You are offline. Changes will sync when you reconnect.',
  es: 'Estás desconectado. Los cambios se sincronizarán cuando te reconectes.',
  fr: 'Vous êtes hors ligne. Les modifications seront synchronisées à la reconnexion.',
  ar: 'أنت غير متصل بالإنترنت. ستتم مزامنة التغييرات عند إعادة الاتصال.',
  pt: 'Você está offline. As alterações serão sincronizadas ao reconectar.',
  de: 'Sie sind offline. Änderungen werden bei Wiederverbindung synchronisiert.',
  zh: '您已离线。重新连接后将同步更改。',
  hi: 'आप ऑफलाइन हैं। पुनः कनेक्ट होने पर परिवर्तन सिंक होंगे।',
};

interface OfflineBannerProps {
  language?: string;
}

export function OfflineBanner({ language = 'en' }: OfflineBannerProps) {
  const online = useOnlineStatus();

  if (online) return null;

  const message = MESSAGES[language] ?? MESSAGES['en'];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: '#f59e0b',
        color: '#1c1917',
        padding: '0.5rem 1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}

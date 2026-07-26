import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { getAnimalAlerts } from '@/lib/api';

interface AnimalAlert {
  id: string;
  species: string;
  name?: string;
  photo_url?: string;
  last_seen_lat: number;
  last_seen_lon: number;
  status: 'LOST' | 'FOUND' | 'REUNITED';
  description?: string;
  language: string;
  created_at: string;
}

const PAGE_TEXT: Record<string, { title: string; loading: string; empty: string; lastSeen: string; status: string }> = {
  en: { title: 'Animal Alerts', loading: 'Loading…', empty: 'No animal alerts.', lastSeen: 'Last seen near', status: 'Status' },
  es: { title: 'Alertas de Animales', loading: 'Cargando…', empty: 'No hay alertas de animales.', lastSeen: 'Visto por última vez cerca', status: 'Estado' },
  fr: { title: 'Alertes Animaux', loading: 'Chargement…', empty: 'Aucune alerte animale.', lastSeen: 'Vu pour la dernière fois près de', status: 'Statut' },
  ar: { title: 'تنبيهات الحيوانات', loading: 'جارٍ التحميل…', empty: 'لا توجد تنبيهات حيوانات.', lastSeen: 'آخر مشاهدة قرب', status: 'الحالة' },
  pt: { title: 'Alertas de Animais', loading: 'Carregando…', empty: 'Nenhum alerta de animal.', lastSeen: 'Visto pela última vez perto de', status: 'Status' },
  de: { title: 'Tieralarme', loading: 'Wird geladen…', empty: 'Keine Tieralarme.', lastSeen: 'Zuletzt in der Nähe von gesehen', status: 'Status' },
  zh: { title: '动物警报', loading: '加载中…', empty: '没有动物警报。', lastSeen: '最后一次在附近看到', status: '状态' },
  hi: { title: 'पशु अलर्ट', loading: 'लोड हो रहा है…', empty: 'कोई पशु अलर्ट नहीं।', lastSeen: 'पिछली बार के पास देखा', status: 'स्थिति' },
};

const STATUS_COLORS: Record<string, string> = {
  LOST: '#dc2626',
  FOUND: '#16a34a',
  REUNITED: '#2563eb',
};

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  bird: '🐦',
  rabbit: '🐇',
  other: '🐾',
};

const AnimalAlertsPage: NextPage = () => {
  const router = useRouter();
  const locale = router.locale ?? 'en';
  const text = PAGE_TEXT[locale] ?? PAGE_TEXT['en'];

  const [alerts, setAlerts] = useState<AnimalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    getAnimalAlerts({ status: 'LOST' })
      .then((data) => {
        setAlerts(data as AnimalAlert[]);
        setLoading(false);
        setShowFeedback(true);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <header>
        <nav aria-label="Primary navigation">
          <Link href="/">HumanAlert</Link>
          <span>/ {text.title}</span>
        </nav>
      </header>
      <main id="main-content">
        <div className="page-container">
          <h1>{text.title}</h1>

          {loading && <p role="status" aria-live="polite">{text.loading}</p>}

          {!loading && alerts.length === 0 && <p>{text.empty}</p>}

          <ul aria-label={text.title} style={{ listStyle: 'none', padding: 0 }}>
            {alerts.map((alert) => (
              <li
                key={alert.id}
                style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: `1px solid ${STATUS_COLORS[alert.status] ?? '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '2rem' }} aria-hidden="true">
                  {SPECIES_EMOJI[alert.species] ?? SPECIES_EMOJI['other']}
                </span>
                <div>
                  <strong>{alert.name ?? alert.species}</strong>
                  <span
                    style={{
                      marginInlineStart: '0.5rem',
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      background: STATUS_COLORS[alert.status] ?? '#e5e7eb',
                      color: '#fff',
                    }}
                  >
                    {text.status}: {alert.status}
                  </span>
                  {alert.description && (
                    <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>{alert.description}</p>
                  )}
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                    {text.lastSeen} {alert.last_seen_lat.toFixed(4)}, {alert.last_seen_lon.toFixed(4)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {showFeedback && (
            <section aria-label="Feedback" style={{ marginTop: '2rem' }}>
              <FeedbackWidget context="animal_alerts_page" language={locale} />
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default AnimalAlertsPage;

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { getAlerts } from '@/lib/api';

interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  latitude?: number;
  longitude?: number;
  language: string;
  created_at: string;
}

const PAGE_TEXT: Record<string, { title: string; loading: string; empty: string; severity: string }> = {
  en: { title: 'Active Alerts', loading: 'Loading alerts…', empty: 'No active alerts.', severity: 'Severity' },
  es: { title: 'Alertas Activas', loading: 'Cargando alertas…', empty: 'No hay alertas activas.', severity: 'Gravedad' },
  fr: { title: 'Alertes actives', loading: 'Chargement des alertes…', empty: 'Aucune alerte active.', severity: 'Gravité' },
  ar: { title: 'التنبيهات النشطة', loading: 'جارٍ تحميل التنبيهات…', empty: 'لا توجد تنبيهات نشطة.', severity: 'الخطورة' },
  pt: { title: 'Alertas Ativos', loading: 'Carregando alertas…', empty: 'Nenhum alerta ativo.', severity: 'Gravidade' },
  de: { title: 'Aktive Alarme', loading: 'Alarme werden geladen…', empty: 'Keine aktiven Alarme.', severity: 'Schwere' },
  zh: { title: '活动警报', loading: '正在加载警报…', empty: '没有活动警报。', severity: '严重性' },
  hi: { title: 'सक्रिय अलर्ट', loading: 'अलर्ट लोड हो रहे हैं…', empty: 'कोई सक्रिय अलर्ट नहीं।', severity: 'गंभीरता' },
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#16a34a',
};

const AlertsPage: NextPage = () => {
  const router = useRouter();
  const locale = router.locale ?? 'en';
  const text = PAGE_TEXT[locale] ?? PAGE_TEXT['en'];

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    getAlerts({ status: 'ACTIVE' })
      .then((data) => {
        setAlerts(data as Alert[]);
        setLoading(false);
        setShowFeedback(true);
      })
      .catch(() => {
        setError('Unable to load alerts. You may be offline.');
        setLoading(false);
      });
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
          {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}

          {!loading && !error && alerts.length === 0 && (
            <p>{text.empty}</p>
          )}

          <ul aria-label={text.title} style={{ listStyle: 'none', padding: 0 }}>
            {alerts.map((alert) => (
              <li
                key={alert.id}
                style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: `2px solid ${SEVERITY_COLORS[alert.severity] ?? '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                }}
              >
                <strong>{alert.title}</strong>
                <span
                  style={{
                    marginInlineStart: '0.75rem',
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    background: SEVERITY_COLORS[alert.severity] ?? '#e5e7eb',
                    color: '#fff',
                  }}
                >
                  {text.severity}: {alert.severity}
                </span>
                <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>{alert.description}</p>
              </li>
            ))}
          </ul>

          {showFeedback && (
            <section aria-label="Feedback" style={{ marginTop: '2rem' }}>
              <FeedbackWidget context="alerts_page" language={locale} />
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default AlertsPage;

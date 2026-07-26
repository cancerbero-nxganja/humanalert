import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { getMissingPersons } from '@/lib/api';

interface MissingPerson {
  id: string;
  full_name: string;
  age?: number;
  description?: string;
  last_seen_at?: string;
  status: string;
  created_at: string;
}

const PAGE_TEXT: Record<string, { title: string; loading: string; empty: string; age: string; lastSeen: string }> = {
  en: { title: 'Missing Persons', loading: 'Loading…', empty: 'No missing persons reports.', age: 'Age', lastSeen: 'Last seen' },
  es: { title: 'Personas Desaparecidas', loading: 'Cargando…', empty: 'No hay reportes de personas desaparecidas.', age: 'Edad', lastSeen: 'Visto por última vez' },
  fr: { title: 'Personnes Disparues', loading: 'Chargement…', empty: 'Aucun rapport de personne disparue.', age: 'Âge', lastSeen: 'Vu pour la dernière fois' },
  ar: { title: 'أشخاص مفقودون', loading: 'جارٍ التحميل…', empty: 'لا توجد تقارير عن أشخاص مفقودين.', age: 'العمر', lastSeen: 'آخر مشاهدة' },
  pt: { title: 'Pessoas Desaparecidas', loading: 'Carregando…', empty: 'Nenhum relato de pessoa desaparecida.', age: 'Idade', lastSeen: 'Visto pela última vez' },
  de: { title: 'Vermisste Personen', loading: 'Wird geladen…', empty: 'Keine Vermisstenmeldungen.', age: 'Alter', lastSeen: 'Zuletzt gesehen' },
  zh: { title: '失踪人员', loading: '加载中…', empty: '没有失踪人员报告。', age: '年龄', lastSeen: '最后一次见到' },
  hi: { title: 'लापता व्यक्ति', loading: 'लोड हो रहा है…', empty: 'कोई लापता व्यक्ति रिपोर्ट नहीं।', age: 'आयु', lastSeen: 'आखिरी बार देखा' },
};

const MissingPersonsPage: NextPage = () => {
  const router = useRouter();
  const locale = router.locale ?? 'en';
  const text = PAGE_TEXT[locale] ?? PAGE_TEXT['en'];

  const [persons, setPersons] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    getMissingPersons({ status: 'MISSING' })
      .then((data) => {
        setPersons(data as MissingPerson[]);
        setLoading(false);
        setShowFeedback(true);
      })
      .catch(() => {
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

          {!loading && persons.length === 0 && <p>{text.empty}</p>}

          <ul aria-label={text.title} style={{ listStyle: 'none', padding: 0 }}>
            {persons.map((person) => (
              <li
                key={person.id}
                style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  borderInlineStart: '4px solid #ea580c',
                }}
              >
                <strong style={{ fontSize: '1.125rem' }}>{person.full_name}</strong>
                {person.age && (
                  <span style={{ marginInlineStart: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    {text.age}: {person.age}
                  </span>
                )}
                {person.description && <p style={{ margin: '0.5rem 0 0' }}>{person.description}</p>}
                {person.last_seen_at && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    {text.lastSeen}: {new Date(person.last_seen_at).toLocaleDateString(locale)}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {showFeedback && (
            <section aria-label="Feedback" style={{ marginTop: '2rem' }}>
              <FeedbackWidget context="missing_persons_page" language={locale} />
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default MissingPersonsPage;

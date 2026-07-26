import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { FeedbackWidget } from '@/components/FeedbackWidget';

// Leaflet must be dynamically imported (no SSR) — it requires window
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <p>Loading map…</p> });

const PAGE_TEXT: Record<string, { title: string }> = {
  en: { title: 'Solidarity Map' },
  es: { title: 'Mapa Solidario' },
  fr: { title: 'Carte Solidaire' },
  ar: { title: 'خريطة التضامن' },
  pt: { title: 'Mapa Solidário' },
  de: { title: 'Solidaritätskarte' },
  zh: { title: '团结地图' },
  hi: { title: 'एकजुटता मानचित्र' },
};

const MapPage: NextPage = () => {
  const router = useRouter();
  const locale = router.locale ?? 'en';
  const text = PAGE_TEXT[locale] ?? PAGE_TEXT['en'];

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
          <div style={{ height: '60vh', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <MapView />
          </div>
          <section aria-label="Feedback" style={{ marginTop: '1.5rem' }}>
            <FeedbackWidget context="map_page" language={locale} />
          </section>
        </div>
      </main>
    </>
  );
};

export default MapPage;

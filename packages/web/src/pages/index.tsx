import type { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FeedbackWidget } from '@/components/FeedbackWidget';

const HERO_TEXT: Record<string, { title: string; subtitle: string; mission: string }> = {
  en: {
    title: 'HumanAlert',
    subtitle: 'Technology to make humans more human.',
    mission: 'Together as a species, this planet is our home, animals are free beings. 100% donated to humanitarian causes.',
  },
  es: {
    title: 'HumanAlert',
    subtitle: 'Tecnología para que los humanos sean más humanos.',
    mission: 'Solos nos tenemos como especie, el planeta es nuestra casa, los animales son seres libres. 100% donado a causas humanitarias.',
  },
  fr: {
    title: 'HumanAlert',
    subtitle: 'La technologie pour rendre les humains plus humains.',
    mission: 'Ensemble en tant qu\'espèce, cette planète est notre maison, les animaux sont des êtres libres. 100% reversé à des causes humanitaires.',
  },
  ar: {
    title: 'تنبيه إنساني',
    subtitle: 'تكنولوجيا تجعل البشر أكثر إنسانية.',
    mission: 'معاً كنوع بشري، هذا الكوكب بيتنا، والحيوانات كائنات حرة. 100٪ مُتبرَّع به للأعمال الإنسانية.',
  },
  pt: {
    title: 'HumanAlert',
    subtitle: 'Tecnologia para tornar os humanos mais humanos.',
    mission: 'Juntos como espécie, este planeta é nossa casa, os animais são seres livres. 100% doado a causas humanitárias.',
  },
  de: {
    title: 'HumanAlert',
    subtitle: 'Technologie, die Menschen menschlicher macht.',
    mission: 'Gemeinsam als Spezies, dieser Planet ist unser Zuhause, Tiere sind freie Wesen. 100% für humanitäre Zwecke gespendet.',
  },
  zh: {
    title: 'HumanAlert',
    subtitle: '让人类更有人情味的技术。',
    mission: '作为一个物种共同生存，这个星球是我们的家，动物是自由的生命。100%捐赠给人道主义事业。',
  },
  hi: {
    title: 'HumanAlert',
    subtitle: 'मनुष्यों को अधिक मानवीय बनाने की तकनीक।',
    mission: 'एक प्रजाति के रूप में साथ, यह ग्रह हमारा घर है, जानवर स्वतंत्र प्राणी हैं। 100% मानवीय कारणों को दान।',
  },
};

const NAV: Record<string, Record<string, string>> = {
  en: { alerts: 'Alerts', missing: 'Missing Persons', animals: 'Animal Alerts', map: 'Map' },
  es: { alerts: 'Alertas', missing: 'Personas Desaparecidas', animals: 'Alertas Animales', map: 'Mapa' },
  fr: { alerts: 'Alertes', missing: 'Personnes Disparues', animals: 'Alertes Animaux', map: 'Carte' },
  ar: { alerts: 'تنبيهات', missing: 'أشخاص مفقودون', animals: 'تنبيهات الحيوانات', map: 'خريطة' },
  pt: { alerts: 'Alertas', missing: 'Pessoas Desaparecidas', animals: 'Alertas de Animais', map: 'Mapa' },
  de: { alerts: 'Alarme', missing: 'Vermisste Personen', animals: 'Tieralarme', map: 'Karte' },
  zh: { alerts: '警报', missing: '失踪人员', animals: '动物警报', map: '地图' },
  hi: { alerts: 'अलर्ट', missing: 'लापता व्यक्ति', animals: 'पशु अलर्ट', map: 'नक्शा' },
};

interface HomeProps {
  locale: string;
}

const Home: NextPage<HomeProps> = ({ locale }) => {
  const router = useRouter();
  const l = router.locale ?? locale;
  const text = HERO_TEXT[l] ?? HERO_TEXT['en'];
  const nav = NAV[l] ?? NAV['en'];

  return (
    <>
      <header>
        <nav aria-label="Primary navigation">
          <strong style={{ marginInlineEnd: '1rem' }}>
            <Link href="/" aria-current="page">HumanAlert</Link>
          </strong>
          <Link href="/alerts">{nav.alerts}</Link>
          <Link href="/missing-persons">{nav.missing}</Link>
          <Link href="/animal-alerts">{nav.animals}</Link>
          <Link href="/map">{nav.map}</Link>
          <span style={{ marginInlineStart: 'auto' }}>
            <LanguageSwitcher />
          </span>
        </nav>
      </header>

      <main id="main-content">
        <div className="page-container">
          <section aria-labelledby="hero-title" style={{ padding: '3rem 0', textAlign: 'center' }}>
            <h1 id="hero-title" style={{ fontSize: '2.5rem', color: '#dc2626' }}>{text.title}</h1>
            <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{text.subtitle}</p>
            <p style={{ maxWidth: '600px', margin: '0 auto', color: '#6b7280' }}>{text.mission}</p>
          </section>

          <section aria-labelledby="actions-title" style={{ padding: '2rem 0' }}>
            <h2 id="actions-title" className="visually-hidden">Quick actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Link
                href="/alerts"
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: '#fef2f2',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: '#1c1917',
                  border: '1px solid #fecaca',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🚨</span>
                <p style={{ fontWeight: 600, margin: '0.5rem 0 0' }}>{nav.alerts}</p>
              </Link>
              <Link
                href="/missing-persons"
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: '#fff7ed',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: '#1c1917',
                  border: '1px solid #fed7aa',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🔍</span>
                <p style={{ fontWeight: 600, margin: '0.5rem 0 0' }}>{nav.missing}</p>
              </Link>
              <Link
                href="/animal-alerts"
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: '#f0fdf4',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: '#1c1917',
                  border: '1px solid #bbf7d0',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🐾</span>
                <p style={{ fontWeight: 600, margin: '0.5rem 0 0' }}>{nav.animals}</p>
              </Link>
              <Link
                href="/map"
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: '#eff6ff',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: '#1c1917',
                  border: '1px solid #bfdbfe',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🗺️</span>
                <p style={{ fontWeight: 600, margin: '0.5rem 0 0' }}>{nav.map}</p>
              </Link>
            </div>
          </section>

          <section aria-label="Feedback" style={{ padding: '2rem 0' }}>
            <FeedbackWidget context="home_page" language={l} />
          </section>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return { props: { locale: locale ?? 'en' } };
};

export default Home;

import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { getDir } from '@/lib/i18n';
import { useFeedbackSync } from '@/hooks/useFeedbackSync';
import { SkipLink } from '@/components/SkipLink';
import { OfflineBanner } from '@/components/OfflineBanner';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const locale = router.locale ?? 'en';
  const dir = getDir(locale);

  useFeedbackSync();

  return (
    <div dir={dir} lang={locale}>
      <SkipLink />
      <OfflineBanner language={locale} />
      <Component {...pageProps} />
    </div>
  );
}

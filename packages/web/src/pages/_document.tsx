import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#dc2626" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="description" content="HumanAlert — tecnología para que los humanos sean más humanos" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

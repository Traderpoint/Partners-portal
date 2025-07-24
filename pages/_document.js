import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="cs">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Meta tags */}
        <meta name="description" content="Systrix - Profesionální cloudové řešení pro vaše podnikání. Výkonné VPS servery, spolehlivost 99,9% a odborná podpora." />
        <meta name="keywords" content="Systrix, cloud hosting, VPS, servery, hosting, cloudové řešení" />
        <meta name="author" content="Systrix" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Systrix - Cloud & VPS Hosting" />
        <meta property="og:description" content="Profesionální cloudové řešení pro vaše podnikání. Výkonné VPS servery, spolehlivost 99,9% a odborná podpora." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://systrix.cz" />
        <meta property="og:image" content="https://systrix.cz/systrix-logo.svg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Systrix - Cloud & VPS Hosting" />
        <meta name="twitter:description" content="Profesionální cloudové řešení pro vaše podnikání." />
        <meta name="twitter:image" content="https://systrix.cz/systrix-logo.svg" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#0077ff" />
        <meta name="msapplication-TileColor" content="#0077ff" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

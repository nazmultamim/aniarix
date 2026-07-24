import Navbar from "@/components/ui/Navbar.home";
import PwaRegister from "@/components/pwa/PwaRegister";
import { getCanonicalUrl, siteConfig } from "@/lib/site-config";

export async function generateMetadata() {
  const siteName = siteConfig.name;
  const description = siteConfig.description;

  return {
    metadataBase: new URL(getCanonicalUrl('/')),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: siteConfig.keywords,
    alternates: {
      canonical: '/',
    },
    manifest: '/site.webmanifest',
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: ['/favicon.ico'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      url: getCanonicalUrl('/'),
      images: ['/og.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
      images: ['/og.png'],
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: 'black-translucent',
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'application-name': siteName,
    },
  };
}

export default function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <PwaRegister />
      {children}

    </>
  );
}

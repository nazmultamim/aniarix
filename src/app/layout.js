import { Poppins } from "next/font/google";
import "./globals.css";
import { getCanonicalUrl, siteConfig } from "@/lib/site-config";
// import AntiInspectGuard from "@/components/security/AntiInspectGuard";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // choose what you need
});

export const metadata = {
  metadataBase: new URL(getCanonicalUrl('/')),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: 'Discover thousands of anime on AniArix. Watch HD anime online, explore trending and seasonal releases, and enjoy a fast, modern anime streaming experience.',
    url: getCanonicalUrl('/'),
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },

};

export const viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={` ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* <AntiInspectGuard /> */}
        {children}
      </body>
    </html>
  );
}

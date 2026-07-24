export const siteConfig = {
  name: 'AniArix',
  shortName: 'AniArix',
  description: 'Stream anime, watch episodes, and discover shows with AniArix.',
  keywords: [
    'anime',
    'stream anime',
    'watch anime',
    'AniList',
    'anime episodes',
    'anime streaming',
    'AniArix',
  ],
  themeColor: '#0f1116',
  backgroundColor: '#09090b',
  startUrl: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
};

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.SITE_URL}` : 'http://localhost:3000')
  );
}

export function getCanonicalUrl(pathname = '/') {
  const baseUrl = getSiteUrl();
  return new URL(pathname, baseUrl).toString();
}

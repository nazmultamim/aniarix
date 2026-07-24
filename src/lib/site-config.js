export const siteConfig = {
  name: 'AniArix – Watch Anime Online Free | Stream HD Anime',
  shortName: 'AniArix',

  description:
    'Watch anime online for free on AniArix. Stream the latest seasonal anime, top-rated series, trending titles, and classic favorites in HD. Discover thousands of anime with fast search, detailed information powered by AniList, and a modern streaming experience.',

  keywords: [
    'AniArix',
    'anime streaming',
    'watch anime online',
    'anime online',
    'watch anime free',
    'Hianime',
    'aniewave',
    'anime straming platform',
    'anime episodes',
    'anime series',
    'anime movies',
    'HD anime',
    'sub anime',
    'dub anime',
    'english dubbed anime',
    'anime streaming website',
    'top rated anime',
    'seasonal anime',
    'latest anime',
    'new anime',
    'action anime',
    'romance anime',
    'comedy anime',
    'fantasy anime',
    'isekai anime',
    'shounen anime',
    'slice of life anime',
    'AniList anime',
    'anime watch online',
  ],

  themeColor: '#0f1116',
  backgroundColor: '#09090b',

  startUrl: '/home',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
};

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  );
}

export function getCanonicalUrl(pathname = '/') {
  const baseUrl = getSiteUrl();
  return new URL(pathname, baseUrl).toString();
}

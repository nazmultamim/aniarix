import { redirect } from 'next/navigation';
import { getAnimeOgPayload } from '@/lib/og/anime';
import { getAnimeDetailAction, getSelectedAnimeCacheAction } from '@/lib/action/Getanimeaction';
import { slugify } from '@/lib/slugify';
import { getCanonicalUrl, siteConfig } from '@/lib/site-config';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const anilistId = resolvedParams?.anilist_id ?? resolvedParams?.anilistId ?? null;

  if (!anilistId) {
    return {
      title: 'AniArix',
      description: siteConfig.description,
      alternates: {
        canonical: getCanonicalUrl('/anime'),
      },
    };
  }

  const anime = await getAnimeOgPayload(anilistId);
  const displayTitle = anime.title || `AniArix #${anilistId}`;
  const japaneseTitle = anime.japaneseTitle ? ` (${anime.japaneseTitle})` : '';
  const imageUrl = anime.bannerUrl || null;
  const socialImages = imageUrl ? [imageUrl] : [];
  const canonicalPath = `/anime/${encodeURIComponent(String(anilistId))}`;

  return {
    title: `${displayTitle} | AniArix`,
    description: `${displayTitle}${japaneseTitle} on AniArix.`,
    alternates: {
      canonical: getCanonicalUrl(canonicalPath),
    },
    openGraph: {
      title: `${displayTitle} | AniArix`,
      description: `${displayTitle}${japaneseTitle} on AniArix.`,
      url: getCanonicalUrl(canonicalPath),
      images: socialImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayTitle} | AniArix`,
      description: `${displayTitle}${japaneseTitle} on AniArix.`,
      images: socialImages,
    },
  };
}

export default async function AnimeRedirectPage({ params }) {
  const resolvedParams = await params;
  const anilistId = resolvedParams?.anilist_id ?? resolvedParams?.anilistId ?? null;

  if (!anilistId) {
    redirect('/anime');
  }

  const { anime: cachedAnime } = await getSelectedAnimeCacheAction(anilistId);
  const { anime: fetchedAnime } = await getAnimeDetailAction(anilistId);
  const anime = fetchedAnime ? { ...(cachedAnime || {}), ...fetchedAnime } : cachedAnime;
  const slug = anime?.slug || slugify(anime?.title_english || anime?.title || String(anilistId));

  redirect(`/watch/${slug}/ep-1`);
}

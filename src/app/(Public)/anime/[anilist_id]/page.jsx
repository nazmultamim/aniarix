import { redirect } from 'next/navigation';
import { getAnimeOgPayload } from '@/lib/og/anime';
import { getAnimeDetailAction, getSelectedAnimeCacheAction } from '@/lib/action/Getanimeaction';
import { slugify } from '@/lib/slugify';
import { getCanonicalUrl, siteConfig } from '@/lib/site-config';
import AnimeDetail from '@/components/layout/AnimeDetail';

function resolveRouteIdentity(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = String(raw || '').trim();
  if (!normalized) return null;

  const malMatch = normalized.match(/^mal-(\d+)$/i);
  if (malMatch) return { anilistId: null, malId: malMatch[1], routeValue: `mal-${malMatch[1]}` };
  if (/^\d+$/.test(normalized)) return { anilistId: normalized, malId: null, routeValue: normalized };
  return null;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const identity = resolveRouteIdentity(resolvedParams?.anilist_id ?? resolvedParams?.anilistId);

  if (!identity) {
    return {
      title: 'AniArix',
      description: siteConfig.description,
      alternates: {
        canonical: getCanonicalUrl('/anime'),
      },
    };
  }

  const anime = await getAnimeOgPayload(identity);
  const displayTitle = anime.title || `AniArix #${identity.anilistId || identity.malId}`;
  const japaneseTitle = anime.japaneseTitle ? ` (${anime.japaneseTitle})` : '';
  const imageUrl = anime.bannerUrl || null;
  const socialImages = imageUrl ? [imageUrl] : [];
  const canonicalPath = `/anime/${encodeURIComponent(identity.routeValue)}`;

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
  const identity = resolveRouteIdentity(resolvedParams?.anilist_id ?? resolvedParams?.anilistId);

  if (!identity) {
    redirect('/anime');
  }

  const { anime: cachedAnime } = identity.anilistId
    ? await getSelectedAnimeCacheAction(identity.anilistId)
    : { anime: null };
  const { anime: fetchedAnime } = await getAnimeDetailAction(identity);
  const anime = fetchedAnime ? { ...(cachedAnime || {}), ...fetchedAnime } : cachedAnime;
  const slug = anime?.slug || slugify(anime?.title_english || anime?.title || String(identity.anilistId || identity.malId));

  if (!anime) {
    redirect('/anime');
  }

  // Keep all existing numeric AniList bookmarks on the established redirect
  // path. MAL-only records render the same detail UI without inventing an
  // AniList ID or creating an invalid watch link.
  if (!anime.anilist_id) {
    return <AnimeDetail anime={anime} />;
  }

  redirect(`/watch/${slug}/ep-1`);
}

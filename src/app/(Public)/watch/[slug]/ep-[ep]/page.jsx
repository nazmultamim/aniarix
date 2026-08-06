import { Suspense } from 'react';
import { MdLiveTv } from "react-icons/md";
import WatchPlayer from '@/components/layout/WatchPlayer';
import AnimeSynopsis from '@/components/ui/AnimeSynopsis';
import RelatedAnime from '@/components/layout/Relatedanime';
import { getAnimeDetailAction, getAnimeIdBySlugAction, getSelectedAnimeCacheAction } from '@/lib/action/Getanimeaction';
import { getAnimeOgPayload } from '@/lib/og/anime';
import { getCanonicalUrl, siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';


function getFirst(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseEpisodeParam(value) {
  const raw = String(getFirst(value) || '1').trim();
  const normalized = raw.replace(/^ep-/i, '');
  return parseInt(normalized, 10) || 1;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = getFirst(resolvedParams?.slug) || null;
  const episode = parseEpisodeParam(resolvedParams?.ep);

  if (!slug) {
    return {
      title: 'Now Watching |',
      description: siteConfig.description,
      alternates: { canonical: getCanonicalUrl('/watch') },
    };
  }

  const { anilistId } = await getAnimeIdBySlugAction(slug);

  if (!anilistId) {
    return {
      title: 'Now Watching |',
      description: siteConfig.description,
      alternates: { canonical: getCanonicalUrl(`/watch/${slug}/ep-${episode}`) },
    };
  }

  const anime = await getAnimeOgPayload(anilistId);
  const displayTitle = anime.title || 'Now Watching';
  const japaneseTitle = anime.japaneseTitle ? ` (${anime.japaneseTitle})` : '';
  const imageUrl = anime.bannerUrl || null;
  const socialImages = imageUrl ? [imageUrl] : [];
  const canonicalPath = `/watch/${slug}/ep-${episode}`;

  return {
    title: `${displayTitle}`,
    description: `${displayTitle}${japaneseTitle} on AniArix.`,
    alternates: {
      canonical: getCanonicalUrl(canonicalPath),
    },
    openGraph: {
      title: `${displayTitle}`,
      description: `${displayTitle}${japaneseTitle} on AniArix.`,
      url: getCanonicalUrl(canonicalPath),
      images: socialImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayTitle}`,
      description: `${displayTitle}${japaneseTitle} on AniArix.`,
      images: socialImages,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

function MetaLine({ label, value }) {
  if (!value) return null;
  return (
    <li className="py-1 text-[12.5px] sm:text-[13px] leading-relaxed">
      <span className="font-semibold text-white">{label}: </span>
      <span className="text-[#9a9aa2]">{value}</span>
    </li>
  );
}

export default async function WatchPage({ params }) {
  const resolvedParams = await params;
  const slug = getFirst(resolvedParams?.slug) || null;
  const episode = parseEpisodeParam(resolvedParams?.ep);

  let anilistId = null;
  let anime = null;
  let error = null;

  if (slug) {
    const idResult = await getAnimeIdBySlugAction(slug);

    if (idResult?.anilistId) {
      anilistId = idResult.anilistId;
      const { anime: cachedAnime } = await getSelectedAnimeCacheAction(anilistId);
      const { anime: fetchedAnime, error: fetchError } = await getAnimeDetailAction(anilistId);
      anime = fetchedAnime ? { ...(cachedAnime || {}), ...fetchedAnime } : cachedAnime;
      if (fetchError) error = fetchError;
    }
  }

  const displayTitle = anime?.title_english || anime?.title || 'Now Watching';
  const posterUrl = anime?.poster_image || 'https://placehold.co/600x900/111111/f97316?text=No+Image';
  const genres = anime?.genres || [];
  const episodeCount = anime?.episodes || 1;
  const synopsis = anime?.synopsis || 'No synopsis available for this title.';

  const typeLabel = anime?.type || 'TV';
  const statusLabel = anime?.status ? String(anime.status).toUpperCase() : 'N/A';
  const isReleasing = statusLabel === 'RELEASING';
  const yearLabel =
    anime?.season_year ||
    (anime?.aired_from ? new Date(anime.aired_from).getFullYear() : null) ||
    'N/A';
  const seasonLabel = anime?.season ? String(anime.season).toUpperCase() : 'N/A';
  const countryLabel = anime?.country_of_origin ? String(anime.country_of_origin).toUpperCase() : 'N/A';
  const durationLabel = anime?.duration ? `${anime.duration}` : 'N/A';
  const popularityLabel = anime?.popularity != null ? `${Number(anime.popularity).toLocaleString()}` : '0';

  const metaRows = [
    { label: 'Type', value: 'ANIME' },
    { label: 'Season', value: seasonLabel },
    { label: 'Country', value: countryLabel },
    { label: 'Duration', value: durationLabel },
    { label: 'Popularity', value: popularityLabel },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#09090b] text-[#d4d4d8]">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-8">
          <section className="overflow-hidden">
            <div className="relative p-2 md:p-6">
              <div className="relative">
                {anilistId ? (
                  <Suspense
                    fallback={
                      <div className="aspect-video w-full animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02] md:rounded-[22px]" />
                    }
                  >
                    <WatchPlayer
                      key={`${anilistId}-${episode}`}
                      initialAnime={anime}
                      initialAnimeId={anilistId}
                      initialEpisode={episode}
                    />
                  </Suspense>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-xl border border-white/[0.05] bg-black/40 text-center md:rounded-[22px]">
                    <div>
                      <p className="text-xl font-medium text-white">No anime selected</p>
                      <p className="mt-2 text-sm text-[#a1a1aa]">
                        We could not resolve this slug. Try browsing anime again.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Related anime — sequels, prequels, side stories */}
          <RelatedAnime relations={anime?.relations} />

          {/* Anime Details section */}
          <section className="rounded-2xl border border-white/[0.06] bg-[#0f0f13] p-4 font-display shadow-xl sm:p-6 md:rounded-[28px] md:p-8">
            <div className="flex gap-4 sm:gap-6 md:gap-8">
              <div className="w-[130px] shrink-0 sm:w-[150px] md:w-[170px]">
                <div className="relative overflow-hidden rounded-xl ring-1 ring-white/[0.08] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]">
                  <img
                    src={posterUrl}
                    alt={displayTitle}
                    style={{ aspectRatio: '2 / 3' }}
                    className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="break-words text-[19px] font-semibold leading-tight tracking-tight text-white sm:text-[22px] md:text-[28px]">
                    {displayTitle}
                  </h1>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8a8a92] sm:text-[13px]">
                  <span>{typeLabel}</span>
                  <span>·</span>
                  <span className={isReleasing ? 'font-semibold text-emerald-400' : 'font-semibold text-[#a1a1aa]'}>
                    {statusLabel}
                  </span>
                  <span>·</span>
                  <span>{yearLabel}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MdLiveTv className="h-3.5 w-3.5 mb-1.5 text-orange-400" />
                    {episodeCount}
                  </span>
                </div>

                {error && (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {error}
                  </div>
                )}

                <ul className="mt-3">
                  {metaRows.map((row) => (
                    <MetaLine key={row.label} {...row} />
                  ))}
                </ul>


              </div>

            </div>
            <div className="mt-3 flex  gap-2">
              {genres.length > 0 ? (
                genres.map((genre) => (
                  <span
                    key={genre}
                    className="cursor-pointer rounded-md border border-[#f09527]/40 px-2.5 py-1 text-[11.5px] text-[#f39933] transition-colors hover:bg-[#f0982e]/10 sm:text-[12px]"
                  >
                    {genre}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-[#52525b]">No genres</span>
              )}
            </div>
            <AnimeSynopsis synopsis={synopsis} />
          </section>
        </div>
      </div>
    </main>
  );
}
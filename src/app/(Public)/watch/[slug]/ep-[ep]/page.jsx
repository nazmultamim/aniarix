import { Suspense } from 'react';
import { Star, StarHalf } from 'lucide-react';
import WatchPlayer from '@/components/layout/WatchPlayer';
import { getAnimeDetailAction, getAnimeIdBySlugAction, getSelectedAnimeCacheAction } from '@/lib/action/Getanimeaction';
import { getAnimeOgPayload } from '@/lib/og/anime';
import { getCanonicalUrl, siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';


function getFirst(value) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = getFirst(resolvedParams?.slug) || null;
  const episode = parseInt(String(getFirst(resolvedParams?.ep) || '1'), 10) || 1;

  if (!slug) {
    return {
      title: 'Now Watching | AniArix',
      description: siteConfig.description,
      alternates: { canonical: getCanonicalUrl('/watch') },
    };
  }

  const { anilistId } = await getAnimeIdBySlugAction(slug);

  if (!anilistId) {
    return {
      title: 'Now Watching | AniArix',
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

function formatDateLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatSeasonLabel(season, seasonYear) {
  if (!season && !seasonYear) return null;
  const readableSeason = season
    ? String(season).toLowerCase().replace(/^./, (char) => char.toUpperCase())
    : null;
  return [readableSeason, seasonYear].filter(Boolean).join(' ');
}

function formatCountry(value) {
  if (!value) return null;
  const normalized = String(value).toUpperCase();
  const countries = {
    JP: 'Japan',
    US: 'United States',
    KR: 'South Korea',
    CN: 'China',
  };
  return countries[normalized] || normalized;
}

function joinNames(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.filter(Boolean).join(', ');
}

function StarRating({ rawScore }) {
  if (rawScore == null || Number.isNaN(rawScore)) return null;
  const ratingOutOf5 = Math.max(0, Math.min(5, rawScore / 20));
  const rounded = Math.round(ratingOutOf5 * 2) / 2;
  const fullStars = Math.floor(rounded);
  const hasHalf = rounded - fullStars === 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
      {hasHalf && <StarHalf className="h-4 w-4 fill-amber-400 text-amber-400" />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-white/15" />
      ))}
    </div>
  );
}

function MetaRow({ label, value, accent }) {
  if (!value) return null;
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span className="mt-[6px] h-[9px] w-[9px] shrink-0 rounded-[2px] bg-orange-400" />
      <p className="text-[13.5px] leading-snug">
        <span className="font-semibold text-orange-400">{label}: </span>
        <span className={accent ? 'text-[#ffa353] cursor-pointer hover:text-[#ff9e3d] transition-colors' : 'text-[#c4c4ce]'}>
          {value}
        </span>
      </p>
    </li>
  );
}

export default async function WatchPage({ params }) {
  const resolvedParams = await params;
  const slug = getFirst(resolvedParams?.slug) || null;
  const episode = parseInt(String(getFirst(resolvedParams?.ep) || '1'), 10) || 1;

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
  const tags = Array.isArray(anime?.tags) ? anime.tags.slice(0, 30) : [];
  const titleNative = anime?.title_japanese || anime?.title_native || null;
  const premiereLabel = formatSeasonLabel(anime?.season, anime?.season_year);
  const airedFrom = formatDateLabel(anime?.aired_from);
  const airedTo = formatDateLabel(anime?.aired_to);
  const airedRange = airedFrom ? `${airedFrom} to ${airedTo || '?'}` : premiereLabel || '—';

  const rawScore = anime?.score != null ? Number(anime.score) : null;
  const scoreLabel = rawScore !== null ? (Number.isInteger(rawScore) ? rawScore : rawScore.toFixed(1)) : 'N/A';
  const studiosLabel = joinNames(anime?.main_studios?.length ? anime.main_studios : anime?.studio_names) || 'N/A';
  const producersLabel = joinNames(anime?.producers) || 'N/A';
  const popularityLabel = anime?.popularity != null ? Number(anime.popularity).toLocaleString() : '0';
  const synopsis = anime?.synopsis || 'No synopsis available for this title.';
  const episodeCount = anime?.episodes || 1;

  const metaRowsLeft = [
    { label: 'Status', value: anime?.status || 'N/A' },
    { label: 'Premiered', value: premiereLabel || 'N/A' },
    { label: 'Aired', value: airedRange },
    { label: 'Episodes', value: `${episodeCount}` },
    { label: 'Broadcast', value: anime?.broadcast || 'N/A' },
  ];

  const metaRowsRight = [
    { label: 'Studio', value: studiosLabel, accent: true },
    { label: 'Producers', value: producersLabel !== 'N/A' ? producersLabel : 'Unknown', accent: true },
    { label: 'Duration', value: anime?.duration ? `${anime.duration} min. per ep.` : 'N/A' },
    { label: 'Type', value: anime?.type || 'TV' },
    { label: 'Country', value: formatCountry(anime?.country_of_origin) || 'N/A' },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#09090b] text-[#d4d4d8]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-8">
          <section className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#0f0f13] shadow-2xl md:rounded-[28px]">
            <div className="relative p-2 md:p-6">
              <div className="relative">
                {anilistId ? (
                  <Suspense
                    fallback={
                      <div className="aspect-video w-full animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02] md:rounded-[22px]" />
                    }
                  >
                    <WatchPlayer
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

          <section className="rounded-2xl border border-white/[0.06] bg-[#0f0f13] p-4 font-display shadow-xl md:rounded-[28px] sm:p-6 md:p-8">
            <div className="md:hidden">
              <div style={{ width: '120px', maxWidth: '120px' }} className="mx-auto">
                <div
                  style={{ width: '120px', maxWidth: '120px' }}
                  className="relative overflow-hidden rounded-xl ring-1 ring-white/[0.08] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]"
                >
                  <img
                    src={posterUrl}
                    alt={displayTitle}
                    style={{ width: '120px', maxWidth: '120px', height: 'auto', aspectRatio: '2 / 3' }}
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              <h1 className="mt-5 text-[20px] font-semibold leading-tight tracking-tight text-white">
                {displayTitle}
              </h1>

              <p className="mt-2 text-[12.5px] font-light italic leading-relaxed text-[#8a8a92]">
                {titleNative}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <StarRating rawScore={rawScore} />
                <span className="text-[12.5px] text-[#82828a]">{scoreLabel} · {popularityLabel} reviews</span>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {error}
                </div>
              )}

              <ul className="mt-5 divide-y divide-white/[0.05]">
                {[...metaRowsLeft, ...metaRowsRight].map((row) => (
                  <MetaRow key={row.label} {...row} />
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
                <span className="mt-1 ml-2 font-semibold text-[#82828a]">Genre:</span>

                {genres.length > 0 ? (
                  genres.map((genre) => (
                    <span
                      key={genre}
                      className="cursor-pointer rounded-full border border-[#a575cb]/40 px-2.5 py-1 text-[#c096e2] transition-colors hover:bg-[#a575cb]/10"
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="text-[#52525b]">No genres</span>
                )}
              </div>

              <p className="mt-5 text-[13.5px] font-light leading-relaxed text-[#b8b8c0]">
                {synopsis}
              </p>

              {tags.length > 0 && (
                <div className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3.5 text-[12.5px]">
                  <div className="max-h-[92px] overflow-y-auto custom-scrollbar">
                    <span className="mb-2 block text-[#82828a]">Tags</span>
                    <div className="flex flex-wrap gap-x-1.5 gap-y-2">
                      {tags.map((tag, index) => (
                        <span key={tag.name} className="inline-flex">
                          <span className="cursor-pointer text-white/70 transition-colors hover:text-white">#{tag.name}</span>
                          {index < tags.length - 1 && <span className="ml-1.5 text-[#52525b]">·</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block">
              <div className="flex flex-row items-start gap-8 lg:gap-10">
                <div style={{ width: '150px', maxWidth: '150px' }} className="shrink-0">
                  <div
                    style={{ width: '150px', maxWidth: '150px' }}
                    className="relative overflow-hidden rounded-xl ring-1 ring-white/[0.08] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)]"
                  >
                    <img
                      src={posterUrl}
                      alt={displayTitle}
                      style={{ width: '150px', maxWidth: '150px', height: 'auto', aspectRatio: '2 / 3' }}
                      className="object-cover transition-transform duration-500 transform hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-white lg:text-[32px]">
                    {displayTitle}
                  </h1>

                  <p className="mt-2 text-[13px] font-light italic leading-relaxed text-[#8a8a92]">
                    {titleNative}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <StarRating rawScore={rawScore} />
                    <span className="text-[12.5px] text-[#82828a]">{scoreLabel} · {popularityLabel} reviews</span>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      {error}
                    </div>
                  )}

                  <p className="mt-5 text-[14.5px] font-light leading-relaxed text-[#c4c4ce]">
                    {synopsis}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-white/[0.06] pt-6">
                <div className="grid grid-cols-2 gap-x-10">
                  <ul className="divide-y divide-white/[0.05]">
                    {metaRowsLeft.map((row) => (
                      <MetaRow key={row.label} {...row} />
                    ))}
                  </ul>
                  <ul className="divide-y divide-white/[0.05]">
                    {metaRowsRight.map((row) => (
                      <MetaRow key={row.label} {...row} />
                    ))}
                  </ul>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-[12.5px]">
                  <span className="mt-1 ml-2 font-semibold text-[#82828a]">Genre:</span>
                  {genres.length > 0 ? (
                    genres.map((genre) => (
                      <span
                        key={genre}
                        className="cursor-pointer rounded-full border border-[#a575cb]/40 px-2.5 py-1 text-[#c096e2] transition-colors hover:bg-[#a575cb]/10"
                      >
                        {genre}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#52525b]">No genres</span>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-4 text-[12.5px]">
                    <div className="max-h-[92px] overflow-y-auto custom-scrollbar">
                      <span className="mb-2 block text-[#82828a]">Tags</span>
                      <div className="flex flex-wrap gap-x-1.5 gap-y-2">
                        {tags.map((tag, index) => (
                          <span key={tag.name} className="inline-flex">
                            <span className="cursor-pointer text-white/70 transition-colors hover:text-white">#{tag.name}</span>
                            {index < tags.length - 1 && <span className="ml-1.5 text-[#52525b]">·</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

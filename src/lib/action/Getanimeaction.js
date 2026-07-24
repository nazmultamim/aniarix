'use server';

import { getAnimeDetails, getRecentAnime, getTopAnime, getTrendingAnime, AniListApiError } from '@/services/anilist.service';
import { CACHE_TTL, getCached, setCached } from '@/services/Cache.service';

const DEFAULT_PAGE_SIZE = 24;
const HERO_SLIDES_CACHE_KEY = 'hero-anime-slides:v5';
const SELECTED_ANIME_CACHE_PREFIX = 'selected-anime:v3';

function isAlreadyReleasedAnime(item) {
  const status = String(item?.status || '').toUpperCase();
  return status === 'FINISHED';
}

function isBrowsableAnime(item) {
  const status = String(item?.status || '').toUpperCase();
  return status !== 'NOT_YET_RELEASED' && status !== 'CANCELLED' && status !== 'HIATUS';
}

function hasHeroArtwork(item) {
  return Boolean(item?.poster);
}

function isTvAnimeWithAnilistId(item) {
  if (!item) return false;

  const format = String(item?.format || '').toUpperCase();
  const anilistId = item?.anilist_id;
  const hasAnilistId = anilistId != null && String(anilistId).trim() !== '';

  return hasAnilistId && isBrowsableAnime(item) && format === 'TV';
}

function getStableAnimeId(item) {
  const fallback = item?.id ?? item?.slug ?? item?.title ?? item?.title_english ?? item?.title_native;
  if (fallback != null && String(fallback).trim() !== '') {
    return String(fallback);
  }

  return 'anime-unknown';
}

// Maps the normalized AniList anime object into the flat shape the UI expects.
function mapAnime(item) {
  return {
    id: getStableAnimeId(item),
    anilist_id: item.anilist_id != null ? String(item.anilist_id) : null,
    slug: item.slug ?? null,
    title: item.title || item.title_english || item.title_native || null,
    title_english: item.title_english || item.title || null,
    title_japanese: item.title_native || null,
    poster_image: item.poster || null,
    poster: item.poster || null,
    score: item.score ?? null,
    average_score: item.average_score ?? item.score ?? null,
    mean_score: item.mean_score ?? null,
    popularity: item.popularity ?? null,
    favorites: item.favorites ?? null,
    type: item.format || null,
    source: item.source ?? null,
    episodes: item.episodes ?? null,
    status: item.status || null,
    airing: item.status === 'RELEASING',
    duration: item.duration ? `${item.duration} min` : null,
    rating: null,
    rank: null,
    year: item.season_year ?? null,
    season: item.season ?? null,
    season_year: item.season_year ?? null,
    season_int: item.season_int ?? null,
    genres: item.genres ?? [],
    genre: item.genres ?? [],
    synopsis: item.description || null,
    aired_from: item.start_date ?? null,
    aired_to: item.end_date ?? null,
    broadcast: item.broadcast ?? null,
    next_airing_episode: item.next_airing_episode ?? null,
    studios: item.studios ?? [],
    studio_names: item.studio_names ?? [],
    main_studios: item.main_studios ?? [],
    tags: item.tags ?? [],
    hashtag: item.hashtag ?? null,
    country_of_origin: item.country_of_origin ?? null,
    is_adult: item.is_adult ?? false,
    site_url: item.site_url ?? null,
    trailer: item.trailer ?? null,
    banner: item.banner ?? null,
    banner_image: item.banner ?? null,
  };
}

function mapHeroSlide(item, label = 'Featured') {
  const score = typeof item?.score === 'number' ? item.score : Number(item?.score);
  const rating = Number.isFinite(score) ? score.toFixed(1) : '—';

  return {
    id: item.id ?? item.slug ?? item.title ?? null,
    anilist_id: item.anilist_id ?? null,
    slug: item.slug ?? null,
    title: item.title_english || item.title || 'Untitled anime',
    subtitle: label,
    cover: item.poster || 'https://placehold.co/1600x900/111111/f97316?text=No+Image',
    type: item.format || 'Anime',
    genre: Array.isArray(item.genres) ? item.genres : [],
    synopsis: item.synopsis || 'No synopsis available.',
    rating: rating === '—' ? 'Top Pick' : `${rating}/10`,
    release: item.year || item.status || 'Now',
    quality: item.episodes && Number(item.episodes) > 1 ? 'HD' : 'SD',
    episodes: item.episodes ?? null,
    status: item.status || null,
    score: item.score ?? null,
    year: item.year ?? null,
    poster_image: item.poster || null,
    focalPoint: 'center 20%',
  };
}

function buildHeroSlides(items, label) {
  return (items ?? [])
    .filter((item) => item?.id != null)
    .filter(isAlreadyReleasedAnime)
    .filter(hasHeroArtwork)
    .map((item) => mapHeroSlide(item, label));
}

async function fetchHeroAnimeSlides() {
  const [topFirstPage, topSecondPage, topThirdPage] = await Promise.all([
    getTopAnime(1),
    getTopAnime(2),
    getTopAnime(3),
  ]);

  const merged = [];
  const seen = new Set();

  for (const item of [
    ...buildHeroSlides((topFirstPage?.results ?? []).slice(0, 6), 'Top Rated'),
    ...buildHeroSlides((topSecondPage?.results ?? []).slice(0, 6), 'Top Rated'),
    ...buildHeroSlides((topThirdPage?.results ?? []).slice(0, 6), 'Top Rated'),
  ]) {
    const key = item.id != null ? String(item.id) : item.slug || item.anilist_id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.slice(0, 6);
}

/**
 * Paginated "recent anime" browse list, sourced from AniList (cached 12h in
 * Redis via anilist.service.js) — no Supabase involved, per the new
 * architecture.
 */
export async function getAnimeListAction({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const limit = Math.min(Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE), 25);
  const cacheKey = `recent-anime:${safePage}:${limit}`;
  const fallbackKeys = [
    cacheKey,
    safePage === 1 ? 'top-anime' : `top-anime:${safePage}`,
    'top-anime',
  ];

  try {
    const data = await getRecentAnime(safePage, limit);
    const items = (data.results ?? []).filter(isTvAnimeWithAnilistId).map(mapAnime);

    return {
      success: true,
      items,
      pagination: {
        page: safePage,
        pageSize: limit,
        totalPages: data.pagination?.lastPage || 1,
        totalCount: data.pagination?.total ?? items.length,
      },
    };
  } catch (err) {
    try {
      const fallback = await getTopAnime(safePage);
      const items = (fallback.results ?? []).filter(isTvAnimeWithAnilistId).map(mapAnime);

      await setCached(
        cacheKey,
        {
          results: fallback.results ?? [],
          pagination: fallback.pagination ?? null,
        },
        CACHE_TTL.TWELVE_HOURS
      );

      return {
        success: true,
        items,
        pagination: {
          page: safePage,
          pageSize: limit,
          totalPages: fallback.pagination?.lastPage || 1,
          totalCount: fallback.pagination?.total ?? items.length,
        },
      };
    } catch (fallbackErr) {
      console.error('[getAnimeListAction] fallback failed:', fallbackErr);

      for (const key of fallbackKeys) {
        const cached = await getCached(key);
        if (cached?.results?.length) {
          const items = (cached.results ?? []).filter(isTvAnimeWithAnilistId).map(mapAnime);
          return {
            success: true,
            items,
            pagination: {
              page: safePage,
              pageSize: limit,
              totalPages: cached.pagination?.lastPage || 1,
              totalCount: cached.pagination?.total ?? items.length,
            },
          };
        }
      }

      const message =
        err instanceof AniListApiError
          ? err.message
          : 'Failed to load anime right now. Please try again.';
      return { error: message };
    }
  }
}

export async function getHeroAnimeSlidesAction() {
  try {
    const cached = await getCached(HERO_SLIDES_CACHE_KEY);
    if (cached?.items?.length) {
      return { success: true, items: cached.items };
    }

    const items = await fetchHeroAnimeSlides();
    await setCached(
      HERO_SLIDES_CACHE_KEY,
      { items },
      CACHE_TTL.TWELVE_HOURS
    );

    return { success: true, items };
  } catch (err) {
    console.error('[getHeroAnimeSlidesAction] failed:', err);

    const message =
      err instanceof AniListApiError
        ? err.message
        : 'Failed to load featured anime.';
    return { error: message, items: [] };
  }
}

export async function cacheSelectedAnimeAction(anime) {
  const anilistId = anime?.anilist_id ?? anime?.id ?? null;
  if (!anilistId) {
    return { error: 'Anime ID is required.' };
  }

  const payload = {
    ...anime,
    anilist_id: String(anilistId),
    id: anime?.id ?? String(anilistId),
    genres: anime?.genres ?? anime?.genre ?? [],
    genre: anime?.genres ?? anime?.genre ?? [],
    poster_image: anime?.poster_image ?? anime?.poster ?? null,
    poster: anime?.poster_image ?? anime?.poster ?? null,
    banner: anime?.banner ?? anime?.banner_image ?? null,
    banner_image: anime?.banner_image ?? anime?.banner ?? null,
    cachedAt: Date.now(),
  };

  await setCached(
    `${SELECTED_ANIME_CACHE_PREFIX}:${String(anilistId)}`,
    payload,
    CACHE_TTL.TWELVE_HOURS
  );

  return { success: true, anime: payload };
}

export async function getSelectedAnimeCacheAction(anilistId) {
  if (!anilistId) {
    return { anime: null };
  }

  const cached = await getCached(`${SELECTED_ANIME_CACHE_PREFIX}:${String(anilistId)}`);
  return { anime: cached || null };
}

/**
 * Full anime detail view for /anime/[anilist_id].
 */
export async function getAnimeDetailAction(anilistId) {
  if (!anilistId) {
    return { error: 'Anime ID is required.' };
  }

  try {
    const data = await getAnimeDetails(anilistId);
    return { anime: mapAnime(data) };
  } catch (err) {
    const cached = await getCached(`${SELECTED_ANIME_CACHE_PREFIX}:${String(anilistId)}`);
    if (cached) {
      const message =
        err instanceof AniListApiError
          ? err.message
          : 'Failed to load anime details right now. Showing cached details instead.';
      return { anime: cached, error: message };
    }

    const message =
      err instanceof AniListApiError
        ? err.message
        : 'Failed to load anime details right now. Please try again.';
    return { error: message };
  }
}

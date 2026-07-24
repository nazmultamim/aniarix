'use server';

import { searchAnimeAdvanced, getTopAnime, AniListApiError } from '@/services/anilist.service';

const DEFAULT_PAGE_SIZE = 20;

function isVisibleAnime(item) {
  if (!item) return false;

  const format = String(item?.format || '').toUpperCase();
  const status = String(item?.status || '').toUpperCase();
  const hasAnilistId = item?.id != null && String(item.id).trim() !== '';

  return hasAnilistId && format === 'TV' && status !== 'NOT_YET_RELEASED' && status !== 'CANCELLED' && status !== 'HIATUS';
}

// Same flat shape AnimeCard already expects (see getanimeaction.js).
function mapAnime(item) {
  return {
    id: item.id != null ? String(item.id) : null,
    anilist_id: item.id != null ? String(item.id) : null,
    title: item.title || item.title_english || item.title_native || null,
    title_english: item.title_english || item.title || null,
    poster_image: item.poster || null,
    score: item.score ?? null,
    type: item.format || null,
    genres: item.genres ?? [],
    synopsis: item.description || null,
  };
}

/**
 * Advanced filtered search with retry logic, sourced from AniList (12h Redis cache).
 *
 * @param {object} filters - { query, genre, type, status, rating, year, season, orderBy, sort }
 * @param {number} page
 * @param {number} pageSize
 * @param {number} retries - number of retry attempts
 */
export async function searchAnimeAction(filters = {}, page = 1, pageSize = DEFAULT_PAGE_SIZE, retries = 2) {
  const safePage = Math.max(1, Number(page) || 1);
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await searchAnimeAdvanced(filters, safePage, pageSize);
      const items = (data.results ?? []).filter(isVisibleAnime).map(mapAnime);

      return {
        success: true,
        items,
        pagination: {
          page: safePage,
          pageSize,
          totalPages: data.pagination?.lastPage || 1,
          totalCount: data.pagination?.total ?? items.length,
        },
      };
    } catch (err) {
      lastError = err;
      // If it's a temporary error (5xx), retry
      if (err instanceof AniListApiError && err.status >= 500 && attempt < retries) {
        console.warn(`[searchAnimeAction] Attempt ${attempt + 1} failed with status ${err.status}, retrying...`);
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      break;
    }
  }

  // Format the error message based on the status code
  if (lastError instanceof AniListApiError) {
    if (lastError.status === 504 || lastError.status === 503) {
      return { error: 'AniList API is temporarily unavailable. Please try again in a moment.' };
    }
    if (lastError.status === 429) {
      return { error: 'Too many requests. Please wait a moment and try again.' };
    }
    return { error: lastError.message };
  }

  return { error: 'Failed to search anime. Please try again.' };
}

/**
 * Top-rated anime for the search page's sidebar widget, with retry logic.
 */
export async function getTopAnimeAction(page = 1, limit = 6, retries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await getTopAnime(page);
      const items = (data.results ?? []).filter(isVisibleAnime).slice(0, limit).map(mapAnime);
      return { success: true, items };
    } catch (err) {
      lastError = err;
      // If it's a temporary error (5xx), retry
      if (err instanceof AniListApiError && err.status >= 500 && attempt < retries) {
        console.warn(`[getTopAnimeAction] Attempt ${attempt + 1} failed with status ${err.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      break;
    }
  }

  const message =
    lastError instanceof AniListApiError
      ? lastError.message
      : 'Failed to load top anime.';
  return { error: message };
}

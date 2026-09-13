const MEGAPLAY_BASE_URL = 'https://megaplay.buzz';

export const STREAM_LANGUAGES = {
  SUB: 'sub',
  DUB: 'dub',
};

function normalizePositiveId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeEpisode(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeLanguage(language) {
  return language === STREAM_LANGUAGES.DUB ? STREAM_LANGUAGES.DUB : STREAM_LANGUAGES.SUB;
}

/** Build MegaPlay's AniList-specific stream URL. */
export function buildAniListStreamUrl(anilistId, episode, language = STREAM_LANGUAGES.SUB) {
  const id = normalizePositiveId(anilistId);
  const episodeNumber = normalizeEpisode(episode);
  if (!id || !episodeNumber) return null;

  return `${MEGAPLAY_BASE_URL}/stream/ani/${id}/${episodeNumber}/${normalizeLanguage(language)}`;
}

/** Build MegaPlay's MAL-specific stream URL. */
export function buildMalStreamUrl(malId, episode, language = STREAM_LANGUAGES.SUB) {
  const id = normalizePositiveId(malId);
  const episodeNumber = normalizeEpisode(episode);
  if (!id || !episodeNumber) return null;

  return `${MEGAPLAY_BASE_URL}/stream/mal/${id}/${episodeNumber}/${normalizeLanguage(language)}`;
}

/**
 * Select the appropriate MegaPlay endpoint from a dual-ID identity. AniList
 * remains preferred; a MAL ID is used only with MegaPlay's /mal endpoint.
 */
export function buildMegaPlayStreamUrl({ anilistId = null, malId = null } = {}, episode, language = STREAM_LANGUAGES.SUB) {
  return buildAniListStreamUrl(anilistId, episode, language)
    || buildMalStreamUrl(malId, episode, language);
}

/**
 * Legacy AniList-only API retained for existing callers. New dual-ID callers
 * should use buildMegaPlayStreamUrl().
 */
export function buildStreamUrl(anilistId, episode, language = STREAM_LANGUAGES.SUB) {
  return buildAniListStreamUrl(anilistId, episode, language);
}

/**
 * If dub fails, the only sensible fallback is sub. If sub fails, there's
 * nothing left to fall back to (caller should show "No streaming source
 * available.").
 */
export function getFallbackLanguage(currentLanguage) {
  return currentLanguage === STREAM_LANGUAGES.DUB ? STREAM_LANGUAGES.SUB : null;
}

/**
 * Convenience helper for the player: returns both the URL to try now and
 * the URL to fall back to (if any), so the UI layer doesn't need to
 * reimplement the dub->sub rule itself.
 */
export function buildStreamUrlWithFallback(identityOrAniListId, episode, language) {
  const identity = typeof identityOrAniListId === 'object' && identityOrAniListId !== null
    ? identityOrAniListId
    : { anilistId: identityOrAniListId };
  const primary = buildMegaPlayStreamUrl(identity, episode, language);
  const fallbackLang = getFallbackLanguage(language);
  const fallback = fallbackLang ? buildMegaPlayStreamUrl(identity, episode, fallbackLang) : null;

  return { primary, fallbackLang, fallback };
}

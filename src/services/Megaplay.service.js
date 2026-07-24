const MEGAPLAY_BASE_URL = 'https://megaplay.buzz';

export const STREAM_LANGUAGES = {
  SUB: 'sub',
  DUB: 'dub',
};

/**
 * Builds a MegaPlay iframe URL. Nothing about this URL is ever persisted —
 * callers should build it fresh on every render.
 */
export function buildStreamUrl(anilistId, episode, language = STREAM_LANGUAGES.SUB) {
  if (!anilistId || !episode) return null;
  const lang = language === STREAM_LANGUAGES.DUB ? STREAM_LANGUAGES.DUB : STREAM_LANGUAGES.SUB;
  return `${MEGAPLAY_BASE_URL}/stream/ani/${anilistId}/${episode}/${lang}`;
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
export function buildStreamUrlWithFallback(anilistId, episode, language) {
  const primary = buildStreamUrl(anilistId, episode, language);
  const fallbackLang = getFallbackLanguage(language);
  const fallback = fallbackLang ? buildStreamUrl(anilistId, episode, fallbackLang) : null;

  return { primary, fallbackLang, fallback };
}

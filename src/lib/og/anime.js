import { getAnimeDetails } from '@/services/anilist.service';

export async function getAnimeOgPayload(anilistId) {
  if (!anilistId) {
    return {
      title: 'AniArix',
      japaneseTitle: null,
      bannerUrl: null,
    };
  }

  try {
    const anime = await getAnimeDetails(anilistId);
    const title = String(anime?.title_english || anime?.title || anime?.title_native || `AniArix #${anilistId}`).trim();
    const japaneseTitle = String(anime?.title_native || '').trim();

    return {
      title,
      japaneseTitle: japaneseTitle || null,
      bannerUrl: anime?.banner || anime?.poster || null,
    };
  } catch {
    return {
      title: `AniArix #${anilistId}`,
      japaneseTitle: null,
      bannerUrl: null,
    };
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeAniListAnime } from '@/services/anime/anime-normalizer';
import { AnimeIdentityConflictError, persistTrustedAniListAnime } from '@/services/anime/anime-identity.service';

const ANILIST_API = 'https://graphql.anilist.co';

// One request pulls every status group (Watching/Completed/Paused/
// Dropped/Planning) at once — no pagination needed for typical list
// sizes. Only the fields the UI actually needs are requested, to keep
// the payload (and AniList's server load) small.
const LIST_QUERY = `
  query ($userName: String) {
    MediaListCollection(userName: $userName, type: ANIME) {
      lists {
        name
        status
        entries {
          id
          status
          score
          progress
          updatedAt
          media {
            id
            idMal
            title { romaji english }
            coverImage { large }
            episodes
            format
            status
            genres
            averageScore
          }
        }
      }
    }
  }
`;

// Minimum time between manual re-syncs for a single user — protects
// against a user (or a bug) spamming AniList's API through our server.
const MIN_SYNC_INTERVAL_MS = 60_000;

async function persistSyncedAniListMappings(lists) {
  const media = lists
    .flatMap((list) => list?.entries || [])
    .map((entry) => entry?.media)
    .filter((item) => item?.id);
  const uniqueMedia = [...new Map(media.map((item) => [item.id, item])).values()];

  const outcomes = await Promise.allSettled(uniqueMedia.map(async (item) => {
    const anime = normalizeAniListAnime(item);
    if (anime?.anilistId) await persistTrustedAniListAnime(anime);
  }));

  for (const [index, outcome] of outcomes.entries()) {
    if (outcome.status !== 'rejected') continue;
    const item = uniqueMedia[index];
    const error = outcome.reason;
    console.warn('[anilist-sync] Catalog mapping persistence failed.', {
      anilistId: item?.id ?? null,
      malId: item?.idMal ?? null,
      conflict: error instanceof AnimeIdentityConflictError,
      name: error?.name || 'Error',
    });
  }
}

/**
 * Saves the AniList username on the profile and triggers the first sync
 * immediately, so "My List" isn't empty right after setup.
 */
export async function setAnilistUsername(username) {
  const trimmed = username?.trim();
  if (!trimmed) return { error: 'Username is required.' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated.' };

  const { error } = await supabase
    .from('profiles')
    .update({ anilist_username: trimmed, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return { error: error.message };

  return syncAnilistList();
}

/**
 * Fetches the user's current AniList username's list from AniList and
 * caches it. Rejects with a cooldown message if called again too soon.
 */
export async function syncAnilistList() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('anilist_username')
    .eq('id', user.id)
    .maybeSingle();

  const username = profile?.anilist_username;
  if (!username) return { error: 'No AniList username set yet.' };

  const { data: existingCache } = await supabase
    .from('anilist_sync_cache')
    .select('synced_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingCache?.synced_at) {
    const elapsed = Date.now() - new Date(existingCache.synced_at).getTime();
    if (elapsed < MIN_SYNC_INTERVAL_MS) {
      const waitSeconds = Math.ceil((MIN_SYNC_INTERVAL_MS - elapsed) / 1000);
      return { error: `Please wait ${waitSeconds}s before syncing again.`, cooldown: true };
    }
  }

  let json;
  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: LIST_QUERY, variables: { userName: username } }),
      cache: 'no-store',
    });

    if (res.status === 404) {
      return { error: `AniList user "${username}" not found.` };
    }
    if (res.status === 429) {
      return { error: 'AniList is rate-limiting us right now — try again in a minute.' };
    }
    if (!res.ok) {
      return { error: `AniList request failed (${res.status}).` };
    }

    json = await res.json();
  } catch {
    return { error: 'Could not reach AniList.' };
  }

  if (json?.errors?.length) {
    return { error: json.errors[0]?.message || 'AniList returned an error.' };
  }

  const lists = json?.data?.MediaListCollection?.lists || [];
  const now = new Date().toISOString();

  // Global catalog persistence is independent from the user-specific sync
  // cache below. Failures are logged but never discard the user's list.
  await persistSyncedAniListMappings(lists);

  const { error } = await supabase
    .from('anilist_sync_cache')
    .upsert(
      {
        user_id: user.id,
        anilist_username: username,
        data: lists,
        synced_at: now,
      },
      { onConflict: 'user_id' }
    );

  if (error) return { error: error.message };

  return { lists, syncedAt: now };
}

/**
 * Reads straight from the cache — never calls AniList. This is what
 * "My List" should call on every render for instant load.
 */
export async function getAnilistList() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { lists: null, syncedAt: null, username: null };

  const { data, error } = await supabase
    .from('anilist_sync_cache')
    .select('data, synced_at, anilist_username')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return { lists: null, syncedAt: null, username: null };

  return { lists: data.data, syncedAt: data.synced_at, username: data.anilist_username };
}

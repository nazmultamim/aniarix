'use server';

import { createAnimeIdentity, hasAnimeIdentity, resolveAnimeIdentity } from '@/services/anime/anime-identity.service';
import { createClient } from '@/lib/supabase/server';

async function resolveSafeWatchIdentity({ anilistId = null, malId = null } = {}) {
  const supplied = createAnimeIdentity({ anilistId, malId });
  if (!hasAnimeIdentity(supplied)) return supplied;

  try {
    return await resolveAnimeIdentity(supplied);
  } catch (error) {
    console.warn('[watchHistory] Catalog identity lookup failed; saving known IDs only.', {
      name: error?.name || 'Error',
    });
    return supplied;
  }
}

async function findHistoryRows(supabase, userId, identity) {
  const filters = [];
  if (identity.anilistId) filters.push(`anilist_id.eq.${identity.anilistId}`);
  if (identity.malId) filters.push(`mal_id.eq.${identity.malId}`);
  if (filters.length === 0) return { data: [], error: null };

  return supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', userId)
    .or(filters.join(','));
}

function hasIdentityConflict(row, identity) {
  return (
    (row.anilist_id != null && identity.anilistId != null && Number(row.anilist_id) !== identity.anilistId)
    || (row.mal_id != null && identity.malId != null && Number(row.mal_id) !== identity.malId)
  );
}

export async function upsertWatchProgress({
  anilistId = null,
  malId = null,
  title,
  poster,
  episode,
  language,
  currentTimeSeconds = 0,
  durationSeconds = 0,
  server,
  status = 'watching',
  completed = false,
}) {
  const identity = await resolveSafeWatchIdentity({ anilistId, malId });
  if (!hasAnimeIdentity(identity) || !episode || !language) {
    return { error: 'An AniList or MAL ID, episode, and language are required.' };
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated.' };
  }
  const progressPercent =
    durationSeconds > 0
      ? Math.min(100, Math.round((currentTimeSeconds / durationSeconds) * 100))
      : 0;
  const now = new Date().toISOString();
  const { data: matches, error: lookupError } = await findHistoryRows(supabase, user.id, identity);
  if (lookupError) return { error: lookupError.message };

  // Two rows matching the supplied external IDs are inconsistent data. Do
  // not merge or overwrite them automatically.
  if ((matches || []).length > 1) {
    return { error: 'Watch history contains conflicting AniList and MAL identity records.' };
  }

  const existing = matches?.[0] || null;
  if (existing && hasIdentityConflict(existing, identity)) {
    return { error: 'Watch history identity conflicts with the existing record.' };
  }

  const payload = {
    user_id: user.id,
    // Null input can never erase a valid stored identity.
    anilist_id: existing?.anilist_id ?? identity.anilistId ?? null,
    mal_id: existing?.mal_id ?? identity.malId ?? null,
    title,
    poster,
    episode,
    language,
    current_time_seconds: currentTimeSeconds,
    duration_seconds: durationSeconds,
    progress_percent: progressPercent,
    completed,
    server,
    status,
    last_watched_at: now,
    updated_at: now,
  };
  const write = existing
    ? supabase.from('watch_history').update(payload).eq('id', existing.id).eq('user_id', user.id)
    : supabase.from('watch_history').insert(payload);
  const { data, error } = await write.select().maybeSingle();
  if (error) {
    return { error: error.message };
  }
  return { entry: data };
}

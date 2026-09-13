'use server';

import { createAnimeIdentity, hasAnimeIdentity, resolveAnimeIdentity } from '@/services/anime/anime-identity.service';
import { createClient } from '@/lib/supabase/server';

async function resolveSafeWatchIdentity(identity) {
  const supplied = createAnimeIdentity(identity);
  if (!hasAnimeIdentity(supplied)) return supplied;

  try {
    return await resolveAnimeIdentity(supplied);
  } catch (error) {
    console.warn('[watchHistory] Catalog identity lookup failed while reading progress.', {
      name: error?.name || 'Error',
    });
    return supplied;
  }
}

export async function getWatchHistory(limit = 20) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { entries: [] };
  }
  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', user.id)
    .order('last_watched_at', { ascending: false })
    .limit(limit);
  if (error) {
    return { entries: [] };
  }
  return { entries: data || [] };
}

export async function getWatchProgress(identityOrAniListId) {
  const requested = typeof identityOrAniListId === 'object' && identityOrAniListId !== null
    ? identityOrAniListId
    : { anilistId: identityOrAniListId };
  const identity = await resolveSafeWatchIdentity(requested);
  if (!hasAnimeIdentity(identity)) return { entry: null };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { entry: null };
  }
  const filters = [];
  if (identity.anilistId) filters.push(`anilist_id.eq.${identity.anilistId}`);
  if (identity.malId) filters.push(`mal_id.eq.${identity.malId}`);
  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', user.id)
    .or(filters.join(','));
  if (error || !data || data.length !== 1) return { entry: null };

  const entry = data[0];
  const identityConflict =
    (entry.anilist_id != null && identity.anilistId != null && Number(entry.anilist_id) !== identity.anilistId)
    || (entry.mal_id != null && identity.malId != null && Number(entry.mal_id) !== identity.malId);
  if (identityConflict) return { entry: null };

  // Backfill only an ID that an exact anime_catalog lookup supplied. This
  // leaves old rows untouched when no safe mapping exists.
  const updates = {};
  if (entry.anilist_id == null && identity.anilistId) updates.anilist_id = identity.anilistId;
  if (entry.mal_id == null && identity.malId) updates.mal_id = identity.malId;
  if (Object.keys(updates).length === 0) return { entry };

  const { data: updated, error: updateError } = await supabase
    .from('watch_history')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', entry.id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle();

  return { entry: updateError || !updated ? entry : updated };
}

/**
 * Deletes a single watch_history row. RLS already scopes deletes to
 * auth.uid() = user_id, but the explicit .eq('user_id', user.id) here
 * makes that intent visible in the query itself, not just the policy.
 */
export async function deleteWatchHistoryEntry(id) {
  if (!id) return { error: 'id is required.' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated.' };
  }

  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';

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

export async function getWatchProgress(anilistId) {
  if (!anilistId) return { entry: null };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { entry: null };
  }
  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('anilist_id', anilistId)
    .maybeSingle();
  if (error || !data) {
    return { entry: null };
  }
  return { entry: data };
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
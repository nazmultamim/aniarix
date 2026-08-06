'use server';

import { createClient } from '@/lib/supabase/server';
import { WATCH_STATUS_VALUES } from '@/lib/watchStatus';


export async function updateWatchStatus({
  anilistId,
  title,
  poster,
  episode,
  language,
  server,
  status,
}) {
  if (!anilistId || !episode || !language) {
    return { error: 'anilistId, episode, and language are required.' };
  }
  if (!WATCH_STATUS_VALUES.includes(status)) {
    return { error: 'Invalid status.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' };
  }

  const { data, error } = await supabase.rpc('upsert_watch_status', {
    p_anilist_id: anilistId,
    p_title: title,
    p_poster: poster,
    p_episode: episode,
    p_language: language,
    p_server: server,
    p_status: status,
  });

  if (error) {
    return { error: error.message };
  }
  return { entry: data };
}
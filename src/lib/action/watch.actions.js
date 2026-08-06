'use server';

import { createClient } from '@/lib/supabase/server';

export async function upsertWatchProgress({
  anilistId,
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
  if (!anilistId || !episode || !language) {
    return { error: 'anilistId, episode, and language are required.' };
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
  const { data, error } = await supabase
    .from('watch_history')
    .upsert(
      {
        user_id: user.id,
        anilist_id: anilistId,
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
      },
      { onConflict: 'user_id,anilist_id' }
    )
    .select()
    .maybeSingle();
  if (error) {
    return { error: error.message };
  }
  return { entry: data };
}
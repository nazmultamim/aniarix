'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Permanently deletes the authenticated user's account.
 *
 * Deletes the auth.users row via the admin client — profiles,
 * watch_history, and anilist_sync_cache all have ON DELETE CASCADE
 * foreign keys to auth.users(id), so Postgres removes every related row
 * automatically. No manual per-table deletes needed, and nothing gets
 * left behind if a new user-owned table is added later without updating
 * this function — as long as its FK also cascades.
 */
export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: error.message };
  }

  // The user row (and its refresh token) is gone at this point, but clear
  // this browser's session cookies too so there's no lingering "signed in
  // as a user that no longer exists" state before the redirect.
  await supabase.auth.signOut();

  return { success: true };
}
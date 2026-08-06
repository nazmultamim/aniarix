'use server';

import { createClient } from '@/lib/supabase/server';

const PROFILE_SELECT = 'id, full_name, avatar_url, username, role';

// Shared: every action here needs an authenticated user first.
async function getAuthedUser(supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Not authenticated.' };
  }
  return { user, error: null };
}

/**
 * Updates the authenticated user's full_name in the profiles table.
 * Username and email are intentionally NOT editable here.
 */
export async function updateProfileName(fullName) {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return { error: 'Name cannot be empty.' };
  }
  if (trimmed.length > 100) {
    return { error: 'Name is too long.' };
  }

  const supabase = await createClient();
  const { user, error: authError } = await getAuthedUser(supabase);
  if (authError) return { error: authError };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  return { profile: data };
}

/**
 * Updates the authenticated user's avatar_url in the profiles table.
 * Only accepts a URL string (presets are passed from AvatarPickerModal).
 */
export async function updateAvatarUrl(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return { error: 'Invalid avatar.' };
  }

  const supabase = await createClient();
  const { user, error: authError } = await getAuthedUser(supabase);
  if (authError) return { error: authError };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  return { profile: data };
}

/**
 * Changes the authenticated user's password.
 * Uses the server client which carries the user's session via cookies.
 */
export async function changePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = await createClient();
  const { error: authError } = await getAuthedUser(supabase);
  if (authError) return { error: authError };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
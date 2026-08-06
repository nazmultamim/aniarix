'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function resolveUsernameToEmail(username) {
  const admin = createAdminClient();

  // Step 1: Find profile by username (case-insensitive)
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', username.trim())
    .limit(1)
    .maybeSingle();

  if (profileError || !profile?.id) {
    return { error: 'No account found with that username.' };
  }

  // Step 2: Get email from auth.users using the profile's id
  const { data: user, error: userError } = await admin.auth.admin.getUserById(profile.id);

  if (userError || !user?.user?.email) {
    return { error: 'No account found with that username.' };
  }

  return { email: user.user.email };
}

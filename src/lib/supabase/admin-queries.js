/**
 * Admin panel data access layer.
 *
 * Assumes you already have a Supabase browser client exported from
 * "@/lib/supabase/client" (createBrowserClient / createClient from
 * "@supabase/supabase-js" or "@supabase/ssr"). Adjust the import path
 * in each admin page if your client lives elsewhere.
 *
 * These calls run with the signed-in admin's session, so they rely on
 * the "Admins can view/update all profiles" RLS policies for profile
 * management. watch_history and anilist_sync_cache are owner-only in
 * RLS (no admin override exists in the DB today), so an admin account
 * can only read/write its own rows there unless you add admin policies
 * or run these specific calls from a server route with the service
 * role key instead.
 */

export async function getDashboardStats(supabase) {
  const [{ count: userCount }, { count: catalogCount }, { count: watchCount }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("anime_catalog").select("*", { count: "exact", head: true }),
      supabase.from("watch_history").select("*", { count: "exact", head: true }),
    ]);

  return {
    userCount: userCount ?? 0,
    catalogCount: catalogCount ?? 0,
    watchCount: watchCount ?? 0,
  };
}

export async function getRecentActivity(supabase, limit = 8) {
  const { data, error } = await supabase
    .from("watch_history")
    .select("id, title, poster, episode, status, progress_percent, last_watched_at, user_id")
    .order("last_watched_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUsers(supabase, { search = "" } = {}) {
  let query = supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, anilist_username, created_at")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("username", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateUserRole(supabase, userId, role) {
  // Requires the caller to already satisfy is_admin() per RLS.
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
}

export async function getAnimeCatalog(supabase, { search = "", page = 0, pageSize = 10 } = {}) {
  let query = supabase
    .from("anime_catalog")
    .select(
      "id, anilist_id, mal_id, title_english, title_romaji, poster, format, status, episodes, season, season_year, genres, last_synced_at",
      { count: "exact" }
    )
    .order("last_synced_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (search) {
    query = query.ilike("title_english", `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count: count ?? 0 };
}

export async function getWatchHistory(supabase, { page = 0, pageSize = 10 } = {}) {
  const { data, error, count } = await supabase
    .from("watch_history")
    .select(
      "id, user_id, title, poster, episode, language, current_time_seconds, duration_seconds, progress_percent, status, server, last_watched_at",
      { count: "exact" }
    )
    .order("last_watched_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (error) throw error;
  return { data, count: count ?? 0 };
}

export async function getAppSetting(supabase, key) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function setAppSetting(supabase, key, value) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value, updated_by: user?.id, updated_at: new Date().toISOString() });

  if (error) throw error;
}

/**
 * Static snapshot of the last Supabase security advisor run.
 * Wire this to a server route calling the Management API if you want
 * it to refresh live; the advisor endpoint isn't reachable from the
 * anon/browser client.
 */
export function getSecurityFindings() {
  return [
    {
      id: "rls_disabled_anime_catalog",
      severity: "critical",
      title: "RLS disabled on public.anime_catalog",
      description:
        "The catalog table has no Row Level Security policies, so it is fully readable and writable by anyone with the project's anon key.",
      remediation:
        'ALTER TABLE "public"."anime_catalog" ENABLE ROW LEVEL SECURITY; -- then add a public SELECT policy',
    },
    {
      id: "definer_fn_handle_new_user",
      severity: "warn",
      title: "handle_new_user() callable directly via RPC",
      description:
        "This SECURITY DEFINER function can be invoked by anon/authenticated roles outside of its trigger context.",
      remediation: "REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;",
    },
    {
      id: "definer_fn_is_admin",
      severity: "warn",
      title: "is_admin() callable directly via RPC",
      description: "Low risk — it only returns whether the caller is an admin — but still exposed.",
      remediation: "REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;",
    },
    {
      id: "mutable_search_path",
      severity: "warn",
      title: "Mutable search_path on trigger functions",
      description:
        "handle_updated_at() and update_updated_at_column() don't pin search_path explicitly.",
      remediation: "ALTER FUNCTION public.handle_updated_at() SET search_path = '';",
    },
    {
      id: "leaked_password_protection",
      severity: "warn",
      title: "Leaked password protection disabled",
      description: "Signup passwords aren't checked against HaveIBeenPwned.",
      remediation: "Enable in Supabase Dashboard → Authentication → Policies.",
    },
  ];
}
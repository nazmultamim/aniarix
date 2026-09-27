# Supabase Project Reference — "aniarix"
*Read-only export generated 2026-09-26. No changes were made to the project.*
*This document is written to be parsed by any AI/LLM to gain full context of the project's database schema, auth flow, and security model.*

---

## 1. Project Metadata

| Field | Value |
|---|---|
| Project name | `aniarix` |
| Project ref / ID | `eetbmwahutjggjiqnjdy` |
| Organization ID | `ejwdkwkvnfkpmvvhqrjv` |
| Region | `ap-northeast-1` (Tokyo) |
| Status | `ACTIVE_HEALTHY` |
| Postgres version | `17.6.1.147` (engine 17, GA release channel) |
| Created at | 2026-07-28T11:32:40Z |
| Database host | `db.eetbmwahutjggjiqnjdy.supabase.co` |

**App domain inference:** table/column names (`anime_catalog`, `anilist_sync_cache`, `watch_history`, `anilist_username`, `mal_id`) indicate this is an **anime tracking / streaming app** that syncs watch progress with AniList and MyAnimeList (MAL), and caches AniList data.

---

## 2. Installed Postgres Extensions

Only extensions with a non-null `installed_version` are actually active (the rest are merely available):

| Extension | Version | Schema | Purpose |
|---|---|---|---|
| `plpgsql` | 1.0 | pg_catalog | Procedural language (used by all custom functions/triggers) |
| `uuid-ossp` | 1.1 | extensions | UUID generation |
| `pgcrypto` | 1.3 | extensions | Cryptographic functions |
| `pg_stat_statements` | 1.11 | extensions | Query performance stats |
| `supabase_vault` | 0.3.1 | vault | Supabase secrets vault |

No vector/AI extensions, no PostGIS, no pg_cron, no pg_net are installed — the project does not currently use scheduled jobs, background HTTP calls, or embeddings.

---

## 3. `public` Schema — Application Tables

### 3.1 `public.profiles`
User profile, extends `auth.users` 1:1.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid (PK, FK → `auth.users.id`) | — | Same UUID as the auth user |
| `username` | text, nullable | — | Auto-generated on signup (see trigger below) |
| `full_name` | text, nullable | — | From OAuth/signup metadata |
| `avatar_url` | text, nullable | placeholder image URL | Default avatar |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | Auto-updated by trigger |
| `role` | text | `'user'` | CHECK: `role IN ('user','admin')` |
| `anilist_username` | text, nullable | — | Linked AniList account |

**Row count (at export time):** 0
**RLS:** enabled

**Triggers:**
- `profiles_updated_at` (BEFORE UPDATE) → `handle_updated_at()` — sets `updated_at = now()`

**RLS Policies:**
| Policy | Command | Role | Using / Check |
|---|---|---|---|
| Users read own profile | SELECT | public | `auth.uid() = id` |
| Users insert own profile | INSERT | public | WITH CHECK `auth.uid() = id` |
| Users update own profile | UPDATE | public | `auth.uid() = id` |
| Users delete own profile | DELETE | public | `auth.uid() = id` |
| Admins can view all profiles | SELECT | public | `is_admin()` |
| Admins can update all profiles | UPDATE | public | `is_admin()` |
| Admins can delete profiles | DELETE | authenticated | `is_admin()` |

→ Standard owner-based access plus an admin override via the `is_admin()` helper (checks `profiles.role = 'admin'` for the calling `auth.uid()`).

---

### 3.2 `public.watch_history`
Tracks per-user, per-episode watch progress.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `user_id` | uuid (FK → `auth.users.id`) | — | |
| `anilist_id` | integer, nullable | — | AniList media ID |
| `title` | text, nullable | — | |
| `poster` | text, nullable | — | |
| `episode` | integer | — | |
| `language` | text | — | |
| `current_time_seconds` | integer | 0 | Playback position |
| `duration_seconds` | integer | 0 | Total episode length |
| `progress_percent` | numeric, nullable | 0 | |
| `completed` | boolean | false | |
| `server` | text, nullable | — | Streaming source/server used |
| `status` | text | `'watching'` | CHECK: `IN ('watching','completed','on_hold','dropped','plan_to_watch')` — mirrors AniList/MAL list statuses |
| `last_watched_at` | timestamptz | `now()` | Auto-set by trigger on every update |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | Auto-set by trigger |
| `mal_id` | integer, nullable | — | MyAnimeList ID |

**Row count:** 12
**RLS:** enabled

**Triggers:**
- `watch_history_updated_at` (BEFORE UPDATE) → `update_updated_at_column()` — sets both `updated_at` and `last_watched_at` to `now()`

**RLS Policies:** (owner-only, no admin override)
| Policy | Command | Using / Check |
|---|---|---|
| Users can view their own watch history | SELECT | `auth.uid() = user_id` |
| Users can insert their own watch history | INSERT | WITH CHECK `auth.uid() = user_id` |
| Users can update their own watch history | UPDATE | `auth.uid() = user_id` |
| Users can delete their own watch history | DELETE | `auth.uid() = user_id` |

---

### 3.3 `public.anilist_sync_cache`
Caches a user's synced AniList list data.

| Column | Type | Default | Notes |
|---|---|---|---|
| `user_id` | uuid (PK, FK → `auth.users.id`) | — | One row per user |
| `anilist_username` | text | — | |
| `data` | jsonb | — | Raw synced AniList payload |
| `synced_at` | timestamptz | `now()` | |

**Row count:** 0
**RLS:** enabled (owner-only)

| Policy | Command | Using / Check |
|---|---|---|
| Users read own anilist cache | SELECT | `auth.uid() = user_id` |
| Users insert own anilist cache | INSERT | WITH CHECK `auth.uid() = user_id` |
| Users update own anilist cache | UPDATE | `auth.uid() = user_id` |
| Users delete own anilist cache | DELETE | `auth.uid() = user_id` |

---

### 3.4 `public.anime_catalog`
Global anime metadata catalog (not user-specific).

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | bigint (PK, identity) | auto | |
| `anilist_id` | integer, nullable, unique | — | |
| `mal_id` | integer, nullable, unique | — | |
| `title_english` | text, nullable | — | |
| `title_romaji` | text, nullable | — | |
| `title_native` | text, nullable | — | |
| `poster` | text, nullable | — | |
| `banner` | text, nullable | — | |
| `description` | text, nullable | — | |
| `format` | text, nullable | — | e.g. TV, Movie |
| `status` | text, nullable | — | e.g. airing, finished |
| `episodes` | integer, nullable | — | |
| `duration` | integer, nullable | — | |
| `season` | text, nullable | — | |
| `season_year` | integer, nullable | — | |
| `genres` | jsonb | `[]` | |
| `metadata_source` | text, nullable | — | e.g. "anilist" / "mal" |
| `last_synced_at` | timestamptz | `now()` | |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

**Row count:** 348
**RLS: ⚠️ DISABLED** — no policies exist on this table.

> **🔴 Security finding (unmodified — flagged only, not fixed):**
> `public.anime_catalog` has RLS **disabled**, which means it is fully exposed via the PostgREST API to both the `anon` and `authenticated` roles — anyone with your project's anon/public key can read **and write/delete** every row in this table, since no RLS means no restriction at all once exposed.
> Supabase's own advisor calls this a **critical** severity issue.
> Remediation SQL (not run):
> ```sql
> ALTER TABLE "public"."anime_catalog" ENABLE ROW LEVEL SECURITY;
> -- then add explicit policies, e.g. public read-only:
> CREATE POLICY "Public can read catalog" ON public.anime_catalog
>   FOR SELECT USING (true);
> ```
> Since this table appears to be a public, shared read-only catalog (not user data), simply enabling RLS **without** adding a SELECT policy will break your app (nobody, including the client, will be able to read it). You'd want RLS enabled + a public-read policy, and no insert/update/delete policies (so only the service role / backend can write to it).

---

## 4. `auth` Schema (Supabase-managed)

Standard Supabase Auth schema, all RLS-protected/locked down by Supabase itself except a few internal OAuth-server tables. Key tables relevant to your app's auth flow:

| Table | Rows | Purpose |
|---|---|---|
| `auth.users` | 2 | Core user accounts (email, encrypted password, metadata, etc.) |
| `auth.identities` | 0 | Linked OAuth/social identities (empty → no social logins used yet, or identities not populated) |
| `auth.sessions` | 3 | Active login sessions |
| `auth.refresh_tokens` | 49 | JWT refresh token history |
| `auth.mfa_factors` / `mfa_challenges` / `mfa_amr_claims` | 0 / 0 / 1 | MFA — one AMR claim exists, meaning at least one session used a specific auth method claim (likely just password/`aal1`), but no MFA factors are enrolled |
| `auth.sso_providers`, `saml_*`, `scim_*` | 0 | Enterprise SSO/SAML/SCIM — not configured |
| `auth.oauth_clients`, `oauth_authorizations`, `oauth_consents` | 0 | Supabase acting as an OAuth **provider** to third parties — not used |
| `auth.webauthn_credentials`, `webauthn_challenges` | 0 | Passkeys — not used |
| `auth.one_time_tokens` | 0 | Password reset / email confirmation tokens (currently none pending) |
| `auth.flow_state` | 0 | PKCE/OAuth login flow state — not used |

**Interpretation of current auth usage:** With `auth.users` = 2, `auth.identities` = 0, and MFA factors = 0, the app is currently using **email/password authentication only** (no social/OAuth logins linked, no MFA enrolled, no SSO). 3 active sessions and 49 historical refresh tokens for 2 users suggests normal multi-device/re-login usage over time.

---

## 5. Signup / New-User Flow (End-to-End)

This is the exact automated flow that runs when a new user signs up via Supabase Auth:

```
1. Client calls supabase.auth.signUp() (or OAuth/social login)
   → row inserted into auth.users
2. AFTER INSERT trigger "on_auth_user_created" fires on auth.users
   → calls public.handle_new_user()   [SECURITY DEFINER]
3. handle_new_user() logic:
   a. Builds a base username from raw_user_meta_data->>'full_name',
      falling back to the email's local part, falling back to 'user'.
      Lowercases it and strips all non a-z0-9 characters.
   b. Appends a random 4-digit number (1000–9999) to the base name,
      retrying up to 5 times if the candidate username collides
      with an existing public.profiles.username.
   c. If still colliding after 5 tries, falls back to
      base_name + '_' + first 8 chars of the user's UUID (no dashes)
      — this fallback is guaranteed unique.
   d. INSERTs a new row into public.profiles:
        id        = new.id (same UUID as auth.users)
        username  = the generated candidate
        full_name = trimmed raw_user_meta_data->>'full_name' (or NULL)
        role      = 'user'   (hardcoded — admins must be promoted manually)
   e. On any exception, logs the error (raise log) with sqlerrm,
      user_id, email, and metadata, then re-raises (so signup fails
      loudly rather than silently leaving a user without a profile).
4. Result: every successful signup guarantees exactly one
   public.profiles row with id = auth.users.id.
```

**Important function-level detail:** `handle_new_user()` is `SECURITY DEFINER` with `search_path` locked to `'public','auth'`. This is safe as written, but Supabase's advisor flags that it is currently **executable directly via RPC** (`/rest/v1/rpc/handle_new_user`) by both `anon` and `authenticated` roles — i.e., anyone could call it manually outside of the trigger context (though calling it directly wouldn't have a meaningful `new` row context outside a trigger, so real-world exploitability is low, but Supabase still flags it as a hardening item).

---

## 6. Custom Database Functions

| Function | Language | Security | search_path | Purpose |
|---|---|---|---|---|
| `public.handle_new_user()` | plpgsql | DEFINER | `public, auth` | Auto-creates a profile row on signup (see §5) |
| `public.handle_updated_at()` | plpgsql | INVOKER (default) | ⚠️ not set | Generic `updated_at = now()` trigger function, used by `profiles` |
| `public.update_updated_at_column()` | plpgsql | INVOKER (default) | ⚠️ not set | Sets `updated_at` **and** `last_watched_at` to `now()`, used by `watch_history` |
| `public.is_admin()` | sql | DEFINER, STABLE | `public` | Returns `true` if `auth.uid()` has `role = 'admin'` in `profiles`. Used by admin RLS policies on `profiles`. Also flagged as callable directly via RPC by any role (low risk — it just returns a boolean about the caller's own admin status). |

**Advisor warnings on functions (informational, not fixed):**
- `handle_updated_at` and `update_updated_at_column` have a **mutable search_path** (not explicitly pinned) — best practice recommends adding `SET search_path = ''` or `'public'` to prevent search-path-hijacking attacks, though risk here is low since they contain no dynamic SQL.

---

## 7. Full Trigger Inventory

| Table | Trigger | Timing/Event | Function |
|---|---|---|---|
| `auth.users` | `on_auth_user_created` | AFTER INSERT | `handle_new_user()` |
| `public.profiles` | `profiles_updated_at` | BEFORE UPDATE | `handle_updated_at()` |
| `public.watch_history` | `watch_history_updated_at` | BEFORE UPDATE | `update_updated_at_column()` |

`anilist_sync_cache` and `anime_catalog` have **no triggers** — `synced_at`/timestamp columns on those tables are only set at INSERT time via column defaults, not auto-refreshed on update.

---

## 8. Row Level Security — Full Summary Table

| Table | RLS Enabled? | Access Model |
|---|---|---|
| `public.profiles` | ✅ Yes | Owner (`auth.uid() = id`) full CRUD + Admin (`is_admin()`) full override |
| `public.watch_history` | ✅ Yes | Owner-only (`auth.uid() = user_id`) full CRUD, no admin override |
| `public.anilist_sync_cache` | ✅ Yes | Owner-only (`auth.uid() = user_id`) full CRUD, no admin override |
| `public.anime_catalog` | 🔴 **No** | **No policies — fully open to anon/authenticated via API** (see §3.4 finding) |
| All `auth.*` tables | ✅ Yes (Supabase-managed) | Locked down by Supabase; not user-configurable |

---

## 9. Edge Functions

**None deployed.** `list_edge_functions` returned an empty array — all business logic currently lives in Postgres functions/triggers and/or the client app; there is no serverless function layer.

---

## 10. Security Advisor Findings (informational snapshot, nothing changed)

| Severity | Finding | Affected | Status |
|---|---|---|---|
| 🔴 Critical | RLS disabled on a public-schema table | `public.anime_catalog` | Unaddressed |
| ⚠️ Warn | Mutable `search_path` on function | `handle_updated_at`, `update_updated_at_column` | Unaddressed |
| ⚠️ Warn | SECURITY DEFINER function callable by `anon` | `handle_new_user()`, `is_admin()` | Unaddressed |
| ⚠️ Warn | SECURITY DEFINER function callable by `authenticated` | `handle_new_user()`, `is_admin()` | Unaddressed |
| ⚠️ Warn | Leaked password protection disabled (no HaveIBeenPwned check on signup passwords) | Auth config | Unaddressed |

*No changes were made to fix any of these — they are reported for awareness only, per your request.*

---

## 11. Quick Reference — Relationship (ER) Summary

```
auth.users (id) 1───1 public.profiles (id, PK/FK)
auth.users (id) 1───* public.watch_history (user_id, FK)
auth.users (id) 1───1 public.anilist_sync_cache (user_id, PK/FK)
public.anime_catalog  — standalone catalog table, no FK relation to auth.users
                         (linked to watch_history only loosely/logically via anilist_id / mal_id,
                          not by a real foreign key constraint)
```

Note: `watch_history.anilist_id` / `watch_history.mal_id` are **not** declared as foreign keys to `anime_catalog.anilist_id` / `anime_catalog.mal_id` — the relationship is implicit/application-level only, not enforced by the database.

---

## 12. Summary for an AI Assistant Picking Up This Project

- **Stack:** Supabase (Postgres 17) + Supabase Auth (email/password based currently), no Edge Functions, no scheduled jobs.
- **Domain:** Anime tracking app integrating with AniList and MyAnimeList.
- **Core tables:** `profiles` (1:1 with auth users, has `role` for admin/user), `watch_history` (per-episode progress tracking), `anilist_sync_cache` (per-user cached AniList payload), `anime_catalog` (global, shared anime metadata, 348 rows).
- **Auth flow:** Signup → `auth.users` insert → trigger auto-creates a `profiles` row with a randomly-suffixed unique username and default `role='user'`.
- **Access control:** Consistent owner-based RLS (`auth.uid() = <owner column>`) everywhere except `anime_catalog`, which currently has **no RLS at all** and is wide open — this is the single most important fact for any AI or developer to know before writing new code against this table.
- **Admin capability:** `is_admin()` SQL function checks `profiles.role = 'admin'`; used only in `profiles` policies today (no admin bypass on `watch_history` or `anilist_sync_cache`).
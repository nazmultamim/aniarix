import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export class AnimeIdentityError extends Error {
  constructor(message, { cause = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'AnimeIdentityError';
  }
}

export class AnimeIdentityConflictError extends AnimeIdentityError {
  constructor(message) {
    super(message);
    this.name = 'AnimeIdentityConflictError';
  }
}

function assertValidProvidedIds({ anilistId = null, malId = null } = {}) {
  const identity = createAnimeIdentity({ anilistId, malId });
  const hasInvalidAniListId = anilistId != null && identity.anilistId === null;
  const hasInvalidMalId = malId != null && identity.malId === null;

  if (hasInvalidAniListId || hasInvalidMalId) {
    throw new AnimeIdentityError('AniList and MAL IDs must be positive integers.');
  }

  return identity;
}

async function findCatalogRows(identity) {
  const supabase = createAdminClient();
  const select = 'id, anilist_id, mal_id';
  const [anilistResult, malResult] = await Promise.all([
    identity.anilistId
      ? supabase.from('anime_catalog').select(select).eq('anilist_id', identity.anilistId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    identity.malId
      ? supabase.from('anime_catalog').select(select).eq('mal_id', identity.malId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (anilistResult.error || malResult.error) {
    throw new AnimeIdentityError('Could not resolve anime identity from the catalog.', {
      cause: anilistResult.error || malResult.error,
    });
  }

  return {
    anilistRow: anilistResult.data,
    malRow: malResult.data,
  };
}

function resolveCatalogRows(identity, { anilistRow, malRow }) {
  if (anilistRow && malRow && anilistRow.id !== malRow.id) {
    throw new AnimeIdentityConflictError('AniList and MAL IDs are already mapped to different catalog rows.');
  }

  const row = anilistRow || malRow || null;
  if (!row) return identity;

  const catalogAniListId = normalizeId(row.anilist_id);
  const catalogMalId = normalizeId(row.mal_id);

  if (identity.anilistId && catalogAniListId && identity.anilistId !== catalogAniListId) {
    throw new AnimeIdentityConflictError('The supplied AniList ID conflicts with the catalog mapping.');
  }
  if (identity.malId && catalogMalId && identity.malId !== catalogMalId) {
    throw new AnimeIdentityConflictError('The supplied MAL ID conflicts with the catalog mapping.');
  }

  return {
    anilistId: catalogAniListId || identity.anilistId || null,
    malId: catalogMalId || identity.malId || null,
  };
}

async function updateMissingIdentityFields(row, identity) {
  const updates = {};
  if (!row.anilist_id && identity.anilistId) updates.anilist_id = identity.anilistId;
  if (!row.mal_id && identity.malId) updates.mal_id = identity.malId;
  if (Object.keys(updates).length === 0) return row;

  updates.updated_at = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('anime_catalog')
    .update(updates)
    .eq('id', row.id)
    .select('id, anilist_id, mal_id')
    .maybeSingle();

  if (error || !data) {
    throw new AnimeIdentityError('Could not update the anime identity mapping.', { cause: error });
  }

  return data;
}

function catalogMetadataPayload(anime) {
  const values = {
    title_english: anime?.title?.english,
    title_romaji: anime?.title?.romaji,
    title_native: anime?.title?.native,
    poster: anime?.poster,
    banner: anime?.banner,
    description: anime?.description,
    format: anime?.format,
    status: anime?.status,
    episodes: anime?.episodes,
    duration: anime?.duration,
    season: anime?.season,
    season_year: anime?.seasonYear,
    genres: Array.isArray(anime?.genres) ? anime.genres : null,
    metadata_source: anime?.source || null,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return Object.fromEntries(Object.entries(values).filter(([, value]) => value != null));
}

const CATALOG_METADATA_FIELDS = [
  'id', 'anilist_id', 'mal_id', 'title_english', 'title_romaji', 'title_native',
  'poster', 'banner', 'description', 'format', 'status', 'episodes', 'duration',
  'season', 'season_year', 'genres', 'metadata_source', 'last_synced_at',
].join(', ');

function normalizeCatalogAnime(row) {
  if (!row || typeof row !== 'object') return null;
  const identity = createAnimeIdentity({ anilistId: row.anilist_id, malId: row.mal_id });
  if (!hasAnimeIdentity(identity)) return null;

  return {
    ...identity,
    title: {
      english: row.title_english || null,
      romaji: row.title_romaji || null,
      native: row.title_native || null,
    },
    poster: row.poster || null,
    banner: row.banner || null,
    description: row.description || null,
    format: row.format || null,
    status: row.status || null,
    episodes: normalizeId(row.episodes),
    duration: normalizeId(row.duration),
    season: row.season || null,
    seasonYear: normalizeId(row.season_year),
    genres: Array.isArray(row.genres) ? row.genres.filter((genre) => typeof genre === 'string') : [],
    source: 'cache',
    metadataStatus: 'stale',
  };
}

/**
 * Normalize independently-scoped external IDs without ever substituting one
 * provider's ID for the other.
 */
export function createAnimeIdentity({ anilistId = null, malId = null } = {}) {
  return {
    anilistId: normalizeId(anilistId),
    malId: normalizeId(malId),
  };
}

export function hasAnimeIdentity(identity) {
  return Boolean(identity?.anilistId || identity?.malId);
}

/**
 * Preserve known identity mappings when a source only supplies one ID.
 */
export function applyAnimeIdentity(anime, identity = {}) {
  if (!anime || typeof anime !== 'object') return anime;

  const known = createAnimeIdentity(identity);
  return {
    ...anime,
    anilistId: known.anilistId || anime.anilistId || null,
    malId: known.malId || anime.malId || null,
  };
}

/**
 * Resolve known external IDs through anime_catalog. This never uses title
 * matching and never treats a MAL ID as an AniList ID.
 */
export async function resolveAnimeIdentity({ anilistId = null, malId = null } = {}) {
  const identity = assertValidProvidedIds({ anilistId, malId });
  if (!hasAnimeIdentity(identity)) return identity;

  const rows = await findCatalogRows(identity);
  return resolveCatalogRows(identity, rows);
}

/** Read an exact, normalized metadata record from the persistent catalog. */
export async function getAnimeFromCatalog({ anilistId = null, malId = null } = {}) {
  const identity = assertValidProvidedIds({ anilistId, malId });
  if (!hasAnimeIdentity(identity)) return null;

  const rows = await findCatalogRows(identity);
  const resolved = resolveCatalogRows(identity, rows);
  const row = rows.anilistRow || rows.malRow;
  if (!row) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('anime_catalog')
    .select(CATALOG_METADATA_FIELDS)
    .eq('id', row.id)
    .maybeSingle();
  if (error) throw new AnimeIdentityError('Could not read anime metadata from the catalog.', { cause: error });

  return applyAnimeIdentity(normalizeCatalogAnime(data), resolved);
}

/**
 * Bounded catalog read for discovery/search outages. This is metadata
 * retrieval only; it never creates or infers an identity from titles.
 */
export async function getAnimeCollectionFromCatalog({ query = null, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 25);
  const supabase = createAdminClient();
  let request = supabase
    .from('anime_catalog')
    .select(CATALOG_METADATA_FIELDS)
    .order('last_synced_at', { ascending: false })
    .limit(safeLimit * 3);

  const term = String(query || '').trim().replace(/[%,()]/g, '');
  if (term) {
    request = request.or([
      `title_english.ilike.%${term}%`,
      `title_romaji.ilike.%${term}%`,
      `title_native.ilike.%${term}%`,
    ].join(','));
  }

  const { data, error } = await request;
  if (error) throw new AnimeIdentityError('Could not read anime collection from the catalog.', { cause: error });

  return (data || [])
    .map(normalizeCatalogAnime)
    .filter((anime) => anime?.title?.english || anime?.title?.romaji || anime?.title?.native)
    .slice(0, safeLimit);
}

/**
 * Persist a mapping only when trusted server-side code has supplied both
 * external IDs. Existing non-null IDs are validated and never overwritten.
 */
export async function persistTrustedAnimeIdentity({ anilistId = null, malId = null } = {}) {
  const identity = assertValidProvidedIds({ anilistId, malId });
  if (!identity.anilistId || !identity.malId) {
    throw new AnimeIdentityError('Trusted identity persistence requires both AniList and MAL IDs.');
  }

  let rows = await findCatalogRows(identity);
  let resolved = resolveCatalogRows(identity, rows);
  const existingRow = rows.anilistRow || rows.malRow;

  if (existingRow) {
    const updated = await updateMissingIdentityFields(existingRow, resolved);
    return {
      anilistId: normalizeId(updated.anilist_id) || resolved.anilistId,
      malId: normalizeId(updated.mal_id) || resolved.malId,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('anime_catalog')
    .insert({
      anilist_id: identity.anilistId,
      mal_id: identity.malId,
      metadata_source: 'anilist',
      last_synced_at: new Date().toISOString(),
    })
    .select('id, anilist_id, mal_id')
    .maybeSingle();

  if (!error && data) {
    return {
      anilistId: normalizeId(data.anilist_id),
      malId: normalizeId(data.mal_id),
    };
  }

  // A concurrent trusted request may have inserted the same mapping after our
  // lookup. Re-read it and validate rather than overwriting either identity.
  if (error?.code === '23505') {
    rows = await findCatalogRows(identity);
    resolved = resolveCatalogRows(identity, rows);
    const concurrentRow = rows.anilistRow || rows.malRow;
    if (concurrentRow) {
      const updated = await updateMissingIdentityFields(concurrentRow, resolved);
      return {
        anilistId: normalizeId(updated.anilist_id) || resolved.anilistId,
        malId: normalizeId(updated.mal_id) || resolved.malId,
      };
    }
  }

  throw new AnimeIdentityError('Could not persist the trusted anime identity mapping.', { cause: error });
}

/**
 * Persist normalized metadata under an exact resolved identity. Null source
 * fields are intentionally omitted, so a fallback cannot erase known data.
 */
export async function persistAnimeCatalogMetadata(anime) {
  const identity = assertValidProvidedIds(anime);
  if (!hasAnimeIdentity(identity)) {
    throw new AnimeIdentityError('Anime catalog persistence requires an AniList ID or MAL ID.');
  }

  const rows = await findCatalogRows(identity);
  const resolved = resolveCatalogRows(identity, rows);
  const existingRow = rows.anilistRow || rows.malRow;
  const metadata = catalogMetadataPayload(anime);
  const supabase = createAdminClient();

  if (existingRow) {
    const identityUpdates = {};
    if (!existingRow.anilist_id && resolved.anilistId) identityUpdates.anilist_id = resolved.anilistId;
    if (!existingRow.mal_id && resolved.malId) identityUpdates.mal_id = resolved.malId;
    const { error } = await supabase
      .from('anime_catalog')
      .update({ ...metadata, ...identityUpdates })
      .eq('id', existingRow.id);
    if (error) throw new AnimeIdentityError('Could not persist anime catalog metadata.', { cause: error });
    return resolved;
  }

  const { data, error } = await supabase
    .from('anime_catalog')
    .insert({
      anilist_id: identity.anilistId,
      mal_id: identity.malId,
      ...metadata,
    })
    .select('anilist_id, mal_id')
    .maybeSingle();
  if (error || !data) {
    throw new AnimeIdentityError('Could not create anime catalog metadata.', { cause: error });
  }
  return { anilistId: normalizeId(data.anilist_id), malId: normalizeId(data.mal_id) };
}

/**
 * Persist metadata returned by AniList. AniList is trusted to associate its
 * own `id` and `idMal`, but catalog conflicts are still surfaced rather than
 * silently changing either external identity.
 */
export async function persistTrustedAniListAnime(anime) {
  const identity = assertValidProvidedIds(anime);
  if (!identity.anilistId) {
    throw new AnimeIdentityError('AniList catalog persistence requires an AniList ID.');
  }

  // A trusted AniList pair is the only path that may create or extend an
  // AniList-to-MAL mapping. This throws AnimeIdentityConflictError if either
  // supplied ID already belongs to a different catalog row.
  const mappedIdentity = identity.malId
    ? await persistTrustedAnimeIdentity(identity)
    : identity;
  const resolvedIdentity = await persistAnimeCatalogMetadata({
    ...anime,
    ...mappedIdentity,
    source: 'anilist',
  });

  return {
    anilistId: resolvedIdentity.anilistId || mappedIdentity.anilistId,
    malId: resolvedIdentity.malId || mappedIdentity.malId || null,
  };
}

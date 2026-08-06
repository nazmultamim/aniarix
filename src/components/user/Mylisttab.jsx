'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    Loader2, RefreshCw, AlertCircle, Star, Tv, Film, Music2, Disc3, Clapperboard,
    ChevronLeft, ChevronRight, Upload,
} from 'lucide-react';
import { getAnilistList, setAnilistUsername, syncAnilistList } from '@/lib/action/Anilist.sync.actions';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h
const PAGE_SIZE = 18;

const STATUS_FILTERS = [
    { value: 'ALL', label: 'All' },
    { value: 'CURRENT', label: 'Watching' },
    { value: 'PLANNING', label: 'Planning' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'DROPPED', label: 'Dropped' },
];

const FORMAT_ICONS = {
    TV: Tv,
    TV_SHORT: Tv,
    MOVIE: Film,
    OVA: Disc3,
    ONA: Disc3,
    SPECIAL: Clapperboard,
    MUSIC: Music2,
};

const AIRING_STATUS_STYLE = {
    RELEASING: 'text-emerald-400',
    FINISHED: 'text-muted-foreground/50',
    NOT_YET_RELEASED: 'text-amber-400',
    CANCELLED: 'text-red-400',
    HIATUS: 'text-orange-400',
};

const AIRING_STATUS_LABEL = {
    RELEASING: 'Releasing',
    FINISHED: 'Finished',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'Hiatus',
};

function formatLabel(format) {
    if (!format) return 'TV';
    return format.replace('_', ' ');
}

export default function MyListTab() {
    const [loading, setLoading] = useState(true);
    const [lists, setLists] = useState(null);
    const [syncedAt, setSyncedAt] = useState(null);
    const [username, setUsername] = useState(null);
    const [usernameInput, setUsernameInput] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [pageIndex, setPageIndex] = useState(0);

    const loadFromCache = useCallback(async () => {
        setLoading(true);
        const result = await getAnilistList();
        setLists(result.lists);
        setSyncedAt(result.syncedAt);
        setUsername(result.username);
        setLoading(false);

        if (result.username && result.syncedAt) {
            const age = Date.now() - new Date(result.syncedAt).getTime();
            if (age > STALE_AFTER_MS) {
                syncAnilistList().then((syncResult) => {
                    if (syncResult?.lists) {
                        setLists(syncResult.lists);
                        setSyncedAt(syncResult.syncedAt);
                    }
                });
            }
        }
    }, []);

    useEffect(() => {
        loadFromCache();
    }, [loadFromCache]);

    async function handleSetUsername(e) {
        e.preventDefault();
        if (!usernameInput.trim()) return;
        setSyncing(true);
        setError('');

        const result = await setAnilistUsername(usernameInput.trim());
        setSyncing(false);

        if (result?.error) {
            setError(result.error);
            return;
        }
        setLists(result.lists);
        setSyncedAt(result.syncedAt);
        setUsername(usernameInput.trim());
    }

    async function handleRefresh() {
        setSyncing(true);
        setError('');

        const result = await syncAnilistList();
        setSyncing(false);

        if (result?.error) {
            setError(result.error);
            return;
        }
        setLists(result.lists);
        setSyncedAt(result.syncedAt);
    }

    // Flattened entries across every status list — the card grid never
    // shows per-status section headers, filtering is what narrows it.
    //
    // Deduped by entry.id: if the AniList account uses custom lists,
    // AniList returns the same entry in BOTH its status-based list AND
    // any custom list it belongs to (e.g. "Watching" + a custom "Rewatch"
    // list) — same underlying entry id, counted twice. Without this, the
    // total (and therefore the page count) comes out inflated.
    const allEntries = useMemo(() => {
        if (!lists) return [];
        const seen = new Set();
        const result = [];
        for (const list of lists) {
            for (const entry of list.entries) {
                if (seen.has(entry.id)) continue;
                seen.add(entry.id);
                result.push({ ...entry, listStatus: list.status });
            }
        }
        return result;
    }, [lists]);

    const statusCounts = useMemo(() => {
        const counts = { ALL: allEntries.length };
        for (const entry of allEntries) {
            counts[entry.listStatus] = (counts[entry.listStatus] || 0) + 1;
        }
        return counts;
    }, [allEntries]);

    const visibleEntries = useMemo(() => {
        if (statusFilter === 'ALL') return allEntries;
        return allEntries.filter((entry) => entry.listStatus === statusFilter);
    }, [allEntries, statusFilter]);

    // Switching filters always starts back at page 1 — staying on, say,
    // page 4 of "Completed" while now viewing "Dropped" (which might only
    // have one page) would just show an empty grid.
    useEffect(() => {
        setPageIndex(0);
    }, [statusFilter]);

    const pageCount = Math.ceil(visibleEntries.length / PAGE_SIZE);

    // Clamp in case a refresh shrinks the list out from under the current page
    useEffect(() => {
        if (pageIndex > 0 && pageIndex >= pageCount) {
            setPageIndex(Math.max(0, pageCount - 1));
        }
    }, [pageIndex, pageCount]);

    const paginatedEntries = useMemo(() => {
        const start = pageIndex * PAGE_SIZE;
        return visibleEntries.slice(start, start + PAGE_SIZE);
    }, [visibleEntries, pageIndex]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!username) {
        return (
            <div className="max-w-md mx-auto  px-4">
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

                    <div className="text-center mb-6">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-3 shadow-inner">
                            <Upload className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-semibold text-zinc-100">Sync AniList Account</h3>
                        <p className="text-xs text-zinc-400 mt-1">
                            Enter your username to import your watchlist & progress.
                        </p>
                    </div>

                    <form onSubmit={handleSetUsername} className="space-y-3">
                        <div className="relative group">
                            <input
                                type="text"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                placeholder="AniList username"
                                className="w-full h-11 rounded-xl border border-white/10 bg-zinc-900/90 px-4 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-inner"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={syncing || !usernameInput.trim()}
                            className="relative flex w-full h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-md group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 transition-opacity group-hover:opacity-90" />
                            <span className="relative z-10 flex items-center gap-2">
                                {syncing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Syncing Account...</span>
                                    </>
                                ) : (
                                    'Sync Account'
                                )}
                            </span>
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-400">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="truncate">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-row items-center justify-between sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5 text-xs text-muted-foreground/60">
                    <div>
                        Synced from <span className="text-orange-400 font-semibold">@{username}</span>
                    </div>
                    {syncedAt && (
                        <span className="text-[11px] sm:text-xs text-zinc-500">
                            <span className="hidden sm:inline">· </span>
                            {new Date(syncedAt).toLocaleString()}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={syncing}
                    className="inline-flex items-center cursor-pointer gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 text-[11px] font-semibold text-zinc-300 hover:text-orange-400 transition-all duration-200 disabled:opacity-50 active:scale-95 shrink-0 shadow-sm"
                >
                    {syncing ? (
                        <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                    ) : (
                        <RefreshCw className="w-3 h-3 text-zinc-400 hover:text-orange-400 transition-colors" />
                    )}
                    <span>Refresh</span>
                </button>
            </div>

            {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
            )}

            {/* Status filter tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {STATUS_FILTERS.map((filter) => {
                    const count = statusCounts[filter.value] || 0;
                    const active = statusFilter === filter.value;
                    return (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${active
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)]'
                                : 'border border-white/[0.08] bg-white/[0.03] text-muted-foreground/60 hover:text-white hover:border-white/[0.16]'
                                }`}
                        >
                            {filter.label}
                            <span className={active ? 'text-white/70' : 'text-muted-foreground/40'}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {visibleEntries.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground/40">
                    Nothing here yet.
                </p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {paginatedEntries.map((entry) => {
                        const media = entry.media;
                        const title = media?.title?.english || media?.title?.romaji || 'Untitled anime';
                        const FormatIcon = FORMAT_ICONS[media?.format] || Tv;
                        const userScore = entry.score > 0 ? entry.score : null;
                        const displayScore = userScore ?? (media?.averageScore ? (media.averageScore / 10).toFixed(1) : null);
                        const airingLabel = AIRING_STATUS_LABEL[media?.status];
                        const airingStyle = AIRING_STATUS_STYLE[media?.status] || 'text-muted-foreground/50';
                        const genres = (media?.genres || []).slice(0, 2);
                        const watchUrl = media?.id ? `/anime/${media.id}` : '/anime';

                        return (
                            <a
                                key={entry.id}
                                href={watchUrl}
                                aria-label={`Watch ${title}`}
                                className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-orange-500/30 hover:shadow-[0_8px_30px_-12px_rgba(249,115,22,0.35)]"
                            >
                                <div className="relative aspect-[2/3] overflow-hidden">
                                    <img
                                        src={media?.coverImage?.large || 'https://placehold.co/400x600/111111/f97316?text=No+Image'}
                                        alt={title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10" />

                                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white">
                                        <FormatIcon className="w-3 h-3" />
                                        {formatLabel(media?.format)}
                                    </div>

                                    {displayScore && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-orange-500/20 text-[10px] font-bold text-orange-400">
                                            <Star className="w-3 h-3 fill-orange-400" />
                                            {displayScore}
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                        <h3 className="text-[13px] font-bold text-white leading-tight line-clamp-2 mb-1.5">
                                            {title}
                                        </h3>

                                        {genres.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                                {genres.map((genre) => (
                                                    <span
                                                        key={genre}
                                                        className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold uppercase text-white/70"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[10px] font-medium">
                                            <span className="text-muted-foreground/60">
                                                {entry.progress}/{media?.episodes ?? '?'} eps
                                            </span>
                                            {airingLabel && <span className={airingStyle}>{airingLabel}</span>}
                                        </div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            {pageCount > 1 && (
                <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={pageIndex === 0}
                        aria-label="Previous page"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground/60 transition-all hover:border-orange-500/40 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-muted-foreground/60">
                        Page {pageIndex + 1} of {pageCount}
                    </span>
                    <button
                        onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                        disabled={pageIndex >= pageCount - 1}
                        aria-label="Next page"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground/60 transition-all hover:border-orange-500/40 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

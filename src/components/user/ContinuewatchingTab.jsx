'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Loader2, Trash2, Eye } from 'lucide-react';
import { getWatchHistory, deleteWatchHistoryEntry } from '@/lib/action/Getwatchhistory';
import { deleteProgressEntry } from '@/services/progressTracker.service';

export default function ContinueWatching() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    const { entries } = await getWatchHistory(20);
    setEntries(entries);
    setLoading(false);
  }

  async function handleRemove(id, anilistId, episode) {
    setRemoving(id);

    // Optimistic removal from UI
    const previousEntries = entries;
    setEntries(prev => prev.filter(e => e.id !== id));

    // Remove the local cache entry regardless of what happens next —
    // it's just a resume-point cache, safe to drop either way.
    if (anilistId && episode) {
      deleteProgressEntry(anilistId, episode);
    }

    // Delete the actual DB row — without this, the entry reappears on
    // next load since getWatchHistory reads straight from watch_history.
    const result = await deleteWatchHistoryEntry(id);
    if (result?.error) {
      console.error('Failed to delete watch history entry:', result.error);
      // Roll back the optimistic removal so the UI matches reality
      setEntries(previousEntries);
    }

    setRemoving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
          <Eye className="w-7 h-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-semibold text-white/70">No watch history yet</p>
        <p className="text-xs text-muted-foreground/40 mt-1">
          Start watching something and it'll show up here.
        </p>
        <Link
          href="/anime"
          className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-semibold transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        >
          Browse Anime
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {entries.map((entry) => {
        const progress = Math.round(entry.progress_percent || 0);
        const isCompleted = entry.completed || progress >= 95;
        const episode = Number(entry.episode) || 1;
        const watchUrl = `/watch/${entry.anilist_id}/ep-${episode}?lang=${entry.language || 'sub'}${entry.server ? `&server=${entry.server}` : ''}`;

        return (
          <div
            key={entry.id}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-orange-500/30 hover:shadow-[0_8px_30px_-12px_rgba(249,115,22,0.3)]"
          >
            {/* Poster */}
            <Link href={watchUrl} className="block relative aspect-[2/3] overflow-hidden">
              {entry.poster ? (
                <img
                  src={entry.poster}
                  alt={entry.title || `Anime ${entry.anilist_id}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
                  <span className="text-2xl font-black text-white/30">
                    {(entry.title || '?')[0]?.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Play button on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-orange-500/90 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Episode badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                EP {entry.episode}
              </div>

              {/* Completed badge */}
              {isCompleted && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-sm text-[9px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Done
                </div>
              )}
            </Link>

            {/* Info section */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <Link href={watchUrl}>
                <h3 className="text-xs font-semibold text-white truncate mb-1.5 group-hover:text-orange-300 transition-colors">
                  {entry.title || `Anime ${entry.anilist_id}`}
                </h3>
              </Link>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-orange-500 to-red-600'
                    }`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-white shrink-0">
                  {progress}%
                </span>
              </div>

              {/* Time info */}
              <p className="text-[9px] text-white mt-1 font-semibold">
                {isCompleted
                  ? 'Completed'
                  : `${formatTime(entry.current_time_seconds)} / ${formatTime(entry.duration_seconds)}`}
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemove(entry.id, entry.anilist_id, entry.episode);
              }}
              disabled={removing === entry.id}
              className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center   transition-all hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 text-white/60 z-10"
              aria-label="Remove from history"
              style={{ top: isCompleted ? '2.5rem' : '0.5rem' }}
            >
              {removing === entry.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

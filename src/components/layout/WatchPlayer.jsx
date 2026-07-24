'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  ChevronRight,
  ChevronLeft,
  Maximize,
  ScanEye,
  SkipForward,
  SkipBack,
  PlayCircle,
  Scissors,
  Heart,
  Users,
  Flag,
  Search,
  Captions,
  Mic,
  Loader2,
} from 'lucide-react';
import { DEFAULT_SERVER, SERVERS, buildEmbedUrl } from '@/services/servers.config';
import { handlePlayerMessage, getProgressEntry } from '@/services/progressTracker.service';
import { slugify } from '@/lib/slugify';

const EPISODES_PER_PAGE = 100;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function WatchPlayer({ initialAnimeId = null, initialAnime = null, initialEpisode = 1 }) {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const slugParam = Array.isArray(routeParams?.slug) ? routeParams.slug[0] : routeParams?.slug;
  const routeSlug = slugParam || initialAnime?.slug || slugify(initialAnime?.title_english || initialAnime?.title || initialAnimeId || 'watch');
  const selectedAnimeId = initialAnime?.anilist_id ?? initialAnime?.id ?? initialAnimeId ?? null;
  const anilistId = selectedAnimeId;
  const initialTitle = initialAnime?.title_english || initialAnime?.title || 'Now Watching';
  const initialPoster = initialAnime?.poster_image || initialAnime?.poster || initialAnime?.banner || '';

  const [pageTitle, setPageTitle] = useState(initialTitle);
  const [posterUrl, setPosterUrl] = useState(initialPoster);
  const hasCustomEpisodeCount = Number(initialAnime?.episodes) > 1;
  const [totalEpisodes, setTotalEpisodes] = useState(() =>
    clamp(Number(initialAnime?.episodes) || 1, 1, 5000)
  );

  const routeEpisodeParam = Array.isArray(routeParams?.ep) ? routeParams.ep[0] : routeParams?.ep;
  const episodeFromUrl = parseInt(String(routeEpisodeParam || `ep-${initialEpisode || 1}`).replace(/^ep-/, ''), 10) || Number(initialEpisode) || 1;
  const [episode, setEpisode] = useState(() => clamp(episodeFromUrl, 1, totalEpisodes));
  const [language, setLanguage] = useState(() =>
    searchParams.get('lang') === 'dub' ? 'dub' : 'sub'
  );
  const [serverId, setServerId] = useState(() => {
    const requestedServer = searchParams.get('server');
    return SERVERS.some((server) => server.id === requestedServer) ? requestedServer : DEFAULT_SERVER;
  });
  const [autoNext, setAutoNext] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoSkip, setAutoSkip] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);
  const [resumeBanner, setResumeBanner] = useState(null);
  const [pageIndex, setPageIndex] = useState(() => Math.floor((episode - 1) / EPISODES_PER_PAGE));
  const [playerLoading, setPlayerLoading] = useState(true);
  const [resumeTime, setResumeTime] = useState(0);

  const playerWrapRef = useRef(null);

  useEffect(() => {
    if (!anilistId) return;

    if (hasCustomEpisodeCount) return;

    let cancelled = false;

    (async () => {
      try {
        const query = `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              episodes
              title { romaji english native }
              coverImage { large extraLarge }
            }
          }
        `;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ query, variables: { id: Number(anilistId) } }),
        });
        if (!res.ok) return;

        const json = await res.json();
        const media = json?.data?.Media;
        const eps = media?.episodes;
        const cover = media?.coverImage?.large || media?.coverImage?.extraLarge || '';
        const resolvedTitle = (media?.title?.english || media?.title?.romaji || media?.title?.native || '').trim();

        if (!cancelled && Number.isFinite(eps) && eps > 0) {
          setTotalEpisodes(clamp(Number(eps), 1, 5000));
        }
        if (!cancelled && resolvedTitle) {
          setPageTitle((current) => (current === 'Now Watching' ? resolvedTitle : current));
        }
        if (!cancelled && cover) {
          setPosterUrl((current) => current || cover);
        }
      } catch (err) {
        console.warn('[WatchPlayer] Failed to fetch AniList metadata:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [anilistId, hasCustomEpisodeCount]);

  const syncUrl = useCallback((nextEpisode, nextLanguage, nextServer = serverId) => {
    const params = new URLSearchParams();
    if (nextLanguage) params.set('lang', nextLanguage);
    if (nextServer) params.set('server', nextServer);
    const query = params.toString();
    router.replace(`/watch/${routeSlug}/ep-${nextEpisode}${query ? `?${query}` : ''}`, { scroll: false });
  }, [router, routeSlug, serverId]);

  const handleEpisodeSelect = useCallback((num) => {
    const clamped = clamp(num, 1, totalEpisodes);
    setEpisode(clamped);
    setPageIndex(Math.floor((clamped - 1) / EPISODES_PER_PAGE));
    setResumeBanner(null);
    setPlayerLoading(true);
    syncUrl(clamped, language);
  }, [language, syncUrl, totalEpisodes]);

  const handleLanguageSelect = useCallback((lang) => {
    const nextLang = lang === 'dub' ? 'dub' : 'sub';
    setLanguage(nextLang);
    setPlayerLoading(true);
    syncUrl(episode, nextLang);
  }, [episode, syncUrl]);

  const handleServerSelect = useCallback((nextServerId) => {
    const server = SERVERS.find((item) => item.id === nextServerId);
    if (!server) return;

    setServerId(server.id);
    setPlayerLoading(true);
    syncUrl(episode, language, server.id);
  }, [episode, language, syncUrl]);

  useEffect(() => {
    function handleMessage(event) {
      handlePlayerMessage(
        event,
        {
          anilistId,
          episode,
          serverId,
          language,
        },
        {
          onProgress: (entry) => {
            setPlayerLoading(false);
            if (entry.status === 'completed') {
              setResumeTime(0);
            }
          },
          onComplete: () => {
            if (autoNext && episode < totalEpisodes) {
              handleEpisodeSelect(episode + 1);
            }
          },
          onError: (entry) => {
            setPlayerLoading(false);
            console.error('Player error:', entry);
          },
          onPlaying: () => {
            setPlayerLoading(false);
          },
        }
      );
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [anilistId, autoNext, episode, handleEpisodeSelect, language, serverId, totalEpisodes]);

  useEffect(() => {
    if (!anilistId || !episode) return;

    const existing = getProgressEntry(anilistId, episode);
    const resume = existing && existing.status !== 'completed' ? Math.floor(existing.currentTime || 0) : 0;
    const frame = window.requestAnimationFrame(() => {
      setResumeTime(resume);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [anilistId, episode, serverId]);

  function handleExpand() {
    playerWrapRef.current?.requestFullscreen?.();
  }

  if (!anilistId) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-card/50 p-10 text-center text-muted-foreground/60">
        No anime selected.{' '}
        <Link href="/anime" className="text-orange-400 hover:underline">
          Browse anime
        </Link>
      </div>
    );
  }

  const embedUrl = buildEmbedUrl(serverId, anilistId, episode, language);
  const showLoading = playerLoading && Boolean(embedUrl);
  const pageCount = Math.ceil(totalEpisodes / EPISODES_PER_PAGE);
  const pageStart = pageIndex * EPISODES_PER_PAGE + 1;
  const pageEnd = Math.min(pageStart + EPISODES_PER_PAGE - 1, totalEpisodes);
  const pad = (n) => String(n).padStart(3, '0');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground/60">
        <Link href="/" className="flex items-center gap-1.5 transition-colors hover:text-white">
          <Home className="w-4 h-4" /> Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
        <Link href="/anime" className="transition-colors hover:text-white">Anime</Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
        <span className="truncate font-medium text-white/80">{pageTitle}</span>
      </div>

      <div className={`grid grid-cols-1 ${theatreMode ? '' : 'xl:grid-cols-[minmax(0,4fr)_minmax(280px,1fr)]'} w-full items-start gap-4`}>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0a0a] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div ref={playerWrapRef} className="relative aspect-video overflow-hidden bg-black">
            {showLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1a0f0f] via-[#120a0a] to-black">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/20 to-red-500/10">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                </div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground/50">
                  Loading Episode {episode}...
                </p>
              </div>
            )}
            {embedUrl ? (
              <iframe
                key={embedUrl}
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                onLoad={() => setPlayerLoading(false)}
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-muted-foreground/60">
                No streaming source available.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] px-3 py-2.5 md:px-4">
            <ToolbarButton icon={Maximize} label="Expand" onClick={handleExpand} />
            <ToolbarButton icon={ScanEye} label="Focus" active={theatreMode} onClick={() => setTheatreMode((value) => !value)} />
            <ToolbarButton icon={SkipForward} label="AutoNext" active={autoNext} onClick={() => setAutoNext((value) => !value)} />
            <ToolbarButton icon={PlayCircle} label="AutoPlay" active={autoPlay} onClick={() => setAutoPlay((value) => !value)} />
            <ToolbarButton icon={Scissors} label="AutoSkip" active={autoSkip} onClick={() => setAutoSkip((value) => !value)} />
            <span className="mx-1 hidden h-5 w-px bg-white/[0.08] sm:block" />
            <ToolbarButton icon={SkipBack} label="Prev" onClick={() => handleEpisodeSelect(episode - 1)} disabled={episode <= 1} />
            <ToolbarButton icon={SkipForward} label="Next" onClick={() => handleEpisodeSelect(episode + 1)} disabled={episode >= totalEpisodes} />
            <span className="mx-1 hidden h-5 w-px bg-white/[0.08] sm:block" />
            <ToolbarButton icon={Heart} label="Bookmark" active={bookmarked} onClick={() => setBookmarked((value) => !value)} />
            <ToolbarButton icon={Users} label="W2G" />
            <ToolbarButton icon={Flag} label="Report" />
          </div>

          {resumeBanner && (
            <div className="flex items-center justify-between gap-3 border-t border-orange-500/20 bg-gradient-to-r from-orange-500/15 to-red-500/5 px-4 py-2.5">
              <span className="text-xs font-medium text-orange-300">
                Resumed from Episode {resumeBanner}, where you left off.
              </span>
              <button
                onClick={() => setResumeBanner(null)}
                className="shrink-0 text-xs font-semibold text-orange-400/70 transition-colors hover:text-orange-300"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-col justify-between gap-3 border-t border-white/[0.06] bg-white/[0.015] px-4 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">You are watching Episode {episode}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/40">
                If the player is not loading, try refreshing the page.
              </p>
              {resumeTime > 0 && (
                <p className="mt-1 text-xs text-orange-300/80">
                  Resume point saved at {Math.floor(resumeTime)}s.
                </p>
              )}
            </div>

            <div className="grid shrink-0 gap-2">
              <div className="grid grid-cols-3 gap-2">
                {SERVERS.map((server) => (
                  <ServerPill
                    key={server.id}
                    label={server.label}
                    active={serverId === server.id}
                    onClick={() => handleServerSelect(server.id)}
                  />
                ))}
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
                  Lang
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <LangPill
                    icon={Captions}
                    label="Sub"
                    active={language === 'sub'}
                    onClick={() => handleLanguageSelect('sub')}
                  />
                  <LangPill
                    icon={Mic}
                    label="Dub"
                    active={language === 'dub'}
                    onClick={() => handleLanguageSelect('dub')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {!theatreMode && (
          <div className="w-full self-start overflow-hidden rounded-2xl border border-white/[0.08] bg-card/50 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5">
              <h2 className="text-sm font-bold text-white">Episodes</h2>
              <div className="flex items-center gap-1">
                <button aria-label="Search episodes" className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-white/[0.06] hover:text-white">
                  <Search className="w-4 h-4" />
                </button>
                <button aria-label="Toggle subtitles" className="rounded-lg bg-orange-500/10 p-1.5 text-orange-400 transition-colors hover:bg-orange-500/15">
                  <Captions className="w-4 h-4" />
                </button>
                <button aria-label="Toggle dub" className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-white/[0.06] hover:text-white">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {pageCount > 1 && (
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
                <button
                  onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
                  disabled={pageIndex === 0}
                  className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold tracking-wide text-muted-foreground/60">
                  {pad(pageStart)}-{pad(pageEnd)}
                </span>
                <button
                  onClick={() => setPageIndex((value) => Math.min(pageCount - 1, value + 1))}
                  disabled={pageIndex >= pageCount - 1}
                  className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid max-h-[420px] grid-cols-6 gap-2 overflow-y-auto p-3">
              {Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index).map((num) => (
                <button
                  key={num}
                  onClick={() => handleEpisodeSelect(num)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    num === episode
                      ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[0_2px_12px_rgba(249,115,22,0.4)]'
                      : 'border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:border-orange-500/40 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, active, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:pointer-events-none disabled:opacity-30 ${
        active
          ? 'border-orange-500/30 bg-orange-500/15 text-orange-300'
          : 'border-transparent text-muted-foreground/70 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function LangPill({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
        active
          ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
          : 'border-white/[0.1] bg-white/[0.04] text-muted-foreground hover:text-white'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function ServerPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
        active
          ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
          : 'border-white/[0.1] bg-white/[0.04] text-muted-foreground hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  Sparkles,
  Flame,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

const gradientBrand =
  "linear-gradient(135deg, oklch(0.75 0.2 65) 0%, oklch(0.62 0.24 35) 100%)";

const gradientText = {
  backgroundImage: gradientBrand,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const NAV_LINKS = [
  { href: "/anime", label: "Anime" },
  { href: "/top-rated", label: "Top Rated" },
  { href: "/about", label: "About" },
];

const GENRES = ["Action", "Romance", "Shonen", "Slice of Life", "Mecha"];

// Staggered fade-up delays for hero elements on load.
const STAGGER = [
  "delay-[0ms]",
  "delay-[80ms]",
  "delay-[160ms]",
  "delay-[240ms]",
  "delay-[320ms]",
  "delay-[400ms]",
];

function FadeUp({ index, className = "", children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${STAGGER[index]} ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Page() {
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = q.trim();
    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Keyframes for ambient background drift + reduced-motion guard */}
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(1.5%, -1.5%, 0) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .drift-bg { animation: none !important; }
        }
      `}</style>

      {/* Background overlay */}
      <div
        aria-hidden
        className="drift-bg absolute inset-0 bg-cover bg-center opacity-25 [animation:drift_22s_ease-in-out_infinite]"
        style={{ backgroundImage: "url(/anime-bg.webp)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, hsl(24 95% 53% / 0.25), transparent 60%), linear-gradient(180deg, hsl(224 20% 5% / 0.4) 0%, hsl(224 20% 5% / 0.92) 55%, hsl(224 20% 5%) 100%)",
        }}
      />
      {/* Grain / scanline accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.4) 2px 3px)",
        }}
      />

      {/* Nav — fixed, glassmorphic, 72px */}
      <header className="fixed inset-x-0 top-0 z-30 h-[72px] border-b border-border/60 bg-background/70 backdrop-blur-xl sm:border-none sm:bg-transparent sm:backdrop-blur-none">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 md:px-12">
          {/* Logo — left */}
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_12px_rgba(249,115,22,0.5)]">
              <span className="text-xs font-black leading-none text-white">AX</span>
            </div>
            <span className="font-display text-xl font-black">
              Ani<span style={gradientText}>Arix</span>
            </span>
          </Link>

          {/* Links — centered, desktop only */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-1 transition hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-orange-500 after:to-red-600 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer to keep nav items centered properly since the right auth button is removed */}
          <div className="hidden shrink-0 md:flex md:w-[72px]"></div>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-foreground md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`overflow-hidden border-b border-border/60 bg-background/70 backdrop-blur-xl transition-all duration-300 md:hidden ${
            menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-orange-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero — offset by fixed nav height */}
      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pt-[72px] text-center sm:px-6 md:justify-start md:pt-[calc(72px+6vh)]">
        <FadeUp index={0} className="mb-4 sm:mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground shadow-[0_0_20px_rgba(249,115,22,0.15)] backdrop-blur sm:px-4 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>Over 12,000 titles ready to stream</span>
          </div>
        </FadeUp>

        <FadeUp index={1}>
          <h1 className="font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
            Enter the <span style={gradientText}>Otakuverse</span>
          </h1>
        </FadeUp>

        <FadeUp index={2} className="mt-3 sm:mt-4">
          <p className="max-w-lg px-2 text-sm text-muted-foreground sm:text-base">
            Search any anime, jump straight into the episode. No fluff, no pop-ups — just the story.
          </p>
        </FadeUp>

        {/* Search */}
        <FadeUp index={3} className="mt-6 w-full max-w-xl sm:mt-8">
          <form onSubmit={handleSearchSubmit} className="group relative w-full">
            <div className="relative flex items-center gap-2 rounded-2xl border border-border bg-card/90 p-2 pl-4 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 focus-within:-translate-y-0.5 focus-within:border-primary focus-within:shadow-[0_0_25px_rgba(249,115,22,0.35)] sm:pl-5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search anime, character, studio…"
                type="search"
                className="w-full min-w-0 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-base"
              />
              <button
                type="submit"
                className="hidden shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition hover:brightness-110 sm:inline-flex"
                style={{ background: gradientBrand }}
              >
                <Flame className="h-4 w-4" />
                Search
              </button>
              <button
                type="submit"
                aria-label="Search"
                className="inline-flex shrink-0 items-center justify-center rounded-xl p-2.5 text-white shadow-lg transition hover:brightness-110 sm:hidden"
                style={{ background: gradientBrand }}
              >
                <Flame className="h-4 w-4" />
              </button>
            </div>
          </form>
        </FadeUp>

        {/* Primary CTA */}
        <FadeUp index={4} className="mt-8 w-full sm:mt-10 sm:w-auto">
          <Link
            href="/home"
            className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_35px_rgba(255,100,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(255,100,0,0.5)] active:scale-95 sm:w-auto sm:gap-3 sm:px-10 sm:py-4 sm:text-lg"
            style={{ background: gradientBrand }}
          >
            <LayoutGrid className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 sm:h-6 sm:w-6" />
            <span>Browse Full Library</span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1 sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 text-white sm:h-5 sm:w-5" />
            </span>
          </Link>
        </FadeUp>

        {/* Genre chips */}
        <FadeUp index={5} className="mt-8 w-full">
          <div className="flex snap-x gap-2 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {GENRES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setQ(t)}
                className="shrink-0 snap-start rounded-full border border-border/80 bg-card/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm transition hover:border-primary hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* Bottom marquee stripe */}
      <div className="relative z-10 mt-8 hidden border-t border-border/60 bg-background/60 backdrop-blur sm:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:px-6 sm:py-4 sm:text-xs sm:tracking-[0.3em]">
          <span className="shrink-0">◤ Now Airing</span>
          <span className="hidden truncate md:inline">
            Frieren · Solo Leveling · Jujutsu Kaisen · Dandadan · One Piece
          </span>
          <span className="shrink-0">SUB · DUB</span>
        </div>
      </div>
    </main>
  );
}
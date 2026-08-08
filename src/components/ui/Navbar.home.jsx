'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, X, Home, Compass, TrendingUp, ChevronRight, LogIn, Inbox } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthProvider';
import AuthModal from '../auth/AuthModal';
import ProfileDropdown from './ProfileDropdown';

const navLinks = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'All Anime', href: '/anime', icon: Compass },
  { label: 'Trending', href: '/trending', icon: TrendingUp },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const mobileSearchRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const resolvedPathname = pathname ?? '/';

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const openAuthModal = (mode = 'signin') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setSidebarOpen(false);
    setSearchOpen(false);
  };

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsHydrated(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  // Submit search -> navigate to /search?q=...
  const submitSearch = () => {
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSidebarOpen(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSearch();
    }
  };

  // Focus mobile search input when it opens
  useEffect(() => {
    if (searchOpen && mobileSearchRef.current) {
      setTimeout(() => mobileSearchRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await signOut();
    setSidebarOpen(false);
    router.push('/home');
    router.refresh();
  };

  return (
    <>
      {/* ── Main Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/70 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-3 sm:gap-4">

          {/* Left: hamburger — always visible, opens the sidebar nav */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-muted-foreground hover:text-white transition-all"
            aria-label="Open menu"
            data-testid="button-open-menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.5)]">
              <span className="text-white font-black text-xs leading-none">AX</span>
            </div>
            <span className="font-display text-[22px] sm:text-[24px] font-black bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent tracking-wide">
              AniArix
            </span>
          </Link>

          {/* Center (desktop): large search bar */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <div className="relative w-full max-w-xl group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input
                ref={desktopSearchRef}
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search anime, genres..."
                className="w-full h-11 bg-white/5 border border-white/8 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:bg-white/8 focus:border-orange-500/50 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12),inset_0_0_20px_rgba(249,115,22,0.04)] transition-all"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: mobile search toggle (mobile only) */}
          <button
            onClick={() => setSearchOpen(prev => !prev)}
            className="md:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-muted-foreground hover:text-white transition-all ml-auto"
            aria-label="Toggle search"
            data-testid="button-toggle-search"
          >
            {searchOpen ? <X className="w-5 h-5 text-orange-400" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Right: inbox */}
          <Link
            href="/notifications"
            aria-label="Notifications"
            data-testid="button-inbox"
            className="hidden sm:flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-muted-foreground hover:text-white transition-all"
          >
            <Inbox className="w-[18px] h-[18px]" />
          </Link>

          {/* Right: profile / sign in */}
          <div className="flex items-center shrink-0">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            ) : user ? (
              <ProfileDropdown user={user} profile={profile} onLogout={handleLogout} />
            ) : (
              <>
                {/* Desktop: labeled button */}
                <button
                  onClick={() => openAuthModal('signin')}
                  data-testid="button-signin"
                  className="hidden md:flex cursor-pointer relative items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-200 group"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </span>
                </button>
                {/* Mobile: icon only */}
                <button
                  onClick={() => openAuthModal('signin')}
                  data-testid="button-signin-mobile"
                  aria-label="Sign in"
                  className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-xl text-white overflow-hidden transition-all duration-200"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_12px_rgba(249,115,22,0.4)]" />
                  <LogIn className="relative z-10 w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-3 border-t border-white/5 bg-background/95">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search anime, genres..."
                className="w-full h-11 bg-white/6 border border-orange-500/30 rounded-xl pl-10 pr-10 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Sidebar Overlay (all breakpoints) ───────────────── */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          onClick={() => setSidebarOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className={`absolute top-0 left-0 h-full w-72 bg-[#0d0d0f] border-r border-white/8 shadow-[8px_0_40px_rgba(0,0,0,0.6)] flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 shrink-0">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                <span className="text-white font-black text-xs">AX</span>
              </div>
              <span className="font-display text-[24px] font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                AniArix
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/8 transition-all shrink-0"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar nav links */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
              Navigation
            </p>
            {navLinks.map(({ label, href, icon: Icon }) => {
              const isActive = label === 'Home' ? (isHydrated && resolvedPathname === '/') : false;
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => { setSidebarOpen(false); setSearchOpen(false); }}
                  className={`flex items-center justify-between gap-3 px-3 py-3 rounded-xl mb-1 transition-all group ${isActive
                    ? 'bg-gradient-to-r from-orange-500/15 to-red-500/5 border border-orange-500/20 text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    }`}
                  data-testid={`link-sidebar-${label.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-orange-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : ''}`} />
                    </div>
                    <span className="font-semibold text-sm">{label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-60 text-orange-400' : ''}`} />
                </Link>
              );
            })}
            <Link
              href="/notifications"
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-muted-foreground hover:text-white hover:bg-white/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-white/10">
                <Inbox className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">Notifications</span>
            </Link>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
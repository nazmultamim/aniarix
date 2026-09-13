"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, Calendar, Clock3 } from "lucide-react";
import { cacheSelectedAnimeAction, getHeroAnimeSlidesAction } from "@/lib/action/Getanimeaction";
import { getAnimeDisplayTitle, getAnimeExternalIds, getStableAnimeIdentity } from "@/lib/anime-display";
import { slugify } from "@/lib/slugify";

const AUTOPLAY_MS = 6000;

export function Hhomeimgeslider({ initialSlides = [] }) {
    const [slides, setSlides] = useState(() => (Array.isArray(initialSlides) ? initialSlides : []));
    const [loading, setLoading] = useState(!(Array.isArray(initialSlides) && initialSlides.length > 0));
    const [error, setError] = useState("");
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused, setPaused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const sectionRef = useRef(null);
    const total = slides.length;

    useEffect(() => {
        if (Array.isArray(initialSlides) && initialSlides.length > 0) {
            setSlides(initialSlides);
            setLoading(false);
            return;
        }

        let alive = true;

        async function loadSlides() {
            setLoading(true);
            setError("");

            const result = await getHeroAnimeSlidesAction();
            if (!alive) return;

            if (result?.error) {
                setSlides([]);
                setError(result.error);
            } else {
                setSlides(result?.items ?? []);
            }

            setLoading(false);
        }

        loadSlides();

        return () => {
            alive = false;
        };
    }, [initialSlides]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const syncViewport = () => setIsMobile(mediaQuery.matches);

        syncViewport();
        mediaQuery.addEventListener("change", syncViewport);

        return () => mediaQuery.removeEventListener("change", syncViewport);
    }, []);

    const go = useCallback(
        (next, dir) => {
            if (!total) return;
            setDirection(dir);
            setCurrent((next + total) % total);
        },
        [total]
    );

    const prev = () => go(current - 1, -1);
    const next = useCallback(() => go(current + 1, 1), [current, go]);

    useEffect(() => {
        if (paused) return;
        const t = setInterval(next, AUTOPLAY_MS);
        return () => clearInterval(t);
    }, [next, paused]);

    // Keyboard navigation when the hero has focus
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const onKeyDown = (e) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };
        el.addEventListener("keydown", onKeyDown);
        return () => el.removeEventListener("keydown", onKeyDown);
    }, [next]);

    const slide = slides[current] || null;
    const { anilistId, malId } = getAnimeExternalIds(slide);
    const slideTitle = getAnimeDisplayTitle(slide, "Anime");
    const slug = slide?.slug || slugify(slideTitle);
    const getImageUrl = (...sources) => sources.find((source) => typeof source === "string" && source.trim()) || null;
    const bannerImage = getImageUrl(slide?.banner_image, slide?.banner, slide?.cover, slide?.poster_image, slide?.poster);
    const posterImage = getImageUrl(slide?.poster_image, slide?.poster, slide?.cover, bannerImage);
    const heroImage = isMobile ? posterImage : bannerImage;
    const watchRoute = anilistId ? slug : malId ? `mal-${malId}` : null;
    const watchHref = watchRoute
        ? `/watch/${watchRoute}/ep-1`
        : "/anime";
    const slideKey = getStableAnimeIdentity(slide);

    if (loading) {
        return (
            <section
                className="relative w-full overflow-hidden bg-background outline-none"
                style={{ height: "70vh", minHeight: "480px", maxHeight: "800px" }}
                aria-label="Loading featured anime"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
                <div className="relative z-10 h-full flex items-center">
                    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 2xl:px-10 pt-16 sm:pt-20">
                        <div className="max-w-xl lg:max-w-2xl space-y-4 animate-pulse">
                            <div className="h-16 sm:h-24 w-full rounded bg-white/10" />
                            <div className="h-4 w-2/3 rounded bg-white/10" />
                            <div className="h-4 w-4/5 rounded bg-white/10" />
                            <div className="flex gap-3">
                                <div className="h-12 w-32 rounded bg-white/10" />
                                <div className="h-12 w-12 rounded bg-white/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!slide) {
        return (
            <section
                className="relative w-full overflow-hidden bg-background outline-none"
                style={{ height: "70vh", minHeight: "480px", maxHeight: "800px" }}
                aria-label="Featured anime unavailable"
            >
                <div className="relative z-10 h-full flex items-center">
                    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 2xl:px-10 pt-16 sm:pt-20">
                        <div className="max-w-xl lg:max-w-2xl">
                            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-foreground">
                                No featured anime found
                            </h1>
                            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                                {error || "We couldn't load trending or recent anime right now."}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const imgVariants = {
        enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 1.08 }),
        center: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.9, ease: [0.25, 1, 0.5, 1] },
        },
        exit: (dir) => ({
            opacity: 0,
            x: dir > 0 ? -60 : 60,
            scale: 0.97,
            transition: { duration: 0.5, ease: "easeIn" },
        }),
    };

    const contentVariants = {
        enter: { opacity: 0, y: 24 },
        center: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.15, ease: [0.25, 1, 0.5, 1] },
        },
        exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" } },
    };

    // Normalize + dedupe: several feeds put the same status word ("Releasing")
    // into more than one field (status, release, airing). Only ever show a
    // given piece of text once across the whole meta row.
    const seenMetaValues = new Set();
    const claimMetaValue = (value) => {
        if (!value) return false;
        const key = String(value).trim().toLowerCase();
        if (!key || seenMetaValues.has(key)) return false;
        seenMetaValues.add(key);
        return true;
    };

    const status = slide.status || "";
    const isReleasing = status.toLowerCase() === "releasing";
    const formatLabel = slide.format || slide.type || "";
    const genresLabel = Array.isArray(slide.genre)
        ? slide.genre.join(", ")
        : Array.isArray(slide.genres)
            ? slide.genres.join(", ")
            : "";
    const rawAiringLabel = slide.airing || slide.airingStatus;
    const description = slide.description || slide.synopsis || "";

    // Claim status first so any field that just repeats "Releasing" etc. is dropped.
    claimMetaValue(status);
    const releaseLabel = claimMetaValue(slide.release) ? slide.release : null;
    const airingLabel = claimMetaValue(rawAiringLabel) ? rawAiringLabel : null;

    return (
        <section
            ref={sectionRef}
            tabIndex={0}
            aria-roledescription="carousel"
            aria-label={`Featured: ${slideTitle}`}
            className="relative w-full overflow-hidden bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ height: "60vh", minHeight: "480px", maxHeight: "800px" }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            data-testid="hero-slider"
        >
            {/* ── Background image ── */}
            <AnimatePresence custom={direction} initial={false}>
                <motion.div
                    key={`bg-${slideKey}`}
                    className="absolute inset-0 z-0"
                    custom={direction}
                    variants={imgVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                >
                    {heroImage && (
                        <motion.img
                            src={heroImage}
                            alt={slideTitle}
                            className="absolute inset-0 w-full h-full object-cover motion-reduce:animate-none"
                            style={{ objectPosition: slide.focalPoint || "center 25%" }}
                            initial={{ scale: 1 }}
                            animate={{ scale: paused ? 1 : 1.06 }}
                            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                        />
                    )}
                    {/* Left dark fade */}
                    <div className="absolute inset-0 bg-gradient-to-r from-background sm:from-background via-background/75 sm:via-background/65 to-background/35 sm:to-transparent" />
                    {/* Bottom fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
                    {/* Vignette top */}
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent"
                        style={{ height: "32%" }}
                    />
                    {/* Fine grain edge to kill flatness on large screens */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-border/40 pointer-events-none" />
                </motion.div>
            </AnimatePresence>

            {/* ── Slide content ── */}
            <div className="relative z-10 h-full flex items-center">
                <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 2xl:px-10 pt-16 sm:pt-20">
                    <div className="max-w-xl lg:max-w-2xl">
                        <AnimatePresence custom={direction} mode="wait">
                            <motion.div
                                key={`content-${slideKey}`}
                                custom={direction}
                                variants={contentVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="flex flex-col gap-3 sm:gap-4"
                            >
                                {/* Title */}
                                <h1
                                    className="font-display text-3xl sm:text-5xl lg:text-6xl  font-extrabold text-foreground leading-[0.92] tracking-tight uppercase [text-shadow:0_2px_24px_hsl(var(--background)/0.6)]"
                                >
                                    {slideTitle}
                                </h1>

                                {/* Status / meta row */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-semibold">
                                    {formatLabel && (
                                        <span className="px-2 py-0.5 rounded-sm border border-primary/50 text-primary font-semibold bg-primary/10">
                                            <span className="text-foreground/90">{formatLabel}</span>
                                        </span>
                                    )}
                                    {genresLabel && (
                                        <span className="flex items-center gap-1.5 text-foreground/50">
                                            <span className="text-foreground/90 line-clamp-1">{genresLabel}</span>
                                        </span>
                                    )}
                                    {status && (
                                        <span className={isReleasing ? "text-emerald-400 uppercase tracking-wide" : "text-foreground/70 uppercase tracking-wide"}>
                                            {status}
                                        </span>
                                    )}
                                    {releaseLabel && (
                                        <span className="flex items-center gap-1.5 text-foreground/70">
                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                            {releaseLabel}
                                        </span>
                                    )}
                                    {airingLabel && (
                                        <span className="flex items-center gap-1.5 text-foreground/70">
                                            <Clock3 className="w-3.5 h-3.5 text-muted-foreground" />
                                            {airingLabel}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {description && (
                                    <p className="text-sm sm:text-base text-foreground/40 line-clamp-1 sm:line-clamp-2 max-w-xl">
                                        {description}
                                    </p>
                                )}

                                {/* CTAs */}
                                <div className="flex items-center gap-3 mt-1">
                                    <Link
                                        data-testid="hero-watch-btn"
                                        href={watchHref}
                                        onClick={() => {
                                            void cacheSelectedAnimeAction(slide);
                                        }}
                                        className="group relative flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold tracking-widest text-xs sm:text-sm rounded-sm overflow-hidden shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] hover:scale-[1.03] active:scale-100 transition-transform duration-200"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                        <Play className="w-4 h-4 fill-current relative z-10 shrink-0" />
                                        <span className="relative z-10 uppercase">Watch Now</span>
                                    </Link>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Slider navigation — bottom right ── */}
            <div className="absolute bottom-5 sm:bottom-8 right-4 sm:right-8 z-20 flex items-center gap-3 sm:gap-4">
                <button
                    data-testid="hero-prev-btn"
                    onClick={prev}
                    aria-label="Previous slide"
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-card/40 border border-card-border text-foreground/70 hover:bg-card hover:text-foreground transition-all duration-200 backdrop-blur-sm"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                    data-testid="hero-next-btn"
                    onClick={next}
                    aria-label="Next slide"
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-card/40 border border-card-border text-foreground/70 hover:bg-card hover:text-foreground transition-all duration-200 backdrop-blur-sm"
                >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>

            {/* ── Progress track with autoplay fill ── */}
            <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        data-testid={`hero-dot-${i}`}
                        onClick={() => go(i, i > current ? 1 : -1)}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === current}
                        className="relative h-[3px] rounded-full overflow-hidden bg-foreground/15 transition-[width] duration-300"
                        style={{ width: i === current ? "40px" : "14px" }}
                    >
                        {i === current && (
                            <motion.span
                                key={`fill-${slide.id}-${paused}`}
                                className="absolute inset-y-0 left-0 bg-primary motion-reduce:w-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{
                                    duration: AUTOPLAY_MS / 1000,
                                    ease: "linear",
                                    ...(paused ? { duration: 0 } : {}),
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </section>
    );
}

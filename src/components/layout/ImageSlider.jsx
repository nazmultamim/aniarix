"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cacheSelectedAnimeAction, getHeroAnimeSlidesAction } from "@/lib/action/Getanimeaction";
import { slugify } from "@/lib/slugify";

const AUTOPLAY_MS = 6000;

export function Hhomeimgeslider() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused, setPaused] = useState(false);
    const sectionRef = useRef(null);
    const total = slides.length;

    useEffect(() => {
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
    const anilistId = slide?.anilist_id ?? slide?.id ?? null;
    const slideTitle = slide?.title || slide?.title_english || "Anime";
    const slug = slide?.slug || slugify(slideTitle);
    const watchHref = anilistId
        ? `/watch/${slug}/ep-1`
        : "/anime";

    if (loading) {
        return (
            <section
                className="relative w-full overflow-hidden bg-background outline-none"
                style={{ height: "70vh", minHeight: "480px", maxHeight: "800px" }}
                aria-label="Loading featured anime"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
                <div className="relative z-10 h-full flex items-center">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
                        <div className="max-w-xl lg:max-w-2xl space-y-4 animate-pulse">
                            <div className="h-4 w-40 rounded bg-white/10" />
                            <div className="h-16 sm:h-24 w-full rounded bg-white/10" />
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
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
                        <div className="max-w-xl lg:max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/45">
                                Featured anime
                            </p>
                            <h1 className="mt-3 font-display text-3xl sm:text-5xl font-extrabold text-foreground">
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

    return (
        <section
            ref={sectionRef}
            tabIndex={0}
            aria-roledescription="carousel"
            aria-label={`Featured: ${slide.title}`}
            className="relative w-full overflow-hidden bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ height: "70vh", minHeight: "480px", maxHeight: "800px" }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            data-testid="hero-slider"
        >
            {/* ── Background image ── */}
            <AnimatePresence custom={direction} initial={false}>
                <motion.div
                    key={`bg-${slide.id}`}
                    className="absolute inset-0 z-0"
                    custom={direction}
                    variants={imgVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                >
                    <motion.img
                        src={slide.cover}
                        alt={slide.title}
                        className="absolute inset-0 w-full h-full object-cover motion-reduce:animate-none"
                        style={{ objectPosition: slide.focalPoint || "center 25%" }}
                        initial={{ scale: 1 }}
                        animate={{ scale: paused ? 1 : 1.06 }}
                        transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                    />
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
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
                    <div className="max-w-xl lg:max-w-2xl">
                        <AnimatePresence custom={direction} mode="wait">
                            <motion.div
                                key={`content-${slide.id}`}
                                custom={direction}
                                variants={contentVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="flex flex-col gap-3 sm:gap-4"
                            >
                                {/* Eyebrow */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                        <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold tracking-widest bg-primary text-primary-foreground rounded-sm uppercase shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]">
                                            {slide.subtitle || "Featured"}
                                        </span>
                                        <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-foreground/55 uppercase truncate">
                                            {slide.status || slide.release || slide.type}
                                        </span>
                                    </div>

                                {/* Title */}
                                <h1
                                    className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-[0.92] tracking-tight uppercase [text-shadow:0_2px_24px_hsl(var(--background)/0.6)]"
                                >
                                    {slide.title}
                                </h1>

                                {/* Badges row */}
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                    <span className="px-2 py-0.5 rounded-sm border border-primary/50 text-primary font-semibold bg-primary/10">
                                        {slide.format || slide.type || "Anime"}
                                    </span>
                                    <span className="text-foreground/30 hidden sm:inline">•</span>
                                    <span className="text-foreground/55 hidden sm:inline">
                                        {slide.genre.join(", ")}
                                    </span>
                                    <span className="text-foreground/55 sm:hidden">{slide.genre.join(", ")}</span>
                                </div>


                                {/* Stats row */}
                                <div className="flex items-stretch gap-2 sm:gap-3 mt-1">
                                    {[
                                        { label: "Rating", value: slide.rating },
                                        { label: "Release", value: slide.release },
                                        { label: "Quality", value: slide.quality },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="flex flex-col gap-0.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-card/60 border border-card-border backdrop-blur-md min-w-[64px] sm:min-w-[80px] shadow-sm"
                                        >
                                            <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                                {stat.label}
                                            </span>
                                            <span className="font-display text-sm sm:text-lg font-bold text-foreground leading-none">
                                                {stat.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

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

                <div className="font-display flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                    <span className="text-foreground">{String(current + 1).padStart(2, "0")}</span>
                    <span className="text-foreground/25">/</span>
                    <span className="text-foreground/45">{String(total).padStart(2, "0")}</span>
                </div>

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

            {/* ── Star rating corner badge ── */}
            <div className="absolute top-20 sm:top-24 right-4 sm:right-8 z-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`star-${slide.id}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: 0.4, duration: 0.4 } }}
                        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-card/70 border border-card-border backdrop-blur-md shadow-sm"
                    >
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-display text-xs font-bold text-foreground">
                            {slide.rating}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}

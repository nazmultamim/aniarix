import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnimeCard from '@/components/layout/AnimeCard';
import { getTrendingAnimeAction } from '@/lib/action/Getanimeaction';

export default async function TrendingAnimeSection({ limit = 12 } = {}) {
  let anime = [];
  let error = '';

  try {
    const result = await getTrendingAnimeAction({ limit });
    anime = result.items ?? [];
    error = result.error ?? '';
  } catch (err) {
    console.error('[TrendingAnimeSection] failed to load anime:', err);
    error = 'Failed to load trending anime right now.';
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 mt-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-display font-bold text-white md:text-3xl">
            <span className="inline-block h-8 w-2 rounded-full bg-gradient-to-b from-orange-500 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            Trending Anime
          </h2>
        </div>

        <Link
          href="/trending"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {anime.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {anime.map((item, index) => (
            <AnimeCard
              key={item?.id ?? item?.anilist_id ?? item?.slug ?? item?.title ?? `trending-anime-${index}`}
              anime={item}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/50 p-6 text-sm text-muted-foreground">
          {error || 'No trending anime found right now.'}
        </div>
      )}
    </section>
  );
}

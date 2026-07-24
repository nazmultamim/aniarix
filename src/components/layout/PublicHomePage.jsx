import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnimeCard from '@/components/layout/AnimeCard';
import { getAnimeListAction } from '@/lib/action/Getanimeaction';

export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  let anime = [];

  try {
    const result = await getAnimeListAction({ page: 1, pageSize: 12 });
    anime = result.items ?? [];
  } catch (err) {
    console.error('[PublicHomePage] failed to load anime:', err);
  }

  return (
    <main className="min-h-[100dvh]  text-foreground">
      <section className="mx-auto max-w-7xl px-4 pb-16 mt-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-display font-bold text-white md:text-3xl">
              <span className="inline-block h-8 w-2 rounded-full bg-gradient-to-b from-orange-500 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              Recently Aired
            </h2>
          </div>

          <Link
            href="/anime"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {anime.map((item, index) => (
            <AnimeCard
              key={item?.id ?? item?.anilist_id ?? item?.slug ?? item?.title ?? `anime-${index}`}
              anime={item}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

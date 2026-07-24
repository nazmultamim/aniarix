import { redirect } from 'next/navigation';

export default async function WatchAnimeRedirectPage({ params }) {
  const resolvedParams = await params;
  const anilistId = resolvedParams?.anilist_id ?? resolvedParams?.anilistId ?? null;

  if (!anilistId) {
    redirect('/watch');
  }

  redirect(`/watch?${new URLSearchParams({ anilist_id: String(anilistId) }).toString()}`);
}

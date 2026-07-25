import TrendingAnimeBrowseClient from '@/components/layout/TrendingAnimeBrowseClient';
import { getTrendingAnimeAction } from '@/lib/action/Getanimeaction';

const PAGE_SIZE = 24;
export const dynamic = 'force-dynamic';

export default async function TrendingPage() {
  const result = await getTrendingAnimeAction({ page: 1, limit: PAGE_SIZE });

  return (
    <TrendingAnimeBrowseClient
      initialItems={result.items ?? []}
      initialTotalPages={result.pagination?.totalPages ?? 1}
      initialError={result.error ?? null}
      pageSize={PAGE_SIZE}
    />
  );
}

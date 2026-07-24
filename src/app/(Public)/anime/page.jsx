import AnimeBrowseClient from '@/components/layout/AnimeBrowseClient';
import { getAnimeListAction } from '@/lib/action/Getanimeaction';

const PAGE_SIZE = 24;
export const dynamic = 'force-dynamic';

export default async function AnimePage() {
  const result = await getAnimeListAction({ page: 1, pageSize: PAGE_SIZE });

  return (
    <AnimeBrowseClient
      initialItems={result.items ?? []}
      initialTotalPages={result.pagination?.totalPages ?? 1}
      initialError={result.error ?? null}
      pageSize={PAGE_SIZE}
    />
  );
}

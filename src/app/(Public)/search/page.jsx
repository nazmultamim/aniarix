import { Suspense } from 'react';
import SearchPageClient from '@/components/ui/Searchpageclient';

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  );
}
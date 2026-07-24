'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshAnimeButton({ label = 'Try again' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? 'Retrying...' : label}
    </button>
  );
}

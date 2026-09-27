"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import { getWatchHistory } from "@/lib/supabase/admin-queries";

const PAGE_SIZE = 10;

function formatDuration(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AdminActivityPage() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function load(p = page) {
    setLoading(true);
    try {
      const { data, count } = await getWatchHistory(supabase, { page: p, pageSize: PAGE_SIZE });
      setRows(data);
      setCount(count);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const columns = [
    {
      key: "title",
      header: "Title / Episode",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-11 rounded bg-secondary overflow-hidden shrink-0">
            {row.poster && (
              <img src={row.poster} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[200px]">{row.title || "Untitled"}</p>
            <p className="text-xs text-muted-foreground">
              Ep {row.episode} · {row.language} · {row.server || "unknown server"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "user_id",
      header: "User ID",
      render: (row) => (
        <code className="text-xs text-muted-foreground">
          {row.user_id?.slice(0, 8)}…
        </code>
      ),
    },
    {
      key: "position",
      header: "Position",
      render: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDuration(row.current_time_seconds)} / {formatDuration(row.duration_seconds)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status} />,
    },
    {
      key: "last_watched_at",
      header: "Last watched",
      render: (row) =>
        row.last_watched_at ? new Date(row.last_watched_at).toLocaleString() : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-secondary/30 p-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          This is a read-only view — <span className="text-foreground">watch_history</span> is
          owner-locked by RLS, so this admin session can only see its own rows here unless an
          admin-scoped SELECT policy is added, or the request is proxied through a server route
          using the service role key.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>
          Page {page + 1} of {totalPages} · {count} records
        </span>
        <button
          disabled={page === 0}
          onClick={() => {
            const p = page - 1;
            setPage(p);
            load(p);
          }}
          className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={page + 1 >= totalPages}
          onClick={() => {
            const p = page + 1;
            setPage(p);
            load(p);
          }}
          className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyTitle="No watch activity"
        emptyDescription="Records will appear here as users watch episodes."
      />
    </div>
  );
}
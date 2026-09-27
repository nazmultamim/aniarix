"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import { getAnimeCatalog } from "@/lib/supabase/admin-queries";

const PAGE_SIZE = 10;

export default function AdminCatalogPage() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function load(p = page, s = search) {
    setLoading(true);
    try {
      const { data, count } = await getAnimeCatalog(supabase, {
        page: p,
        pageSize: PAGE_SIZE,
        search: s,
      });
      setRows(data);
      setCount(count);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const columns = [
    {
      key: "title_english",
      header: "Title",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-11 rounded bg-secondary overflow-hidden shrink-0">
            {row.poster && (
              <img src={row.poster} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[240px]">
              {row.title_english || row.title_romaji || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.format || "—"} · {row.episodes ?? "?"} eps
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "RELEASING" ? "releasing" : "finished"}>
          {row.status || "Unknown"}
        </Badge>
      ),
    },
    {
      key: "season",
      header: "Season",
      render: (row) =>
        row.season ? `${row.season} ${row.season_year ?? ""}` : "—",
    },
    {
      key: "genres",
      header: "Genres",
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {(row.genres || []).slice(0, 3).map((g) => (
            <span
              key={g}
              className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {g}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "last_synced_at",
      header: "Synced",
      render: (row) =>
        row.last_synced_at ? new Date(row.last_synced_at).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-destructive-border/20 bg-destructive/5 p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">
            This table has no Row Level Security policies —
          </span>{" "}
          it's currently writable by any client with the anon key, not just this admin panel.
          Enable RLS with a public-read policy before exposing write actions here.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(0, search)}
            placeholder="Search titles…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-secondary border border-border
            text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages} · {count} titles
          </span>
          <button
            disabled={page === 0}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              load(p, search);
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
              load(p, search);
            }}
            className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyTitle="No titles found"
        emptyDescription="Try a different search term, or sync new titles from AniList."
      />
    </div>
  );
}
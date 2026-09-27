"use client";

import { useEffect, useState } from "react";
import { Users, Library, Activity, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import StatCard from "@/components/admin/StatCard";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import { getDashboardStats, getRecentActivity } from "@/lib/supabase/admin-queries";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          getDashboardStats(supabase),
          getRecentActivity(supabase, 8),
        ]);
        setStats(statsData);
        setActivity(activityData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-11 rounded bg-secondary overflow-hidden shrink-0">
            {row.poster && (
              <img src={row.poster} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[220px]">{row.title || "Untitled"}</p>
            <p className="text-xs text-muted-foreground">Episode {row.episode}</p>
          </div>
        </div>
      ),
    },
    {
      key: "progress_percent",
      header: "Progress",
      render: (row) => (
        <div className="w-28">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, row.progress_percent || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {Math.round(row.progress_percent || 0)}%
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status}>{null}</Badge>,
    },
    {
      key: "last_watched_at",
      header: "Last watched",
      render: (row) =>
        row.last_watched_at ? new Date(row.last_watched_at).toLocaleString() : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={loading ? "—" : stats?.userCount ?? 0}
          icon={Users}
        />
        <StatCard
          label="Catalog Titles"
          value={loading ? "—" : stats?.catalogCount ?? 0}
          icon={Library}
        />
        <StatCard
          label="Watch Records"
          value={loading ? "—" : stats?.watchCount ?? 0}
          icon={Activity}
        />
        <StatCard label="Open Security Findings" value="5" icon={ShieldAlert} />
      </div>

      <div className="rounded-lg border border-destructive-border/20 bg-destructive/5 p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">
            anime_catalog has Row Level Security disabled
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            It's currently readable and writable by anyone with the anon key. Review it on the{" "}
            <a href="/admin/security" className="text-primary hover:underline">
              Security tab
            </a>
            .
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground">Recent Activity</h2>
        </div>
        <DataTable
          columns={columns}
          data={activity}
          loading={loading}
          emptyTitle="No watch activity yet"
          emptyDescription="Once users start watching, their progress will show up here."
        />
      </div>
    </div>
  );
}
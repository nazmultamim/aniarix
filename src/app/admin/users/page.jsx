"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import { getUsers, updateUserRole } from "@/lib/supabase/admin-queries";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const supabase = createClient();

  async function load(searchTerm = "") {
    setLoading(true);
    try {
      const data = await getUsers(supabase, { search: searchTerm });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleRole(user) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setUpdatingId(user.id);
    try {
      await updateUserRole(supabase, user.id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const columns = [
    {
      key: "username",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
          <div>
            <p className="font-medium">{row.username || "—"}</p>
            <p className="text-xs text-muted-foreground">{row.full_name || "No name set"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <Badge variant={row.role} />,
    },
    {
      key: "anilist_username",
      header: "AniList",
      render: (row) => row.anilist_username || <span className="text-muted-foreground">Not linked</span>,
    },
    {
      key: "created_at",
      header: "Joined",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => handleToggleRole(row)}
          disabled={updatingId === row.id}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50
          ${
            row.role === "admin"
              ? "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              : "border-primary-border/30 text-primary hover:bg-primary/10"
          }`}
        >
          {row.role === "admin" ? (
            <>
              <ShieldOff className="w-3.5 h-3.5" /> Revoke admin
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" /> Make admin
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(search)}
            placeholder="Search by username…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-secondary border border-border
            text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <span className="text-xs text-muted-foreground">{users.length} users</span>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyTitle="No users found"
        emptyDescription="Try a different search term."
      />
    </div>
  );
}
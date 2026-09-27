"use client";

import { ShieldAlert, AlertTriangle, ExternalLink } from "lucide-react";
import Badge from "@/components/admin/Badge";
import { getSecurityFindings } from "@/lib/supabase/admin-queries";

const SEVERITY_ICON = {
  critical: ShieldAlert,
  warn: AlertTriangle,
};

export default function AdminSecurityPage() {
  const findings = getSecurityFindings();
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warnCount = findings.filter((f) => f.severity === "warn").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Findings</p>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            {findings.length}
          </p>
        </div>
        <div className="rounded-lg border border-destructive-border/20 bg-destructive/5 p-5">
          <p className="text-xs font-medium text-destructive">Critical</p>
          <p className="mt-2 font-display text-3xl font-bold text-destructive">
            {criticalCount}
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs font-medium text-amber-400">Warnings</p>
          <p className="mt-2 font-display text-3xl font-bold text-amber-400">{warnCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {findings.map((f) => {
          const Icon = SEVERITY_ICON[f.severity] || AlertTriangle;
          return (
            <div
              key={f.id}
              className="rounded-lg border border-border bg-card p-4 flex items-start gap-3.5"
            >
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                  f.severity === "critical" ? "bg-destructive/10" : "bg-amber-500/10"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] ${
                    f.severity === "critical" ? "text-destructive" : "text-amber-400"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <Badge variant={f.severity}>{f.severity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                <div className="mt-2 rounded-md bg-secondary/60 border border-border px-3 py-2">
                  <code className="text-[11px] text-muted-foreground break-all">
                    {f.remediation}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <a
        href="https://supabase.com/docs/guides/database/database-linter"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Supabase database linter docs <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
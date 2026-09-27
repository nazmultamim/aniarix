"use client";

import { useEffect, useState } from "react";
import { DatabaseZap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAppSetting, setAppSetting } from "@/lib/supabase/admin-queries";

export default function AdminSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      try {
        const setting = await getAppSetting(supabase, "auto_keepalive");
        setEnabled(setting?.value?.enabled === true);
        setUpdatedAt(setting?.updated_at ?? null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle() {
    const next = !enabled;
    setSaving(true);
    try {
      await setAppSetting(supabase, "auto_keepalive", { enabled: next });
      setEnabled(next);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error("Failed to update keepalive setting:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <DatabaseZap className="w-[18px] h-[18px] text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-semibold text-foreground">
                Keep database active
              </h3>

              <button
                role="switch"
                aria-checked={enabled}
                onClick={handleToggle}
                disabled={loading || saving}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50
                ${enabled ? "bg-primary" : "bg-secondary border border-border"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Supabase pauses free-tier projects after a week with no
              database activity. When this is on, a scheduled job sends one
              read-only request every <span className="text-foreground">Sunday and Wednesday</span> —
              no rows are ever added, changed, or deleted. Turn it off and no
              automatic request is sent at all.
            </p>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading current setting…
                </span>
              ) : (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      enabled ? "bg-emerald-400" : "bg-muted-foreground"
                    }`}
                  />
                  {enabled ? "Active" : "Off"}
                  {updatedAt && (
                    <span>· last changed {new Date(updatedAt).toLocaleString()}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-display font-semibold text-foreground mb-1">
          Admin Console Preferences
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Placeholder settings — wire these to a real config table or your
          app's existing settings flow.
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-foreground">Email me on new signups</span>
            <input type="checkbox" className="w-4 h-4 accent-primary" />
          </label>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">Require MFA for admin accounts</span>
            <input type="checkbox" className="w-4 h-4 accent-primary" />
          </label>
        </div>
      </div>
    </div>
  );
}
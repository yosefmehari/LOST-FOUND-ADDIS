"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { AdminStats, ReportItem } from "../../types";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const refreshData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports(),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (reportsRes.success) setReports(reportsRes.reports || []);
    } catch (err) {
      console.error("Admin refresh error:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (authLoading) return;

    if (user?.role !== "ADMIN") {
      return;
    }

    async function loadData() {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          api.getAdminStats(),
          api.getAdminReports(),
        ]);
        if (isMounted) {
          if (statsRes.success) setStats(statsRes.stats);
          if (reportsRes.success) setReports(reportsRes.reports || []);
        }
      } catch (err) {
        console.error("Admin load error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  async function handleReportAction(reportId: string, status: "RESOLVED" | "DISMISSED") {
    setActionLoading(true);
    setMsg("");
    try {
      const res = await api.updateReportStatus(reportId, status);
      if (res.success) {
        setMsg(`Report updated to ${status}.`);
        refreshData();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update report";
      setMsg(errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  if (authLoading || (user?.role === "ADMIN" && loading)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl dark:bg-rose-950">
          🔒
        </div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">Access Restricted</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Administrator permissions are required to access this portal. If you need admin access, run the CLI promotion tool:
        </p>
        <code className="mt-4 inline-block rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          npm run promote-admin &lt;your-email&gt;
        </code>
        <div className="mt-6">
          <Link href="/" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ADMINISTRATION PORTAL
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-zinc-950 dark:text-white">
          System Overview & Moderation
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage listings, audit flagged content, and monitor community health.
        </p>
      </div>

      {msg && (
        <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {msg}
        </div>
      )}

      {/* Summary KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Registered Users</span>
            <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{stats.totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Active Listings</span>
            <p className="mt-2 text-3xl font-black text-emerald-600">{stats.totalItems}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Total Claims</span>
            <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{stats.totalClaims}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Pending Claims</span>
            <p className="mt-2 text-3xl font-black text-amber-500">{stats.pendingClaims}</p>
          </div>
        </div>
      )}

      {/* Moderation / Abuse Reports */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Flagged Listings & Abuse Reports ({reports.length})
        </h2>
        <p className="text-xs text-zinc-500">Listings reported by users for fraudulent or inappropriate content</p>

        <div className="mt-4">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
              No abuse reports currently open. Community content is clean!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span
                        className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                          r.status === "PENDING"
                            ? "bg-rose-100 text-rose-800"
                            : r.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {r.status}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                        Reason: {r.reason}
                      </h3>
                      {r.details && <p className="text-xs text-zinc-500 mt-0.5">&ldquo;{r.details}&rdquo;</p>}
                    </div>

                    <div className="text-xs text-zinc-400">
                      Reported by: <strong>{r.reporter?.name}</strong> ({r.reporter?.email})
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-between">
                    <div>
                      Associated Item: <strong>{r.item?.title}</strong> ({r.item?.type} in {r.item?.location})
                    </div>
                    {r.item && (
                      <Link
                        href={`/items/${r.item.id}`}
                        target="_blank"
                        className="font-semibold text-emerald-600 hover:underline"
                      >
                        Open Listing ↗
                      </Link>
                    )}
                  </div>

                  {r.status === "PENDING" && (
                    <div className="mt-4 flex gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleReportAction(r.id, "RESOLVED")}
                        className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Mark Resolved
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleReportAction(r.id, "DISMISSED")}
                        className="rounded-lg border border-zinc-300 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Item, Claim, NotificationItem } from "../../types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"items" | "my_claims" | "incoming_claims" | "notifications">("items");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedItemForClaims, setSelectedItemForClaims] = useState<string | null>(null);
  const [incomingClaims, setIncomingClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Status updating state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/dashboard");
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, isLoading, router]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [profileRes, claimsRes] = await Promise.all([
        api.getProfile(),
        api.getMyClaims(),
      ]);

      if (profileRes.success) {
        setMyItems(profileRes.myItems || []);
        setNotifications(profileRes.notifications || []);
      }
      if (claimsRes.success) {
        setMyClaims(claimsRes.claims || []);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadIncomingClaims(itemId: string) {
    setSelectedItemForClaims(itemId);
    setActionMessage("");
    try {
      const res = await api.getItemClaims(itemId);
      if (res.success) {
        setIncomingClaims(res.claims || []);
      }
    } catch (err) {
      console.error("Error loading item claims:", err);
    }
  }

  async function handleClaimResolution(claimId: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(true);
    setActionMessage("");
    try {
      const res = await api.updateClaimStatus(claimId, status);
      if (res.success) {
        setActionMessage(`Claim ${status.toLowerCase()} successfully.`);
        // Reload claims for current item
        if (selectedItemForClaims) {
          loadIncomingClaims(selectedItemForClaims);
        }
        loadDashboardData();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update claim";
      setActionMessage(errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* User Overview */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Personal Dashboard
            </span>
            <h1 className="mt-1 text-2xl font-extrabold text-zinc-950 dark:text-white">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-zinc-500">{user?.email}</p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/report-lost"
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
            >
              + Report Lost
            </Link>
            <Link
              href="/report-found"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              + Report Found
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("items")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "items"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          My Listings ({myItems.length})
        </button>
        <button
          onClick={() => setActiveTab("my_claims")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "my_claims"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          Claims I Submitted ({myClaims.length})
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "notifications"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          Notifications ({notifications.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Tab 1: My Reported Items */}
        {activeTab === "items" && (
          <div>
            {myItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
                <p className="text-sm text-zinc-500">You haven&apos;t reported any lost or found items yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            item.type === "LOST" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-xs font-medium text-zinc-500">{item.category}</span>
                        <span className="text-xs text-zinc-400">| Status: {item.status}</span>
                      </div>
                      <h3 className="mt-1 font-bold text-zinc-900 dark:text-white">
                        <Link href={`/items/${item.id}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-zinc-500">📍 {item.location} • {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          loadIncomingClaims(item.id);
                          setActiveTab("incoming_claims");
                        }}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
                      >
                        Review Claims ({item._count?.claims || 0})
                      </button>
                      <Link
                        href={`/items/${item.id}`}
                        className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Incoming Claims on a specific listing */}
        {activeTab === "incoming_claims" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Incoming Ownership Claims
              </h2>
              <button
                onClick={() => setActiveTab("items")}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                ← Back to listings
              </button>
            </div>

            {actionMessage && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                {actionMessage}
              </div>
            )}

            {incomingClaims.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
                No claims submitted for this item yet.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {incomingClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Claimant: {claim.claimant?.name}
                      </span>
                      <span
                        className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                          claim.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : claim.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <strong>Submitted Proof:</strong> {claim.message}
                    </div>

                    {claim.verificationNotes && (
                      <p className="mt-2 text-xs text-zinc-500">
                        Private Contact / Notes: {claim.verificationNotes}
                      </p>
                    )}

                    {claim.status === "PENDING" && (
                      <div className="mt-4 flex gap-2">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleClaimResolution(claim.id, "APPROVED")}
                          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve & Hand Over
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleClaimResolution(claim.id, "REJECTED")}
                          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Claims I Submitted */}
        {activeTab === "my_claims" && (
          <div>
            {myClaims.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
                You haven&apos;t submitted any claims on listings.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            claim.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : claim.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {claim.status}
                        </span>
                        <span className="text-xs text-zinc-500">
                          Claimed on: {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="mt-1 font-bold text-zinc-900 dark:text-white">
                        {claim.item?.title}
                      </h3>
                      <p className="text-xs text-zinc-500">Your message: &ldquo;{claim.message}&rdquo;</p>
                    </div>

                    <div>
                      {claim.item && (
                        <Link
                          href={`/items/${claim.item.id}`}
                          className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          View Item
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === "notifications" && (
          <div>
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
                No notifications right now.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{n.title}</h4>
                      <span className="text-xs text-zinc-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

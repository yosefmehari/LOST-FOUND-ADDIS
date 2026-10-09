"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { Item } from "../../../types";

function ItemDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = String(params.id);

  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<Item[]>([]);
  const [matchDisclaimer, setMatchDisclaimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState("");

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Suspected fraudulent listing");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    async function fetchItemAndMatches() {
      try {
        const [itemRes, matchesRes] = await Promise.all([
          api.getItem(id),
          api.getItemMatches(id).catch(() => ({ success: false, matches: [], disclaimer: "" })),
        ]);

        if (itemRes.success) {
          setItem(itemRes.item);
        }
        if (matchesRes.success) {
          setMatches(matchesRes.matches || []);
          setMatchDisclaimer(matchesRes.disclaimer || "");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load listing details");
      } finally {
        setLoading(false);
      }
    }
    fetchItemAndMatches();
  }, [id]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/items/${id}`);
      return;
    }

    setSubmittingClaim(true);
    setClaimError("");

    try {
      const res = await api.submitClaim(id, claimMessage, claimNotes);
      if (res.success) {
        setClaimSuccess(true);
      }
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : "Failed to submit claim. Please try again.");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/items/${id}`);
      return;
    }

    setSubmittingReport(true);
    setReportError("");

    try {
      const res = await api.submitReport(id, reportReason, reportDetails);
      if (res.success) {
        setReportSuccess(true);
      }
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Listing Not Found</h2>
        <p className="mt-2 text-sm text-zinc-500">{error || "This item may have been removed or archived."}</p>
        <Link href="/items" className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Back to Browse
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === item.user.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button & Report button */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/items" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
          ← Back to Listings
        </Link>
        <button
          onClick={() => setReportModalOpen(true)}
          className="text-xs text-zinc-400 hover:text-rose-600 transition"
        >
          🚩 Report this listing
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        {item.imageUrl && (
          <div className="h-72 w-full bg-zinc-100 sm:h-96">
            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                item.type === "LOST" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              {item.type} Item
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {item.category}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                item.status === "OPEN"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              Status: {item.status}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-zinc-950 dark:text-white">
            {item.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500">
            <span>📍 Location: <strong>{item.location}</strong></span>
            <span>📅 Date Reported: <strong>{new Date(item.createdAt).toLocaleDateString()}</strong></span>
            <span>👤 Reporter: <strong>{item.user.name}</strong></span>
          </div>

          <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Description & Identifying Details</h2>
            <p className="mt-3 text-base text-zinc-700 whitespace-pre-line leading-relaxed dark:text-zinc-300">
              {item.description}
            </p>
          </div>

          <div className="mt-8 border-t border-zinc-100 pt-6 flex flex-wrap items-center justify-between gap-4 dark:border-zinc-800">
            <div>
              {item.contactInfo && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Contact preference provided: <span className="font-mono">{item.contactInfo}</span>
                </p>
              )}
            </div>

            <div>
              {isOwner ? (
                <div className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  This is your listing (manage in Dashboard)
                </div>
              ) : item.status === "OPEN" ? (
                <button
                  onClick={() => setClaimModalOpen(true)}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  🤝 Submit Ownership Claim
                </button>
              ) : (
                <span className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                  Item is {item.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matching Suggestions Section */}
      {matches.length > 0 && (
        <div className="mt-12 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                💡 Possible Matching {item.type === "LOST" ? "Found" : "Lost"} Items
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {matchDisclaimer}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {matches.map((m) => (
              <Link
                key={m.id}
                href={`/items/${m.id}`}
                className="flex items-center gap-4 rounded-2xl border border-zinc-100 p-4 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
                  {m.type === "LOST" ? "🔎" : "🎁"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="truncate font-semibold text-zinc-900 dark:text-white text-sm">{m.title}</h4>
                  <p className="text-xs text-zinc-500">📍 {m.location} • {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600">View →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900 sm:p-8">
            {claimSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-950">
                  ✅
                </div>
                <h3 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">Claim Submitted!</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  The reporter has received your ownership verification claim. You can monitor progress on your Dashboard.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => setClaimModalOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold">
                    Close
                  </button>
                  <Link href="/dashboard" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit}>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Claim Ownership: {item.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Provide unique details only the rightful owner would know (e.g. serial numbers, wallpaper, receipts, or contents).
                </p>

                {claimError && (
                  <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    {claimError}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Proof / Distinguishing Features *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Explain features not visible in pictures, exact date/bus route where lost, or what's inside..."
                      value={claimMessage}
                      onChange={(e) => setClaimMessage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Private Verification Notes (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Your phone number or telegram handle for contact upon approval"
                      value={claimNotes}
                      onChange={(e) => setClaimNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim || claimMessage.trim().length < 10}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-700"
                  >
                    {submittingClaim ? "Submitting..." : "Send Claim"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Abuse Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900 sm:p-8">
            {reportSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-950">
                  🛡️
                </div>
                <h3 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">Report Received</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Thank you for keeping the Addis community safe. Moderators will audit this listing promptly.
                </p>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      setReportModalOpen(false);
                      setReportSuccess(false);
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Report This Listing</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Help us protect the community against scams, fraudulent claims, or private data exposure.
                </p>

                {reportError && (
                  <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">
                    {reportError}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Reason for Report
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value="Suspected fraudulent listing">Suspected fraudulent listing</option>
                      <option value="Exposes private or sensitive info (passwords, banking PIN)">Exposes private/sensitive information</option>
                      <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
                      <option value="Duplicate or spam listing">Duplicate or spam listing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Additional Details (optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Explain what looks suspicious or why this listing should be reviewed..."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {submittingReport ? "Submitting..." : "Send Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading listing...</div>}>
      <ItemDetailContent />
    </Suspense>
  );
}

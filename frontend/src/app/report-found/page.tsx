"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  "Wallets & Cards",
  "Phones & Electronics",
  "Keys & Bags",
  "Documents & IDs",
  "Clothing & Accessories",
  "Jewelry",
  "Other",
];

export default function ReportFoundPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/report-found");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await api.createItem({
        title,
        description,
        category,
        type: "FOUND",
        location,
        contactInfo: contactInfo || undefined,
        imageUrl: imageUrl || undefined,
      });

      if (res.success) {
        router.push(`/items/${res.item.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit found item report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          FOUND ITEM REPORT
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-zinc-950 dark:text-white">
          Report a Found Belonging
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Help return an item to its owner. Keep distinguishing details private so you can verify the claimant.
        </p>
      </div>

      {!user && (
        <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Please <Link href="/login?redirect=/report-found" className="font-bold underline">sign in</Link> or{" "}
          <Link href="/register?redirect=/report-found" className="font-bold underline">create an account</Link> to publish a listing.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
            Item Title *
          </label>
          <input
            required
            type="text"
            placeholder="e.g., Ethiopian Passport found near Bole Medhanialem"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
              Location Found in Addis Ababa *
            </label>
            <input
              required
              type="text"
              placeholder="e.g., Bole Medhanialem, bench outside cafe"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
            Description & Instructions *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe general appearance. TIP: Leave out at least one specific feature (like inside initials or exact cash amount) so claimants must prove ownership!"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
            Contact Preference (optional)
          </label>
          <input
            type="text"
            placeholder="e.g., Telegram @username or Phone number"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
            Image URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://example.com/item-photo.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Publishing Report..." : "Publish Found Item Report"}
        </button>
      </form>
    </div>
  );
}

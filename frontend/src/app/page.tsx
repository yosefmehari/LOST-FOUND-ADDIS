"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { Item } from "../types";

const CATEGORIES = [
  "All",
  "Wallets & Cards",
  "Phones & Electronics",
  "Keys & Bags",
  "Documents & IDs",
  "Clothing & Accessories",
  "Jewelry",
  "Other",
];

const SUBCITIES = [
  "All Addis Ababa",
  "Bole",
  "Arat Kilo",
  "Piazza",
  "Kazanchis",
  "Kirkos",
  "Megenagna",
  "Lideta",
  "Saris",
  "Gullele",
];

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { limit: 8 };
        if (selectedType !== "ALL") params.type = selectedType;
        if (selectedCategory !== "All") params.category = selectedCategory;
        if (searchQuery.trim()) params.query = searchQuery.trim();

        const res = await api.getItems(params);
        if (res.success) {
          setItems(res.items);
        }
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, [selectedType, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-zinc-50 px-4 pt-16 pb-20 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/60 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/60 dark:text-emerald-300">
            📍 Addis Ababa Community Recovery Platform
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl dark:text-white">
            Reconnecting You with What Was Lost in Addis
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
            Report lost belongings, list items you found, verify ownership, and safely recover personal property across Addis Ababa subcities.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/report-lost"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-rose-700 hover:shadow-md"
            >
              <span>📢 I Lost Something</span>
            </Link>
            <Link
              href="/report-found"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
            >
              <span>🤝 I Found Something</span>
            </Link>
            <Link
              href="/items"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-base font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span>🔍 Search All Listings</span>
            </Link>
          </div>

          {/* Quick Search Input */}
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search lost IDs, phones, keys, wallets, or locations (e.g., Bole, Piazza)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 pl-12 text-zinc-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
              <svg
                className="absolute left-4 h-5 w-5 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Quick Subcity Filter Chips */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="text-zinc-500 mr-1">Popular subcities:</span>
              {SUBCITIES.map((subcity) => (
                <button
                  key={subcity}
                  onClick={() => setSearchQuery(subcity === "All Addis Ababa" ? "" : subcity)}
                  className={`rounded-full px-2.5 py-1 font-medium transition ${
                    (searchQuery === subcity || (subcity === "All Addis Ababa" && !searchQuery))
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {subcity}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Recent Lost & Found Listings
            </h2>
            <p className="text-sm text-zinc-500">Live listings updated directly from the Addis community</p>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2 rounded-xl bg-zinc-200/80 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                selectedType === "ALL"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType("LOST")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                selectedType === "LOST"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              Lost Items
            </button>
            <button
              onClick={() => setSelectedType("FOUND")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                selectedType === "FOUND"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              Found Items
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-6 flex overflow-x-auto pb-2 gap-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                <span className="text-sm text-zinc-500">Loading listings from database...</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                🔍
              </div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">No listings found</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Be the first to report a lost or found item in this category.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/report-lost"
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Report Lost
                </Link>
                <Link
                  href="/report-found"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Report Found
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Image or Category Fallback */}
                  <div className="relative flex h-44 w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-400">
                        <span className="text-3xl">
                          {item.type === "LOST" ? "🔎" : "🎁"}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wider">{item.category}</span>
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                          item.type === "LOST"
                            ? "bg-rose-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    {/* Status if Claimed */}
                    {item.status !== "OPEN" && (
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-4">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {item.category}
                    </span>
                    <h3 className="mt-1 line-clamp-1 font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500">
                      {item.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 dark:border-zinc-800">
                      <span className="flex items-center gap-1">
                        📍 {item.location}
                      </span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Safety & Trust in Addis Ababa */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-200">
            🛡️ Safe Recovery Guidelines in Addis Ababa
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-xs dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">1. Verify Distinguishing Marks</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Before handing an item over, ask the claimant for specifics not mentioned in the listing (such as phone lock screen wallpapers, ID card numbers, or internal bag contents).
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-xs dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">2. Meet in Public Addis Landmarks</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Always arrange handovers during daylight hours in well-known public locations (e.g. coffee shops near Edna Mall, Piassa Post Office, or Mexico Square).
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-xs dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">3. Never Pay to Claim</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Never send advance money transfers (such as Telebirr or CBE Birr) to recover an item. Lost & Found Addis is a free community service.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

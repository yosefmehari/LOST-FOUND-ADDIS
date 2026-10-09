"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { Item } from "../../types";

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

function ItemsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "LOST" ? "LOST" : searchParams.get("type") === "FOUND" ? "FOUND" : "ALL";

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"ALL" | "LOST" | "FOUND">(initialType);
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 12 };
        if (type !== "ALL") params.type = type;
        if (category !== "All") params.category = category;
        if (location.trim()) params.location = location.trim();
        if (query.trim()) params.query = query.trim();

        const res = await api.getItems(params);
        if (res.success) {
          setItems(res.items);
          setTotalPages(res.pagination.totalPages || 1);
        }
      } catch (err) {
        console.error("Failed to load listings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [type, category, location, query, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Browse All Listings in Addis Ababa
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Search lost IDs, phones, bags, and items reported found by fellow Addis residents.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search keywords, brand, name on card..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {/* Location Input */}
        <div className="w-full md:w-56">
          <input
            type="text"
            placeholder="Location (e.g., Bole, Piazza)..."
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Type Toggle */}
        <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => {
              setType("ALL");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              type === "ALL" ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setType("LOST");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              type === "LOST" ? "bg-rose-600 text-white" : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => {
              setType("FOUND");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              type === "FOUND" ? "bg-emerald-600 text-white" : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Found
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
            <p className="text-zinc-500">No items match your filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="relative flex h-44 w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-400">
                      <span className="text-3xl">{item.type === "LOST" ? "🔎" : "🎁"}</span>
                      <span className="text-xs uppercase">{item.category}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                        item.type === "LOST" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  {item.status !== "OPEN" && (
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {item.status}
                      </span>
                    </div>
                  )}
                </div>

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
                    <span>📍 {item.location}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm text-zinc-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading search listings...</div>}>
      <ItemsContent />
    </Suspense>
  );
}

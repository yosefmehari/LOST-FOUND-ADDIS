"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">Lost & Found Addis</span>
            <span className="text-sm text-zinc-500">| Connecting community in Addis Ababa, Ethiopia</span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/items" className="hover:text-zinc-900 dark:hover:text-zinc-100">Browse</Link>
            <Link href="/report-lost" className="hover:text-zinc-900 dark:hover:text-zinc-100">Lost Items</Link>
            <Link href="/report-found" className="hover:text-zinc-900 dark:hover:text-zinc-100">Found Items</Link>
            <span className="text-zinc-400">Addis Ababa, ET</span>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
          <p>© 2026 Lost & Found Addis. Community platform. Be safe when meeting up to return items.</p>
        </div>
      </div>
    </footer>
  );
}

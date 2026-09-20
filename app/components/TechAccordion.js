"use client";

import { useState } from "react";

export default function TechAccordion({ items }) {
  const [openId, setOpenId] = useState(items[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-xl border border-zinc-200 bg-white transition-colors dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {item.title}
              </span>
              <span className="flex items-center gap-3">
                <span className="hidden shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 sm:inline-block">
                  {item.metric} · {item.metricLabel}
                </span>
                <svg
                  className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-zinc-100 px-5 pb-5 pt-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <p>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    O que faz:{" "}
                  </span>
                  {item.what}
                </p>
                <p>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Benefício:{" "}
                  </span>
                  {item.benefit}
                </p>
                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 sm:hidden">
                  {item.metric} · {item.metricLabel}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

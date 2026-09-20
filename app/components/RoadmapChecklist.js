"use client";

import { useState } from "react";

export default function RoadmapChecklist({ steps }) {
  const [checked, setChecked] = useState({});

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const doneCount = Object.values(checked).filter(Boolean).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {doneCount}/{steps.length} etapas
        </span>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const isDone = !!checked[step.id];
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => toggle(step.id)}
                className={`flex w-full items-start gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
                  isDone
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span>
                  <span
                    className={`block font-medium ${
                      isDone
                        ? "text-emerald-800 line-through dark:text-emerald-300"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

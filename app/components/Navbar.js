"use client";

import { useState } from "react";
import { MenuIcon, PulseIcon } from "./Icons";
import { site } from "../site.config";

const LINKS = [
  { href: "#problema", label: "O Problema" },
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#simulador", label: "Simulador" },
  { href: "#resultados", label: "Resultados" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#inicio" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-white">
            <PulseIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-navy-950">{site.name}</span>
          <span className="hidden rounded-full border border-mint/40 bg-mint/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-emerald-700 sm:inline-block">
            Protótipo Acadêmico · {site.institution}
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy-950"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Abrir menu"
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </nav>

      {open && (
        <ul className="border-t border-slate-200 bg-white px-4 py-2 lg:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

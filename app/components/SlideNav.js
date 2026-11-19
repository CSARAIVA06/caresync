"use client";

import { useEffect, useState } from "react";

const NAV_H = () => document.querySelector("header")?.offsetHeight ?? 64;

// Navegação de apresentação: bolinhas na lateral (telas grandes) e PageDown/PageUp, que é o que os
// passadores de slide enviam. Um slide mais alto que a tela é percorrido antes de ir ao próximo.
export default function SlideNav({ slides }) {
  const [active, setActive] = useState(slides[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    slides.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [slides]);

  useEffect(() => {
    const go = (el) => window.scrollTo({ top: el.offsetTop - NAV_H(), behavior: "smooth" });
    const onKey = (e) => {
      if (e.key !== "PageDown" && e.key !== "PageUp") return;
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const els = slides.map((s) => document.getElementById(s.id)).filter(Boolean);
      const nav = NAV_H();
      // Slide atual: o último cujo topo já passou da barra de navegação.
      let i = 0;
      els.forEach((el, k) => {
        if (el.getBoundingClientRect().top <= nav + 4) i = k;
      });
      const cur = els[i].getBoundingClientRect();
      if (e.key === "PageDown") {
        if (cur.bottom > window.innerHeight + 4) return; // ainda há conteúdo deste slide: rolagem normal
        if (els[i + 1]) {
          e.preventDefault();
          go(els[i + 1]);
        }
      } else {
        e.preventDefault();
        if (cur.top < nav - 4) go(els[i]);
        else if (els[i - 1]) go(els[i - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides]);

  return (
    <nav aria-label="Slides" className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <ol className="flex flex-col gap-2.5">
        {slides.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id} className="group relative flex items-center justify-end">
              <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-md bg-navy-950 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                {s.label}
              </span>
              <a
                href={`#${s.id}`}
                aria-label={s.label}
                aria-current={on ? "true" : undefined}
                className={`block rounded-full ring-2 ring-white/70 transition-all ${
                  on ? "h-3.5 w-3.5 bg-mint" : "h-2.5 w-2.5 bg-slate-400/70 hover:bg-slate-500"
                }`}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

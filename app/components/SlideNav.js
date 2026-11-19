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

    // Avança (dir = 1) ou volta (dir = -1) um slide. Retorna false quando a rolagem normal deve agir:
    // ainda há conteúdo do slide atual fora da tela, ou não existe slide nessa direção (ex.: rodapé).
    const step = (dir) => {
      const els = slides.map((s) => document.getElementById(s.id)).filter(Boolean);
      const nav = NAV_H();
      // Slide atual: o último cujo topo já passou da barra de navegação.
      let i = 0;
      els.forEach((el, k) => {
        if (el.getBoundingClientRect().top <= nav + 4) i = k;
      });
      const cur = els[i].getBoundingClientRect();
      if (dir > 0) {
        if (cur.bottom > window.innerHeight + 4 || !els[i + 1]) return false;
        go(els[i + 1]);
      } else if (cur.top < nav - 4) {
        if (cur.bottom < window.innerHeight * 0.5) return false; // no rodapé: volta rolando
        go(els[i]);
      } else {
        if (!els[i - 1]) return false;
        go(els[i - 1]);
      }
      return true;
    };

    const ignore = (t) => t.closest?.("input, textarea, select, [contenteditable], [role=tooltip]");

    const onKey = (e) => {
      if (e.key !== "PageDown" && e.key !== "PageUp") return;
      if (ignore(e.target)) return;
      if (step(e.key === "PageDown" ? 1 : -1)) e.preventDefault();
    };

    // Roda do mouse/trackpad em telas grandes: um gesto = um slide. Enquanto a animação roda, e enquanto
    // chegam eventos de inércia do trackpad, os eventos são descartados para não pular dois slides.
    let lockedUntil = 0;
    let lastWheel = 0;
    let jumpedThisGesture = false;
    const onWheel = (e) => {
      if (window.innerWidth < 1024 || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (ignore(e.target)) return;
      const now = performance.now();
      // Um gesto é uma sequência de eventos com menos de 200 ms entre eles (inclui a inércia do trackpad).
      if (now - lastWheel >= 200) jumpedThisGesture = false;
      lastWheel = now;
      if (now < lockedUntil || jumpedThisGesture) {
        e.preventDefault();
        return;
      }
      if (step(Math.sign(e.deltaY))) {
        e.preventDefault();
        lockedUntil = now + 700;
        jumpedThisGesture = true;
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
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

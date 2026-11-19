"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const WIDTH = 288;
const GAP = 8;

// Termo com explicação: abre ao passar o cursor e fixa ao clicar/tocar (celular).
// O balão usa position: fixed para não ser cortado por tabelas com rolagem horizontal.
export default function InfoTip({ title, children, content, className = "" }) {
  const id = useId();
  const btn = useRef(null);
  const tip = useRef(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState(null);
  const open = hover || pinned;

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(WIDTH, window.innerWidth - 2 * GAP);
    const left = Math.min(Math.max(r.left, GAP), window.innerWidth - width - GAP);
    const height = tip.current?.offsetHeight ?? 0;
    const below = r.bottom + GAP;
    const top = below + height > window.innerHeight && r.top - GAP - height > 0 ? r.top - GAP - height : below;
    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setHover(false);
      setPinned(false);
    };
    const onDown = (e) => {
      if (!btn.current?.contains(e.target) && !tip.current?.contains(e.target)) close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() => setPinned((p) => !p)}
        className={`cursor-help rounded-sm text-left underline decoration-slate-300 decoration-dotted underline-offset-4 transition-colors hover:decoration-sky-ai focus-visible:outline-2 focus-visible:outline-sky-ai ${className}`}
      >
        {children}
      </button>
      {open && (
        <div
          ref={tip}
          id={id}
          role="tooltip"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={pos ? { top: pos.top, left: pos.left, width: pos.width } : { visibility: "hidden" }}
          className="fixed z-[60] animate-[fadein_.15s_ease-out_both] rounded-xl border border-slate-200 bg-white p-4 text-left text-sm font-normal normal-case leading-relaxed tracking-normal text-slate-600 shadow-xl shadow-slate-900/10"
        >
          {title && <p className="mb-1 font-semibold text-navy-950">{title}</p>}
          {content}
        </div>
      )}
    </>
  );
}

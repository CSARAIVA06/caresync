"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const DURATION = 1200;
const Visible = createContext(true);

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Dispara as animações dos filhos (barras e números) quando o grupo entra na tela, uma única vez.
export function InView({ as: Tag = "div", className, children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className}>
      <Visible.Provider value={visible}>{children}</Visible.Provider>
    </Tag>
  );
}

// Barra que cresce de 0 até `percent` (0–100).
export function GrowBar({ percent, delay = 0, className = "", style }) {
  const visible = useContext(Visible);
  return (
    <div
      className={`transition-[width] ease-out motion-reduce:transition-none ${className}`}
      style={{ ...style, width: visible ? `${percent}%` : "0%", transitionDuration: `${DURATION}ms`, transitionDelay: `${delay}ms` }}
    />
  );
}

// Número que conta de 0 até `to`, no formato brasileiro.
export function CountUp({ to, decimals = 1, suffix = "", delay = 0, className }) {
  const visible = useContext(Visible);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let raf;
    let start;
    const tick = (t) => {
      if (reducedMotion()) return setValue(to);
      start ??= t + delay;
      const p = Math.min(Math.max((t - start) / DURATION, 0), 1);
      setValue(to * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, to, delay]);

  const fmt = (v) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: decimals })}${suffix}`;
  return (
    // `relative` mantém o texto do leitor de tela (absoluto) dentro de áreas com rolagem horizontal.
    <span className={`relative ${className ?? ""}`}>
      <span aria-hidden="true">{fmt(value)}</span>
      <span className="sr-only">{fmt(to)}</span>
    </span>
  );
}

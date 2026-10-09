import { LEVELS } from "../lib/triage";

// Apenas o visual fica aqui; os nomes dos níveis vêm de LEVELS.
const STYLES = {
  verde: { box: "bg-ok/10 text-green-700 ring-ok/40", dot: "bg-ok" },
  amarelo: { box: "bg-warn/10 text-amber-700 ring-warn/40", dot: "bg-warn" },
  vermelho: { box: "bg-crit/10 text-red-700 ring-crit/40", dot: "bg-crit" },
};

export const LEVEL_DOT = Object.fromEntries(
  Object.entries(STYLES).map(([k, v]) => [k, v.dot])
);

export default function RiskBadge({ level, size = "sm" }) {
  const s = STYLES[level];
  const sizing = size === "lg" ? "px-4 py-1.5 text-base" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ${s.box} ${sizing}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot} ${level === "vermelho" ? "animate-pulse" : ""}`} />
      {LEVELS[level].short}
    </span>
  );
}

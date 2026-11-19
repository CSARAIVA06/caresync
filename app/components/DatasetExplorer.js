"use client";

import { useRef, useState } from "react";
import RiskBadge from "./RiskBadge";
import { DATASET, EXEMPLO_ANOTADO, FORMATOS } from "../lib/resultados";
import { formatRef, formatValue, LEVEL_ORDER, MARKERS } from "../lib/triage";

const ENTIDADES = {
  EXAME: { label: "Exame", cls: "bg-sky-100 text-sky-900 ring-sky-300" },
  VALOR: { label: "Valor", cls: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
  UNIDADE: { label: "Unidade", cls: "bg-violet-100 text-violet-900 ring-violet-300" },
  REFERENCIA: { label: "Referência", cls: "bg-amber-100 text-amber-900 ring-amber-300" },
};

// Regras de cada nível e o exemplo real do laudo L0018 (pontilhado) que cai em cada um.
const NIVEIS = {
  verde: {
    regra: "Todos os exames dentro da faixa de referência.",
    exemplo: "Plaquetas 279.000 /µL — dentro de 150.000 a 450.000.",
  },
  amarelo: {
    regra: "Algum exame fora da faixa de referência, mas sem passar do limite crítico.",
    exemplo: "Hematócrito 38% — abaixo da referência do próprio laudo (40 a 52).",
  },
  vermelho: {
    regra: "Algum exame além do limite crítico (valor de pânico) da base de conhecimento.",
    exemplo: "Hemoglobina 5,8 g/dL — abaixo do limite crítico de 7 g/dL.",
  },
};

const s = DATASET.splits;
const TILES = [
  { value: DATASET.total.toLocaleString("pt-BR"), label: "laudos sintéticos", sub: `${s.treino} treino · ${s.validacao} validação · ${s.teste} teste · ${s.ood} OOD` },
  { value: DATASET.formatos, label: "formatos de laudo", sub: `${DATASET.formatosOod} deles só aparecem no teste OOD` },
  { value: DATASET.marcadores, label: "marcadores laboratoriais", sub: "com unidade, referência e limites críticos" },
  { value: 3, label: "níveis de risco", sub: "Normal · Atenção · Crítico" },
];

export default function DatasetExplorer() {
  const [sel, setSel] = useState(null);
  const panel = useRef(null);

  const select = (i) => {
    setSel((cur) => (cur === i ? null : i));
    requestAnimationFrame(() => {
      const r = panel.current?.getBoundingClientRect();
      if (r && r.top > window.innerHeight * 0.75) panel.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  return (
    <div>
      <div role="tablist" aria-label="Sobre o dataset" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t, i) => {
          const active = sel === i;
          return (
            <button
              key={t.label}
              type="button"
              role="tab"
              id={`dataset-${i}`}
              aria-selected={active}
              aria-controls="dataset-painel"
              onClick={() => select(i)}
              className={`group relative rounded-2xl border p-6 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ai ${
                active
                  ? "border-navy-800 bg-navy-800 text-white shadow-lg shadow-navy-800/25"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-ai hover:shadow-md"
              }`}
            >
              <p className={`text-4xl font-extrabold tabular-nums tracking-tight ${active ? "text-white" : "text-navy-950"}`}>{t.value}</p>
              <p className={`mt-1 font-semibold ${active ? "text-white" : "text-slate-700"}`}>{t.label}</p>
              <p className={`mt-1 text-sm ${active ? "text-slate-200" : "text-slate-500"}`}>{t.sub}</p>
              <p className={`mt-3 text-xs font-semibold ${active ? "text-sky-200" : "text-sky-700"}`}>
                {active ? "Fechar ↑" : "Ver demonstração ↓"}
              </p>
              {active && <span className="absolute -bottom-[7px] left-8 hidden h-3 w-3 rotate-45 bg-navy-800 sm:block" />}
            </button>
          );
        })}
      </div>

      {sel !== null && (
        <div
          ref={panel}
          id="dataset-painel"
          role="tabpanel"
          aria-labelledby={`dataset-${sel}`}
          className="mt-4 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"
        >
          <div key={sel} className="animate-[fadein_.25s_ease-out_both]">
            {sel === 0 && <PainelLaudos />}
            {sel === 1 && <PainelFormatos />}
            {sel === 2 && <PainelMarcadores />}
            {sel === 3 && <PainelNiveis />}
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ title, children }) {
  return (
    <div className="mb-5">
      <h4 className="text-lg font-bold text-navy-950">{title}</h4>
      <p className="mt-1 max-w-3xl leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

/* ---------------------------- 1.200 laudos ---------------------------- */

const SPLITS = [
  { key: "treino", label: "Treino", note: "o modelo aprende com estes", cls: "bg-navy-800 text-white" },
  { key: "validacao", label: "Validação", note: "ajuste de hiperparâmetros", cls: "bg-blue-500 text-white" },
  { key: "teste", label: "Teste", note: "formatos vistos, laudos novos", cls: "bg-sky-300 text-navy-950" },
  { key: "ood", label: "OOD", note: "formatos nunca vistos", cls: "bg-teal-600 text-white" },
];

function PainelLaudos() {
  return (
    <>
      <Header title="Como os 1.200 laudos foram criados">
        Laudos reais têm dados sensíveis de pacientes, então o projeto gera laudos sintéticos com um script
        (<code className="text-sm">gerar_dataset.py --seed 42</code>). A mesma semente recria exatamente o mesmo dataset.
      </Header>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-slate-600">
            <li>• Cada laudo recebe um nível de risco-alvo, e um exame principal é sorteado dentro da faixa desse nível. Por isso os três níveis ficam equilibrados.</li>
            <li>• Nomes (HB, HGB, Hemoglobina), unidades, formato dos números (13,5 · 13.5 · 250 mil) e referências do laboratório variam de um laudo para outro.</li>
            <li>• Cada laudo já sai <strong className="text-slate-800">anotado</strong>: a posição exata de cada exame, valor, unidade e referência, que é o que o NER aprende a reconhecer.</li>
          </ul>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Divisão dos laudos</p>
            <div className="flex h-10 overflow-hidden rounded-lg text-xs font-semibold">
              {SPLITS.map((sp) => (
                <div
                  key={sp.key}
                  className={`flex items-center justify-center border-r-2 border-white last:border-r-0 ${sp.cls}`}
                  style={{ width: `${(s[sp.key] / DATASET.total) * 100}%` }}
                  title={`${sp.label}: ${s[sp.key]} laudos`}
                >
                  {s[sp.key]}
                </div>
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {SPLITS.map((sp) => (
                <li key={sp.key} className="flex items-start gap-2">
                  <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-sm ${sp.cls}`} />
                  <span>
                    <strong className="text-slate-800">{sp.label}</strong> ({s[sp.key]}): {sp.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Nível de risco dos laudos</p>
            <div className="flex flex-wrap gap-2">
              {LEVEL_ORDER.map((l) => (
                <span key={l} className="flex items-center gap-2 text-sm text-slate-700">
                  <RiskBadge level={l} /> <strong className="tabular-nums">{DATASET.risco[l]}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
        <Anotacao />
      </div>
    </>
  );
}

function Anotacao() {
  const [show, setShow] = useState(true);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Laudo real do dataset (L0018), anotado</p>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          {show ? "Ocultar anotações" : "Mostrar anotações"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-8 text-slate-700">
        {EXEMPLO_ANOTADO.map((linha, i) => (
          <div key={i} className="whitespace-pre">
            {linha.map(([texto, label], j) =>
              label && show ? (
                <span key={j} title={ENTIDADES[label].label} className={`rounded px-1 py-0.5 ring-1 ${ENTIDADES[label].cls}`}>
                  {texto}
                </span>
              ) : (
                <span key={j}>{texto}</span>
              )
            )}
          </div>
        ))}
      </div>
      <ul className={`mt-3 flex flex-wrap gap-2 text-xs transition-opacity ${show ? "" : "opacity-40"}`}>
        {Object.entries(ENTIDADES).map(([k, e]) => (
          <li key={k} className={`rounded px-2 py-0.5 font-semibold ring-1 ${e.cls}`}>
            {e.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-slate-600">
        Essas marcações são o gabarito do NER: no treino ele vê o texto e as marcações; no teste, recebe só o texto e precisa encontrá-las sozinho.
      </p>
    </div>
  );
}

/* ---------------------------- 8 formatos ---------------------------- */

function PainelFormatos() {
  const [f, setF] = useState(0);
  const fmt = FORMATOS[f];
  return (
    <>
      <Header title="O mesmo exame, escrito de 8 jeitos">
        Cada laboratório formata o laudo de um jeito. Seis formatos são usados no treino; os outros dois ficam escondidos e
        só aparecem no teste OOD, para medir se o sistema entende laudos que nunca viu.
      </Header>
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <ul className="flex flex-col gap-1.5">
          {FORMATOS.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setF(i)}
                aria-pressed={f === i}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  f === i ? "border-navy-800 bg-navy-800 font-semibold text-white" : "border-slate-200 text-slate-700 hover:border-sky-ai hover:bg-sky-50"
                }`}
              >
                <span>
                  <span className={`mr-2 tabular-nums ${f === i ? "text-sky-200" : "text-slate-400"}`}>{i + 1}</span>
                  {x.nome}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase ${
                    x.ood ? "bg-teal-600 text-white" : f === i ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {x.ood ? "só no OOD" : "treino"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Trecho real do dataset</p>
          <pre key={fmt.id} className="animate-[fadein_.2s_ease-out_both] overflow-x-auto rounded-lg bg-navy-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
            {fmt.exemplo}
          </pre>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {fmt.ood
              ? "Este formato nunca aparece no treino. É aqui que o regex falha (F1 0,8% no OOD) e o NER BERTimbau mostra que generaliza (95,7%)."
              : "Formato usado no treino (cerca de 100 laudos cada). O regex foi escrito para esses seis formatos."}
          </p>
        </div>
      </div>
    </>
  );
}

/* ---------------------------- 12 marcadores ---------------------------- */

const fmtLimite = (v, unit) => (v == null ? null : `${formatValue(v)} ${unit}`);

function PainelMarcadores() {
  const [m, setM] = useState(0);
  const mk = MARKERS[m];
  const [critLo, critHi] = mk.critical;
  const [refLo, refHi] = mk.ref;
  return (
    <>
      <Header title="Os 12 exames que o sistema entende">
        Para cada marcador, a base de conhecimento guarda os nomes usados nos laudos, a unidade, a faixa de referência, os
        limites críticos e uma explicação em linguagem simples. Clique em um exame.
      </Header>
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
          {MARKERS.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setM(i)}
                aria-pressed={m === i}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  m === i ? "border-navy-800 bg-navy-800 font-semibold text-white" : "border-slate-200 text-slate-700 hover:border-sky-ai hover:bg-sky-50"
                }`}
              >
                {x.name}
              </button>
            </li>
          ))}
        </ul>
        <div key={mk.id} className="min-w-0 animate-[fadein_.2s_ease-out_both]">
          <p className="text-xl font-bold text-navy-950">{mk.name}</p>
          <p className="mt-1 text-slate-600">É a {mk.plain}.</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Também escrito como</dt>
              <dd className="mt-1 text-slate-800">{mk.aliases.join(" · ")}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Referência</dt>
              <dd className="mt-1 text-slate-800">{formatRef(mk)}</dd>
            </div>
          </dl>
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Como o valor é classificado</p>
          <Faixas critLo={critLo} refLo={refLo} refHi={refHi} critHi={critHi} unit={mk.unit} />
          {critLo == null && critHi == null && (
            <p className="mt-2 text-xs text-slate-500">Sem limite crítico na base: o máximo para este exame é Atenção.</p>
          )}
        </div>
      </div>
    </>
  );
}

// Faixas em ordem (fora de escala): crítico | atenção | normal | atenção | crítico.
function Faixas({ critLo, refLo, refHi, critHi, unit }) {
  const zonas = [];
  if (critLo != null) zonas.push({ level: "vermelho", text: `abaixo de ${fmtLimite(critLo, unit)}` });
  if (refLo != null) zonas.push({ level: "amarelo", text: `abaixo de ${fmtLimite(refLo, unit)}` });
  zonas.push({
    level: "verde",
    text: refLo == null ? `até ${fmtLimite(refHi, unit)}` : refHi == null ? `a partir de ${fmtLimite(refLo, unit)}` : `${formatValue(refLo)} a ${fmtLimite(refHi, unit)}`,
  });
  if (refHi != null) zonas.push({ level: "amarelo", text: `acima de ${fmtLimite(refHi, unit)}` });
  if (critHi != null) zonas.push({ level: "vermelho", text: `acima de ${fmtLimite(critHi, unit)}` });
  const bar = { verde: "bg-ok", amarelo: "bg-warn", vermelho: "bg-crit" };
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {zonas.map((z, i) => (
          <span key={i} className={`flex-1 ${bar[z.level]}`} />
        ))}
      </div>
      <ul className="mt-2 grid gap-1.5 text-xs" style={{ gridTemplateColumns: `repeat(${zonas.length}, minmax(0, 1fr))` }}>
        {zonas.map((z, i) => (
          <li key={i} className="flex flex-col items-start gap-1">
            <RiskBadge level={z.level} />
            <span className="text-slate-600">{z.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------- 3 níveis ---------------------------- */

function PainelNiveis() {
  return (
    <>
      <Header title="Os três níveis no dataset">
        O gerador equilibra os três níveis para que nenhum fique sub-representado no treino. Abaixo, quantos laudos há de
        cada um e um exemplo real.
      </Header>
      <div className="grid gap-4 md:grid-cols-3">
        {LEVEL_ORDER.map((l) => (
          <div key={l} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-2">
              <RiskBadge level={l} size="lg" />
              <span className="text-sm tabular-nums text-slate-500">
                <strong className="text-navy-950">{DATASET.risco[l]}</strong> laudos
              </span>
            </div>
            <p className="text-sm text-slate-600">{NIVEIS[l].regra}</p>
            <p className="mt-auto rounded-lg bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700">{NIVEIS[l].exemplo}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Os três exemplos são do mesmo laudo real do dataset (L0018). Como a hemoglobina é crítica, o laudo inteiro é{" "}
        <strong className="text-red-700">Crítico</strong>.{" "}
        <a href="#simulador" className="font-semibold text-sky-700 hover:underline">
          Testar no simulador →
        </a>
      </p>
    </>
  );
}

"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import RiskBadge from "./RiskBadge";
import {
  AlertIcon,
  BrainIcon,
  CheckIcon,
  DatabaseIcon,
  FileIcon,
  NurseIcon,
  PencilIcon,
  ShieldIcon,
  SirenIcon,
} from "./Icons";
import { analyzeReport, formatRef, formatValue, SAMPLE_REPORTS } from "../lib/triage";
import { analyzeReportRemote, apiEnabled } from "../lib/api";

// Nível de cada exemplo calculado pelo próprio motor, para nunca divergir do resultado.
const SAMPLE_LEVELS = Object.fromEntries(
  SAMPLE_REPORTS.map((s) => [s.id, analyzeReport(s.text).level])
);

const STEPS = [
  "Extraindo marcadores e valores de referência…",
  "Classificando o nível de risco…",
  "Consultando diretrizes (RAG) e gerando a mensagem…",
];

const nowLabel = () =>
  new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

// Fila inicial da demonstração: laudos "recebidos hoje" com risco moderado/crítico.
function seedQueue() {
  const seeds = [
    { patient: "Carlos Pereira", time: "07:12", text: "HEMOGRAMA\nHemoglobina: 11,1 g/dL\nLeucócitos: 12.400 /mm³\nPlaquetas: 210.000 /mm³" },
    { patient: "Luiza Martins", time: "07:48", text: "ELETRÓLITOS\nPotássio: 6,6 mEq/L\nSódio: 138 mEq/L\nCreatinina: 2,1 mg/dL" },
    { patient: "Roberto Lima", time: "08:05", text: "PERFIL LIPÍDICO\nColesterol total: 248 mg/dL\nTriglicerídeos: 190 mg/dL" },
    { patient: "Fernanda Costa", time: "08:31", text: "GLICEMIA\nGlicose: 92 mg/dL\nTSH: 1,8 µUI/mL" },
  ];
  return seeds.map((s, i) => {
    const r = analyzeReport(s.text, s.patient);
    return {
      id: `seed-${i}`,
      patient: s.patient,
      date: `Hoje, ${s.time}`,
      examType: r.examType,
      level: r.level,
      message: r.message,
      status: r.level === "verde" ? "auto" : "pendente",
    };
  });
}

export default function Simulator() {
  const [tab, setTab] = useState("paciente");
  const [queue, setQueue] = useState(seedQueue);

  // Links "#simulador" e "#painel" (navbar e hero) abrem a aba certa.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#painel") setTab("enfermagem");
      else if (window.location.hash === "#simulador") setTab("paciente");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const selectTab = (t) => {
    setTab(t);
    history.replaceState(null, "", t === "enfermagem" ? "#painel" : "#simulador");
  };

  const addToQueue = (entry) => setQueue((q) => [entry, ...q]);
  const updateEntry = (id, patch) =>
    setQueue((q) => q.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const pending = queue.filter((e) => e.status === "pendente").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div role="tablist" className="flex border-b border-slate-200 bg-slate-50">
        <TabButton active={tab === "paciente"} onClick={() => selectTab("paciente")} icon={FileIcon} hint="processa o laudo e mostra a mensagem">
          Visão do Paciente
        </TabButton>
        <TabButton
          active={tab === "enfermagem"}
          onClick={() => selectTab("enfermagem")}
          icon={NurseIcon}
          hint="revisa os casos alterados"
        >
          Enfermagem / Recepção
          {pending > 0 && (
            <span className="ml-2 rounded-full bg-crit px-2 py-0.5 text-xs font-bold text-white">{pending}</span>
          )}
        </TabButton>
      </div>

      <div className="p-4 sm:p-6">
        {/* As duas abas ficam montadas: trocar de aba não perde o processamento nem os rascunhos. */}
        <div hidden={tab !== "paciente"}>
          <PatientView onProcessed={addToQueue} onOpenPanel={() => selectTab("enfermagem")} />
        </div>
        <div hidden={tab !== "enfermagem"}>
          <NurseView queue={queue} onUpdate={updateEntry} />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, hint, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition-colors sm:text-base ${
        active
          ? "border-mint bg-white text-navy-950"
          : "border-transparent text-slate-500 hover:bg-white/60 hover:text-navy-950"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span className="flex items-center">{children}</span>
        {hint && <span className="mt-0.5 hidden text-xs font-normal text-slate-500 sm:block">{hint}</span>}
      </span>
    </button>
  );
}

/* ------------------------------ Aba Paciente ------------------------------ */

function PatientView({ onProcessed, onOpenPanel }) {
  const [patient, setPatient] = useState("");
  const [text, setText] = useState("");
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const timers = useRef([]);
  // Identifica o processamento atual; respostas de execuções canceladas são ignoradas.
  const runId = useRef(0);
  const output = useRef(null);

  useEffect(
    () => () => {
      runId.current++;
      timers.current.forEach(clearTimeout);
    },
    []
  );

  // No celular o resultado fica abaixo do formulário: rola até ele quando ficaria fora de vista.
  useEffect(() => {
    if (!result || !output.current) return;
    if (output.current.getBoundingClientRect().top > window.innerHeight * 0.5) {
      output.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const cancelRun = () => {
    runId.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(-1);
  };

  // Carregar outro exemplo cancela um processamento em andamento.
  const loadSample = (s) => {
    cancelRun();
    setPatient(s.patient);
    setText(s.text);
    setResult(null);
    setError("");
  };

  // Usa a API (parser + regras + LLM) quando configurada; o motor local é a reserva.
  const runEngine = async () => {
    const local = analyzeReport(text, patient);
    if (!apiEnabled) return local && { ...local, engine: "local" };
    try {
      return await analyzeReportRemote(text, patient);
    } catch (err) {
      console.warn("API de triagem indisponível, usando o motor local.", err);
      return local && { ...local, engine: "local-fallback" };
    }
  };

  const process = async () => {
    setError("");
    setResult(null);
    cancelRun();
    const id = runId.current;
    setStep(0);
    timers.current = [setTimeout(() => setStep(1), 500), setTimeout(() => setStep(2), 1000)];

    // A animação dura pelo menos 1,6 s, mesmo que a resposta chegue antes.
    const [r] = await Promise.all([runEngine(), new Promise((ok) => setTimeout(ok, 1600))]);
    if (id !== runId.current) return;

    setStep(-1);
    if (!r) {
      setError("Nenhum marcador reconhecido. Cole um laudo com exames como hemoglobina, glicose, plaquetas ou potássio, ou use um exemplo.");
      return;
    }
    setResult(r);
    onProcessed({
      id: `p-${id}`,
      patient: patient.trim() || "Paciente (simulação)",
      date: nowLabel(),
      examType: r.examType,
      level: r.level,
      message: r.message,
      status: r.level === "verde" ? "auto" : "pendente",
      isNew: true,
    });
  };

  const busy = step >= 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)]">
      {/* Entrada */}
      <div className="flex flex-col gap-3">
        <div>
          <StepLabel n={1} hint="ou cole o texto de um laudo no campo abaixo">
            Escolha um laudo de exemplo
          </StepLabel>
          <div className="flex flex-col gap-2">
            {SAMPLE_REPORTS.map((s) => {
              const selected = s.text === text;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadSample(s)}
                  aria-pressed={selected}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left text-sm font-medium transition ${
                    selected
                      ? "border-sky-ai bg-sky-50 text-navy-950 ring-1 ring-sky-ai"
                      : "border-slate-200 text-slate-700 hover:border-sky-ai hover:bg-sky-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {selected && <CheckIcon className="h-4 w-4 shrink-0 text-sky-ai" />}
                    {s.label}
                  </span>
                  <RiskBadge level={SAMPLE_LEVELS[s.id]} />
                </button>
              );
            })}
          </div>
        </div>

        <StepLabel n={2} hint="o laudo pode ser editado à vontade">
          Confira os dados
        </StepLabel>
        <label className="-mt-2 flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          <span>
            Nome do paciente <span className="font-normal text-slate-400">(opcional, usado só na saudação)</span>
          </span>
          <input
            value={patient}
            onChange={(e) => setPatient(e.target.value)}
            placeholder="Ex.: Ana Souza"
            className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-navy-950 outline-none focus:border-sky-ai focus:ring-2 focus:ring-sky-ai/30"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          Texto do laudo
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={"Cole aqui o texto do laudo, por exemplo:\nHemoglobina: 13,5 g/dL\nGlicose: 92 mg/dL"}
            className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs font-normal leading-relaxed text-navy-950 outline-none focus:border-sky-ai focus:ring-2 focus:ring-sky-ai/30"
          />
        </label>

        <StepLabel n={3}>Processe o laudo</StepLabel>
        <button
          type="button"
          onClick={process}
          disabled={busy || !text.trim()}
          className={`flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-white shadow-lg shadow-mint/30 transition disabled:cursor-not-allowed ${
            busy ? "bg-emerald-600" : "bg-mint hover:bg-emerald-600 disabled:opacity-50"
          }`}
        >
          {busy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <BrainIcon className="h-5 w-5" />
          )}
          {busy ? "Processando…" : "Processar Laudo com IA"}
        </button>
        {!text.trim() && !busy && (
          <p className="-mt-2 text-center text-xs text-slate-500">Escolha um exemplo no passo 1 para liberar o botão.</p>
        )}
        {error &&<p className="rounded-lg bg-warn/10 px-3 py-2 text-sm text-amber-800">{error}</p>}
      </div>

      {/* Saída */}
      <div ref={output} className="min-w-0 scroll-mt-20">
        {busy && <Processing step={step} />}
        {!busy && !result && <EmptyResult />}
        {!busy && result && <ResultCard result={result} onOpenPanel={onOpenPanel} />}
      </div>
    </div>
  );
}

function StepLabel({ n, hint, children }) {
  return (
    <div className="mb-2 flex items-start gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">{n}</span>
      <p className="text-sm font-semibold leading-6 text-navy-950">
        {children}
        {hint && <span className="block text-xs font-normal leading-4 text-slate-500">{hint}</span>}
      </p>
    </div>
  );
}

const PREVIEW = [
  { icon: ShieldIcon, title: "Nível de risco", text: "Verde, amarelo ou vermelho, com alerta à enfermagem nos casos críticos." },
  { icon: BrainIcon, title: "Mensagem para o paciente", text: "Explicação em linguagem simples, sem diagnóstico nem prescrição." },
  { icon: FileIcon, title: "Dados extraídos", text: "Cada exame com o valor encontrado e a faixa de referência." },
];

function EmptyResult() {
  return (
    <div className="flex h-full min-h-72 flex-col justify-center gap-6 rounded-xl border-2 border-dashed border-slate-200 p-6 sm:p-8">
      <div>
        <p className="font-semibold text-navy-950">O resultado da triagem aparece aqui</p>
        <p className="mt-1 text-sm text-slate-500">
          Escolha um exemplo ou cole um laudo e clique em <strong className="text-slate-700">Processar Laudo com IA</strong>.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {PREVIEW.map((p) => (
          <li key={p.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <p.icon className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-slate-700">{p.title}</p>
              <p className="text-slate-500">{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Processing({ step }) {
  return (
    <div className="flex h-full min-h-72 flex-col justify-center gap-4 rounded-xl bg-slate-50 p-8">
      {STEPS.map((s, i) => (
        <div key={s} className={`flex items-center gap-3 text-sm transition ${i <= step ? "text-navy-950" : "text-slate-300"}`}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              i < step ? "bg-mint text-white" : i === step ? "animate-pulse bg-sky-ai text-white" : "bg-slate-200"
            }`}
          >
            {i < step ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
          </span>
          {s}
        </div>
      ))}
    </div>
  );
}

const ENGINES = {
  "api-llm": { text: "API CareSync NLP · mensagem gerada por LLM", dot: "bg-mint" },
  "api-ptt5": { text: "API CareSync NLP · mensagem gerada pelo modelo PTT5 treinado", dot: "bg-mint" },
  api: { text: "API CareSync NLP · texto padrão (LLM indisponível)", dot: "bg-sky-ai" },
  local: { text: "Simulação no navegador", dot: "bg-slate-400" },
  "local-fallback": { text: "API indisponível · simulação no navegador", dot: "bg-warn" },
};

const BANNER = {
  vermelho: {
    icon: SirenIcon,
    iconCls: "animate-pulse",
    box: "border-2 border-crit bg-crit text-white shadow-lg shadow-crit/30",
    sub: "text-red-50",
    link: "text-white",
    title: "Alerta de emergência detectado",
    text: "Notificação encaminhada automaticamente para a fila da enfermagem.",
  },
  amarelo: {
    icon: AlertIcon,
    iconCls: "text-warn",
    box: "border border-warn/50 bg-warn/10 text-amber-900",
    sub: "text-amber-900",
    link: "text-amber-800",
    title: "Alterações detectadas",
    text: "Mensagem retida para validação da enfermagem antes do envio.",
  },
  verde: {
    icon: CheckIcon,
    iconCls: "text-ok",
    box: "border border-ok/40 bg-ok/10 text-green-900",
    sub: "text-green-900",
    link: "text-green-800",
    title: "Exame sem alterações",
    text: "Mensagem liberada para envio automático ao paciente.",
  },
};

function ResultCard({ result, onOpenPanel }) {
  const { level, items, message, sources, guardrails } = result;
  const engine = ENGINES[result.engine] ?? ENGINES.local;
  const [view, setView] = useState("mensagem");
  return (
    <div className="flex animate-[fadein_.35s_ease-out_both] flex-col gap-3">
      {/* Aviso + nível de risco em um só bloco */}
      <div
        role={level === "vermelho" ? "alert" : undefined}
        className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-2.5 ${BANNER[level].box}`}
      >
        {(() => {
          const Icon = BANNER[level].icon;
          return <Icon className={`h-6 w-6 shrink-0 ${BANNER[level].iconCls}`} />;
        })()}
        <div className="min-w-0 flex-1">
          <p className="font-bold">{BANNER[level].title}</p>
          <p className={`text-sm ${BANNER[level].sub}`}>{BANNER[level].text}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-white">
            <RiskBadge level={level} size="lg" />
          </span>
          {level !== "verde" && (
            <button type="button" onClick={onOpenPanel} className={`text-xs font-semibold hover:underline ${BANNER[level].link}`}>
              Ver na fila da enfermagem →
            </button>
          )}
        </div>
      </div>

      {/* Abas: mantêm o resultado inteiro dentro de uma tela */}
      <div role="tablist" aria-label="Detalhes do resultado" className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
        {[
          ["mensagem", "Mensagem ao paciente"],
          ["dados", `Dados extraídos (${items.length})`],
          ["ia", "RAG e guardrails"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`flex-1 rounded-md px-2 py-1.5 transition ${
              view === id ? "bg-white text-navy-950 shadow-sm" : "text-slate-500 hover:text-navy-950"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "mensagem" && (
      <div>
        <div className="whitespace-pre-line rounded-xl rounded-tl-none border border-slate-200 bg-[#F0FDF4] px-4 py-3 text-sm leading-normal text-slate-800">
          {message}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${engine.dot}`} />
          {engine.text}
        </p>
      </div>
      )}

      {view === "dados" && (
      <div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Exame</th>
                <th className="px-4 py-2.5">Valor Encontrado</th>
                <th className="px-4 py-2.5">Referência</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.marker.id}>
                  <td className="px-4 py-2.5 font-medium text-navy-950">{i.marker.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                    {formatValue(i.value)} {i.marker.unit}
                    {i.direction && <span className="ml-1 text-slate-400">{i.direction === "low" ? "↓" : "↑"}</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{formatRef(i.marker)}</td>
                  <td className="px-4 py-2.5">
                    <RiskBadge level={i.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {view === "ia" && (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-slate-700">
            <DatabaseIcon className="h-4 w-4 text-sky-ai" /> Trechos recuperados (RAG)
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-slate-600">
            {sources.map((s) => (
              <li key={s} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs">{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-slate-700">
            <ShieldIcon className="h-4 w-4 text-mint" /> Guardrails aplicados
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-slate-600">
            {guardrails.map((g) => (
              <li key={g} className="flex gap-2 text-xs">
                <CheckIcon className="h-4 w-4 shrink-0 text-mint" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
      )}
    </div>
  );
}

/* ---------------------------- Aba Enfermagem ----------------------------- */

const STATUS = {
  pendente: { text: "Aguardando validação", cls: "bg-slate-100 text-slate-600" },
  auto: { text: "Enviado automaticamente", cls: "bg-ok/10 text-green-700" },
  enviado: { text: "Aprovado e enviado", cls: "bg-sky-ai/10 text-sky-700" },
  emergencia: { text: "Protocolo de emergência acionado", cls: "bg-crit/10 text-red-700" },
};

function NurseView({ queue, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [viewing, setViewing] = useState(null);

  const counts = {
    vermelho: queue.filter((e) => e.level === "vermelho" && e.status === "pendente").length,
    amarelo: queue.filter((e) => e.level === "amarelo" && e.status === "pendente").length,
    concluidos: queue.filter((e) => e.status !== "pendente").length,
  };

  const startEdit = (e) => {
    setEditing(e.id);
    setViewing(null);
    setDraft(e.message);
  };

  // Só fecha o editor (e salva o rascunho) quando a ação é na própria linha em edição.
  const resolve = (e, status) => {
    const isEditingRow = editing === e.id;
    onUpdate(e.id, { status, ...(isEditingRow ? { message: draft } : {}) });
    if (isEditingRow) setEditing(null);
  };
  const approve = (e) => resolve(e, "enviado");
  const emergency = (e) => resolve(e, "emergencia");

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-sky-ai/30 bg-sky-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-navy-950">Esta é a tela da equipe de saúde.</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          <li className="flex items-start gap-2">
            <RiskBadge level="verde" />
            <span>vai direto para o paciente, sem revisão.</span>
          </li>
          <li className="flex items-start gap-2">
            <RiskBadge level="amarelo" />
            <span>espera aqui até alguém aprovar ou editar a mensagem.</span>
          </li>
          <li className="flex items-start gap-2">
            <RiskBadge level="vermelho" />
            <span>espera aqui e pode acionar o protocolo de emergência.</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Dica: processe um laudo na aba Visão do Paciente. Se ele tiver alteração, aparece nesta fila com a etiqueta{" "}
          <span className="rounded bg-sky-ai px-1 py-0.5 text-[0.625rem] font-bold text-white">NOVO</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Críticos aguardando revisão" value={counts.vermelho} tone="text-crit" />
        <Stat label="Atenção aguardando revisão" value={counts.amarelo} tone="text-warn" />
        <Stat label="Mensagens já enviadas" value={counts.concluidos} tone="text-mint" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo de Exame</th>
              <th className="px-4 py-3">Nível de Risco</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {queue.map((e) => {
              const isPending = e.status === "pendente";
              const isEditing = editing === e.id;
              const isViewing = viewing === e.id;
              return (
                <Fragment key={e.id}>
                  <tr className={`${e.level === "vermelho" && isPending ? "bg-crit/5" : ""} ${e.isNew ? "animate-[fadein_.4s_ease-out_both]" : ""}`}>
                    <td className="px-4 py-3 font-medium text-navy-950">
                      {e.patient}
                      {e.isNew && <span className="ml-2 rounded bg-sky-ai px-1.5 py-0.5 text-[0.625rem] font-bold text-white">NOVO</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{e.date}</td>
                    <td className="px-4 py-3 text-slate-700">{e.examType}</td>
                    <td className="px-4 py-3">
                      <RiskBadge level={e.level} />
                    </td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <div className="flex flex-wrap gap-2">
                          <ActionButton onClick={() => approve(e)} className="bg-mint text-white hover:bg-emerald-600" icon={CheckIcon}>
                            Aprovar e Enviar
                          </ActionButton>
                          <ActionButton
                            onClick={() => (isEditing ? setEditing(null) : startEdit(e))}
                            className="border border-slate-300 text-slate-700 hover:bg-slate-100"
                            icon={PencilIcon}
                          >
                            {isEditing ? "Fechar edição" : "Editar Texto"}
                          </ActionButton>
                          {e.level === "vermelho" && (
                            <ActionButton onClick={() => emergency(e)} className="bg-crit text-white hover:bg-red-600" icon={SirenIcon}>
                              Acionar Protocolo de Emergência
                            </ActionButton>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[e.status].cls}`}>
                            {STATUS[e.status].text}
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewing(isViewing ? null : e.id)}
                            className="text-xs font-semibold text-sky-700 hover:underline"
                          >
                            {isViewing ? "Ocultar mensagem" : "Ver mensagem"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isEditing && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Revisão da mensagem antes do envio
                        </label>
                        <textarea
                          value={draft}
                          onChange={(ev) => setDraft(ev.target.value)}
                          rows={9}
                          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm leading-relaxed outline-none focus:border-sky-ai focus:ring-2 focus:ring-sky-ai/30"
                        />
                        <div className="mt-2 flex justify-end">
                          <ActionButton onClick={() => approve(e)} className="bg-mint text-white hover:bg-emerald-600" icon={CheckIcon}>
                            Salvar, aprovar e enviar
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  )}
                  {isViewing && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="whitespace-pre-line px-4 py-4 text-sm leading-relaxed text-slate-700">
                        {e.message}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Pacientes e laudos fictícios, apenas para demonstração.
      </p>
    </div>
  );
}


function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3">
      <p className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function ActionButton({ onClick, className, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

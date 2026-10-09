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
        <TabButton active={tab === "paciente"} onClick={() => selectTab("paciente")} icon={FileIcon}>
          Visão do Paciente
        </TabButton>
        <TabButton active={tab === "enfermagem"} onClick={() => selectTab("enfermagem")} icon={NurseIcon}>
          Enfermagem / Recepção
          {pending > 0 && (
            <span className="ml-2 rounded-full bg-crit px-2 py-0.5 text-xs font-bold text-white">{pending}</span>
          )}
        </TabButton>
      </div>

      <div className="p-4 sm:p-8">
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

function TabButton({ active, onClick, icon: Icon, children }) {
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
      <span className="flex items-center">{children}</span>
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

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const cancelRun = () => {
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

  const process = () => {
    setError("");
    setResult(null);
    const r = analyzeReport(text, patient);
    if (!r) {
      setError("Nenhum marcador reconhecido. Cole um laudo com exames como hemoglobina, glicose, plaquetas ou potássio, ou use um exemplo.");
      return;
    }
    cancelRun();
    setStep(0);
    timers.current = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1000),
      setTimeout(() => {
        setStep(-1);
        setResult(r);
        onProcessed({
          id: `p-${Date.now()}`,
          patient: patient.trim() || "Paciente (simulação)",
          date: nowLabel(),
          examType: r.examType,
          level: r.level,
          message: r.message,
          status: r.level === "verde" ? "auto" : "pendente",
          isNew: true,
        });
      }, 1600),
    ];
  };

  const busy = step >= 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Entrada */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Exames de exemplo</p>
          <div className="flex flex-col gap-2">
            {SAMPLE_REPORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s)}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-sky-ai hover:bg-sky-50"
              >
                {s.label}
                <RiskBadge level={SAMPLE_LEVELS[s.id]} />
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          Nome do paciente
          <input
            value={patient}
            onChange={(e) => setPatient(e.target.value)}
            placeholder="Ex.: Ana Souza"
            className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-navy-950 outline-none focus:border-sky-ai focus:ring-2 focus:ring-sky-ai/30"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          Laudo técnico
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={"Cole aqui o texto do laudo, por exemplo:\nHemoglobina: 13,5 g/dL\nGlicose: 92 mg/dL"}
            className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs font-normal leading-relaxed text-navy-950 outline-none focus:border-sky-ai focus:ring-2 focus:ring-sky-ai/30"
          />
        </label>

        <button
          type="button"
          onClick={process}
          disabled={busy || !text.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 font-semibold text-white shadow-lg shadow-mint/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BrainIcon className="h-5 w-5" />
          {busy ? "Processando…" : "Processar Laudo com IA"}
        </button>
        {error && <p className="rounded-lg bg-warn/10 px-3 py-2 text-sm text-amber-800">{error}</p>}
      </div>

      {/* Saída */}
      <div className="min-w-0">
        {busy && <Processing step={step} />}
        {!busy && !result && (
          <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
            <FileIcon className="h-10 w-10" />
            <p className="max-w-xs text-sm">
              Carregue um exemplo ou cole um laudo e clique em <strong>Processar Laudo com IA</strong> para ver a triagem.
            </p>
          </div>
        )}
        {!busy && result && <ResultCard result={result} onOpenPanel={onOpenPanel} />}
      </div>
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

function ResultCard({ result, onOpenPanel }) {
  const { level, items, message, sources, guardrails } = result;
  return (
    <div className="flex animate-[fadein_.35s_ease-out_both] flex-col gap-5">
      {level === "vermelho" && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border-2 border-crit bg-crit px-4 py-3 text-white shadow-lg shadow-crit/30">
          <SirenIcon className="mt-0.5 h-6 w-6 shrink-0 animate-pulse" />
          <div>
            <p className="font-bold">Alerta de Emergência Detectado</p>
            <p className="text-sm text-red-50">Notificação encaminhada automaticamente para a fila da enfermagem.</p>
          </div>
        </div>
      )}
      {level === "amarelo" && (
        <div className="flex items-start gap-3 rounded-xl border border-warn/50 bg-warn/10 px-4 py-3 text-amber-900">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <p className="text-sm">
            <strong>Alterações detectadas.</strong> A mensagem foi retida para validação da enfermagem antes do envio ao paciente.
          </p>
        </div>
      )}
      {level === "verde" && (
        <div className="flex items-start gap-3 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-green-900">
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
          <p className="text-sm">
            <strong>Exame sem alterações.</strong> Mensagem liberada para envio automático ao paciente.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-500">Nível de risco</span>
          <RiskBadge level={level} size="lg" />
        </div>
        {level !== "verde" && (
          <button type="button" onClick={onOpenPanel} className="text-sm font-semibold text-sky-700 hover:underline">
            Ver na fila da enfermagem →
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Mensagem gerada pela IA</p>
        <div className="whitespace-pre-line rounded-xl rounded-tl-none border border-slate-200 bg-[#F0FDF4] p-4 text-[15px] leading-relaxed text-slate-800">
          {message}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Dados extraídos do laudo</p>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <details className="rounded-xl border border-slate-200 p-4 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-slate-700">
            <DatabaseIcon className="h-4 w-4 text-sky-ai" /> Trechos recuperados (RAG)
          </summary>
          <ul className="mt-3 flex flex-col gap-2 text-slate-600">
            {sources.map((s) => (
              <li key={s} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs">{s}</li>
            ))}
          </ul>
        </details>
        <details className="rounded-xl border border-slate-200 p-4 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-slate-700">
            <ShieldIcon className="h-4 w-4 text-mint" /> Guardrails aplicados
          </summary>
          <ul className="mt-3 flex flex-col gap-2 text-slate-600">
            {guardrails.map((g) => (
              <li key={g} className="flex gap-2 text-xs">
                <CheckIcon className="h-4 w-4 shrink-0 text-mint" />
                {g}
              </li>
            ))}
          </ul>
        </details>
      </div>
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Críticos aguardando" value={counts.vermelho} tone="text-crit" />
        <Stat label="Atenção aguardando" value={counts.amarelo} tone="text-warn" />
        <Stat label="Mensagens concluídas" value={counts.concluidos} tone="text-mint" />
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
                      {e.isNew && <span className="ml-2 rounded bg-sky-ai px-1.5 py-0.5 text-[10px] font-bold text-white">NOVO</span>}
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
        Dados fictícios para demonstração. Exames normais são enviados automaticamente; casos de atenção e críticos só chegam ao paciente após validação humana.
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

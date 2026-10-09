"use client";

import { useState } from "react";
import RiskBadge from "./RiskBadge";
import { LEVEL_ORDER } from "../lib/triage";
import { PulseIcon } from "./Icons";

const DEMOS = {
  verde: {
    raw: "Hemoglobina: 14,2 g/dL (VR 12,0–17,5) · Glicose: 88 mg/dL (VR 70–99)",
    reply: [
      "Olá, Ana! Seus exames chegaram e temos uma boa notícia: está tudo dentro do esperado. 😊",
      "A hemoglobina, que leva oxigênio pelo corpo, e o açúcar no sangue estão normais. Leve os resultados na sua próxima consulta de rotina.",
    ],
  },
  amarelo: {
    raw: "Glicose: 118 mg/dL (VR 70–99) · Colesterol total: 232 mg/dL (VR < 190)",
    reply: [
      "Olá, Maria! Alguns valores merecem atenção do seu médico. Isso é comum e não é uma emergência.",
      "O açúcar e o colesterol estão um pouco acima do esperado. Recomendamos agendar uma consulta de retorno nos próximos dias.",
    ],
  },
  vermelho: {
    raw: "Hemoglobina: 6,4 g/dL (VR 12,0–17,5) · Hematócrito: 20 % (VR 36–52)",
    reply: [
      "Olá, José! Um dos seus resultados precisa de avaliação médica rápida. Nossa equipe já foi avisada e vai falar com você.",
      "Por favor, procure atendimento ainda hoje. Se sentir falta de ar ou fraqueza intensa, ligue 192 (SAMU).",
    ],
  },
};

export default function HeroMockup() {
  const [level, setLevel] = useState("verde");
  const demo = DEMOS[level];

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-4 flex justify-center gap-2" role="group" aria-label="Exemplos de nível de risco">
        {LEVEL_ORDER.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            aria-pressed={level === l}
            className={`rounded-full transition ${level === l ? "scale-105 shadow-md" : "opacity-60 hover:opacity-100"}`}
          >
            <RiskBadge level={l} />
          </button>
        ))}
      </div>

      <div className="rounded-[2.5rem] border-[10px] border-navy-950 bg-navy-950 shadow-2xl shadow-navy-800/30">
        <div className="overflow-hidden rounded-[1.8rem] bg-[#ECE5DD]">
          <div className="flex items-center gap-3 bg-navy-800 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint">
              <PulseIcon className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Laboratório · Resultados</p>
              <p className="text-[11px] text-sky-200">mensagem gerada pela IA</p>
            </div>
          </div>

          <div className="flex min-h-[22rem] flex-col gap-3 p-4 text-[13px] leading-snug">
            <div className="self-center rounded-md bg-white/70 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              LAUDO TÉCNICO RECEBIDO
            </div>
            <p className="rounded-lg bg-white/80 px-3 py-2 font-mono text-[11px] text-slate-500">{demo.raw}</p>
            {demo.reply.map((t, i) => (
              <p
                key={level + i}
                className="max-w-[90%] animate-[fadein_.4s_ease-out_both] rounded-lg rounded-tl-none bg-white px-3 py-2 text-slate-800 shadow-sm"
                style={{ animationDelay: `${i * 0.25}s` }}
              >
                {t}
              </p>
            ))}
            <div className="mt-auto flex items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 text-[11px] text-slate-600">
              <span>Triagem automática</span>
              <RiskBadge level={level} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

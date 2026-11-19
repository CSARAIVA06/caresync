"use client";

import { useRef, useState } from "react";
import { ArrowIcon, BrainIcon, DatabaseIcon, FileIcon, NurseIcon, PulseIcon, ShieldIcon } from "./Icons";

// Cada etapa descreve o que o caresync-nlp-core faz de fato (arquivos citados em "codigo").
const ETAPAS = [
  {
    icon: FileIcon,
    title: "Laudo",
    sub: "texto do laudo",
    resumo: "A entrada é o texto do laudo, do jeito que o laboratório entrega: sem formulário e sem campos fixos.",
    pontos: [
      "O texto é enviado para a API (até 10.000 caracteres), em qualquer um dos formatos de laudo.",
      "O nome do paciente vai em um campo separado e só é usado na saudação. Ele nunca é enviado ao modelo de linguagem.",
      "Leitura de PDF escaneado (OCR) ainda não faz parte do protótipo.",
    ],
    exemplo: { entrada: "HEMOGRAMA COMPLETO\nHemoglobina: 6,4 g/dL   (VR: 12,0 a 17,5)\nPlaquetas: 98.000 /mm³ (VR: 150.000 a 450.000)" },
    codigo: "POST /api/v1/triagem · src/main.py",
  },
  {
    icon: PulseIcon,
    title: "Parsing / NER",
    sub: "exames, valores e referências",
    resumo: "Encontra no texto cada exame, o valor medido, a unidade e a faixa de referência informada pelo laboratório.",
    pontos: [
      "Entende números no formato brasileiro: 13,5 · 250.000 · 250 mil.",
      "Ignora o que não é resultado, como datas, \"hemoglobina glicada\" e \"colesterol HDL\".",
      "Há duas versões: padrões de texto (regex) e o modelo BERTimbau treinado para reconhecer entidades (NER). Em formatos de laudo nunca vistos, o NER extrai 95,7% (F1) contra 0,8% do regex.",
      "Se o laudo não traz a referência, usa a da base de conhecimento.",
    ],
    exemplo: {
      entrada: "Hemoglobina: 6,4 g/dL   (VR: 12,0 a 17,5)",
      saida: "exame: Hemoglobina\nvalor: 6,4  unidade: g/dL\nreferência: 12 a 17,5 (do laudo)",
    },
    codigo: "src/parser.py (regex) · src/ner.py (BERTimbau)",
  },
  {
    icon: ShieldIcon,
    title: "Motor de Regras",
    sub: "Verde · Amarelo · Vermelho",
    resumo: "Decide o nível de risco comparando cada valor com limites. É matemática determinística: a IA nunca decide o risco.",
    pontos: [
      "Fora da faixa de referência → Atenção (amarelo).",
      "Além do limite crítico (valor de pânico) → Crítico (vermelho). Esses limites vêm sempre da base de conhecimento, nunca do laudo.",
      "O nível do laudo é o do exame mais grave.",
      "A mesma entrada sempre gera o mesmo resultado, o que facilita auditar cada decisão.",
    ],
    exemplo: {
      entrada: "Hemoglobina 6,4 g/dL\nreferência 12 a 17,5 · limite crítico < 7",
      saida: "6,4 < 7  →  CRÍTICO (vermelho)",
    },
    codigo: "src/rules.py",
  },
  {
    icon: DatabaseIcon,
    title: "Recuperação (RAG)",
    sub: "base de conhecimento dos 12 marcadores",
    resumo: "Busca, para cada exame encontrado, o conteúdo curado da base de conhecimento. Isso dá ao gerador de texto fatos confiáveis em vez de deixá-lo inventar.",
    pontos: [
      "A base cobre 12 marcadores: o que cada exame mede e o que significa estar abaixo ou acima, em linguagem simples.",
      "A busca é direta pelo exame identificado, não por similaridade: o conteúdo recuperado é sempre o do exame certo.",
      "Valores, referências e status entram no contexto já calculados pelas etapas anteriores.",
    ],
    exemplo: {
      saida: "Hemoglobina: 6,4 g/dL; referência 12 a 17,5 g/dL;\nstatus CRITICO; abaixo da referência.\nO que é: a proteína do sangue que transporta oxigênio…",
    },
    codigo: "src/knowledge_base.py · contexto_rag() em src/llm_service.py",
  },
  {
    icon: BrainIcon,
    title: "Geração do texto",
    sub: "LLM ou PTT5 (seq2seq)",
    resumo: "Um modelo de linguagem transforma o contexto recuperado em uma explicação empática e fácil de entender.",
    pontos: [
      "Usa um LLM na nuvem (Llama 3.3 70B via Groq). Como alternativa, a API aceita o PTT5, um Transformer encoder-decoder (seq2seq) que o projeto pode ajustar com o próprio dataset para rodar localmente, sem enviar dados para fora.",
      "O modelo escreve só a explicação dos exames. A saudação, a orientação de conduta (por exemplo, ligar 192) e o aviso final são textos fixos.",
      "Se o modelo falhar ou estiver indisponível, entra um texto padrão: a triagem nunca deixa de responder.",
    ],
    exemplo: {
      saida: "Hemoglobina: 6,4 g/dL (abaixo da referência de 12 a 17,5 g/dL). É a proteína do sangue que transporta oxigênio pelo corpo…",
    },
    codigo: "src/llm_service.py · src/gerador_local.py (PTT5)",
  },
  {
    icon: ShieldIcon,
    title: "Guardrails",
    sub: "segurança clínica",
    resumo: "Antes de chegar ao paciente, o texto gerado passa por verificações automáticas. Se reprovar, é descartado e trocado pelo texto padrão.",
    pontos: [
      "Bloqueia diagnóstico: frases como \"você tem…\" ou \"diagnóstico de…\".",
      "Bloqueia prescrição: indicar remédio, dose ou suplemento.",
      "Fidelidade numérica: descarta o texto se ele citar um número que não está nos dados do laudo, o que evita valores inventados.",
    ],
    exemplo: {
      entrada: "\"Você tem anemia, tome sulfato ferroso 40 mg.\"",
      saida: "Reprovado (diagnóstico + prescrição) → texto padrão",
    },
    codigo: "viola_guardrails() e fidelidade_numerica() · src/llm_service.py",
  },
  {
    icon: NurseIcon,
    title: "Human-in-the-Loop",
    sub: "validação da enfermagem",
    resumo: "A automação tem um limite claro: só os exames normais saem sem revisão humana.",
    pontos: [
      "Normal → mensagem enviada automaticamente ao paciente.",
      "Atenção e Crítico → entram na fila da enfermagem, que aprova, edita o texto ou aciona o protocolo de emergência.",
      "Isso cobre os erros que o modelo ainda comete (veja a seção Resultados).",
    ],
    link: { href: "#painel", text: "Ver o painel da enfermagem no simulador →" },
    codigo: "Aba Enfermagem / Recepção do simulador",
  },
];

export default function PipelineExplorer() {
  const [sel, setSel] = useState(0);
  const panel = useRef(null);
  const tabs = useRef([]);
  const etapa = ETAPAS[sel];

  const select = (i, { focus = false, scroll = false } = {}) => {
    setSel(i);
    if (focus) tabs.current[i]?.focus();
    // No celular a lista é vertical: leva a explicação para a tela.
    if (scroll && panel.current && panel.current.getBoundingClientRect().top > window.innerHeight * 0.7) {
      panel.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    select((sel + step + ETAPAS.length) % ETAPAS.length, { focus: true });
  };

  return (
    <div className="mt-8">
      <p className="mb-3 text-sm text-slate-500">Clique em cada etapa para ver como ela funciona.</p>
      <ol role="tablist" aria-label="Etapas do pipeline" onKeyDown={onKey} className="flex flex-col items-stretch gap-2 lg:flex-row">
        {ETAPAS.map((b, i) => {
          const active = i === sel;
          return (
            <li key={b.title} role="presentation" className="flex flex-col items-center gap-2 lg:flex-1 lg:flex-row lg:items-stretch">
              <button
                ref={(el) => (tabs.current[i] = el)}
                type="button"
                role="tab"
                id={`etapa-${i}`}
                aria-selected={active}
                aria-controls="etapa-painel"
                tabIndex={active ? 0 : -1}
                onClick={() => select(i, { scroll: true })}
                className={`relative flex w-full flex-col items-center justify-center rounded-xl border px-3 py-4 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ai ${
                  active
                    ? "border-navy-800 bg-navy-800 text-white shadow-lg shadow-navy-800/25"
                    : "border-slate-200 bg-slate-50 text-navy-950 hover:-translate-y-0.5 hover:border-sky-ai hover:bg-white"
                }`}
              >
                <span className={`absolute left-2 top-2 text-[10px] font-bold ${active ? "text-sky-200" : "text-slate-400"}`}>{i + 1}</span>
                <b.icon className={`h-6 w-6 ${active ? "text-sky-200" : "text-navy-800"}`} />
                <span className="mt-2 text-sm font-bold leading-tight">{b.title}</span>
                <span className={`mt-1 text-[11px] leading-tight ${active ? "text-slate-200" : "text-slate-500"}`}>{b.sub}</span>
                {active && (
                  <span className="absolute -bottom-[7px] left-1/2 hidden h-3 w-3 -translate-x-1/2 rotate-45 bg-navy-800 lg:block" />
                )}
              </button>
              {i < ETAPAS.length - 1 && <ArrowIcon className="h-5 w-5 shrink-0 rotate-90 text-slate-400 lg:rotate-0 lg:self-center" />}
            </li>
          );
        })}
      </ol>

      <div
        ref={panel}
        id="etapa-painel"
        role="tabpanel"
        aria-labelledby={`etapa-${sel}`}
        className="mt-5 scroll-mt-24 rounded-xl border border-slate-200 bg-slate-50/60 p-6 sm:p-7"
      >
        <div key={sel} className="grid animate-[fadein_.25s_ease-out_both] gap-6 lg:grid-cols-[3fr_2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-mint">
              Etapa {sel + 1} de {ETAPAS.length}
            </p>
            <h4 className="mt-1 flex items-center gap-2 text-lg font-bold text-navy-950">
              <etapa.icon className="h-5 w-5 text-navy-800" /> {etapa.title}
            </h4>
            <p className="mt-2 leading-relaxed text-slate-700">{etapa.resumo}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {etapa.pontos.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-ai" />
                  {p}
                </li>
              ))}
            </ul>
            {etapa.link && (
              <a href={etapa.link.href} className="mt-4 inline-block text-sm font-semibold text-sky-700 hover:underline">
                {etapa.link.text}
              </a>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            {etapa.exemplo?.entrada && <Example label="Entrada" text={etapa.exemplo.entrada} />}
            {etapa.exemplo?.saida && <Example label="Saída" text={etapa.exemplo.saida} dark />}
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">No código:</span> <code>{etapa.codigo}</code>
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between border-t border-slate-200 pt-4 text-sm font-semibold">
          <button
            type="button"
            onClick={() => select(sel - 1)}
            disabled={sel === 0}
            className="text-slate-600 hover:text-navy-950 disabled:invisible"
          >
            ← {ETAPAS[sel - 1]?.title}
          </button>
          <button
            type="button"
            onClick={() => select(sel + 1)}
            disabled={sel === ETAPAS.length - 1}
            className="text-sky-700 hover:text-navy-950 disabled:invisible"
          >
            {ETAPAS[sel + 1]?.title} →
          </button>
        </div>
      </div>
    </div>
  );
}

function Example({ label, text, dark }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <pre
        className={`overflow-x-auto whitespace-pre-wrap rounded-lg p-3 font-mono text-xs leading-relaxed ${
          dark ? "bg-navy-950 text-slate-100" : "border border-slate-200 bg-white text-slate-700"
        }`}
      >
        {text}
      </pre>
    </div>
  );
}

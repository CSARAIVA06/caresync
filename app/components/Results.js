import { CountUp, GrowBar, InView } from "./Animated";
import DatasetExplorer from "./DatasetExplorer";
import InfoTip from "./InfoTip";
import {
  COLUNAS,
  CRITICOS_COMO_NORMAL,
  DATASET,
  ERROS_POR_FORMATO,
  NER_ENTIDADES,
  SISTEMAS,
} from "../lib/resultados";

// Cores das duas séries (validadas para daltonismo e contraste sobre fundo branco).
const SERIES = [
  { key: "teste", label: "Teste · formatos vistos no treino", color: "#2563eb" },
  { key: "ood", label: "Teste OOD · formatos nunca vistos", color: "#0d9488" },
];

const pct = (v) => `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const NER = SISTEMAS.find((s) => s.destaque);
const REGEX = SISTEMAS.find((s) => s.nome.startsWith("Regex"));
const SVM = SISTEMAS.find((s) => s.nome === "TF-IDF + SVM");
const PERDIDOS_NER = NER.teste.perdidos + NER.ood.perdidos;
const TOTAL_CRITICOS = DATASET.criticos.teste + DATASET.criticos.ood;

export default function Results() {
  return (
    <div className="flex flex-col gap-6">
      {/* Dataset: cada card abre uma demonstração */}
      <DatasetExplorer />

      {/* Destaque: generalização para formatos nunca vistos */}
      <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 p-7 text-white sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-300">Principal resultado</p>
        <h3 className="mt-2 max-w-3xl text-2xl font-bold leading-snug sm:text-3xl">
          Em laudos com formatos que o sistema nunca viu, o modelo treinado continua lendo os exames. O regex, não.
        </h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Compare
            title="Extração dos exames (F1)"
            regex={REGEX.ood.extracao}
            ner={NER.ood.extracao}
          />
          <Compare
            title="Exames críticos detectados (recall)"
            regex={REGEX.ood.recallCritico}
            ner={NER.ood.recallCritico}
          />
        </div>
      </div>

      {/* Gráficos por sistema */}
      <div className="rounded-2xl border border-slate-200 bg-white p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-navy-950">Comparação entre as abordagens</h3>
            <p className="mt-1 max-w-2xl text-slate-600">
              Quatro formas de chegar ao nível de risco, avaliadas nos mesmos laudos de teste.
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm text-slate-600 sm:flex-row sm:gap-5">
            {SERIES.map((se) => (
              <li key={se.key} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: se.color }} />
                {se.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <BarChart title="Acurácia do nível de risco" metric="acuracia" />
          <BarChart title="Recall de exames críticos" metric="recallCritico" />
        </div>
        <p className="mt-8 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          <strong className="text-navy-950">Por que o risco é decidido por regras:</strong> um classificador que lê o laudo
          inteiro (TF-IDF + SVM) acerta só {pct(SVM.teste.acuracia)} a {pct(SVM.ood.acuracia)} dos níveis de risco. Por isso a IA apenas <em>lê</em> o laudo, e quem compara os
          valores com os limites é o motor de regras.
        </p>
      </div>

      {/* Erros */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border-2 border-crit/30 bg-crit/5 p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Taxa de erro em críticos</p>
          <p className="mt-3 text-5xl font-extrabold tabular-nums text-navy-950">
            {PERDIDOS_NER}
            <span className="text-2xl font-bold text-slate-500"> de {TOTAL_CRITICOS}</span>
          </p>
          <p className="mt-2 font-semibold text-slate-700">
            laudos críticos não sinalizados como críticos ({pct(PERDIDOS_NER / TOTAL_CRITICOS)})
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {NER.teste.perdidos} no teste e {NER.ood.perdidos} no teste OOD. Em {CRITICOS_COMO_NORMAL} dos {PERDIDOS_NER}{" "}
            casos o laudo saiu como Normal, o erro mais grave. É por isso que a validação da enfermagem continua no fluxo.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7">
          <h3 className="text-xl font-bold text-navy-950">Onde o modelo erra</h3>
          <p className="mt-1 text-slate-600">Todos os críticos perdidos vêm de exames que o NER não leu corretamente.</p>
          <ul className="mt-5 flex flex-col divide-y divide-slate-100">
            {ERROS_POR_FORMATO.map((e) => (
              <li key={e.formato} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-6">
                <div className="sm:w-2/5">
                  <p className="font-semibold text-navy-950">{e.formato}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{e.split}</p>
                </div>
                <p className="flex-1 text-sm text-slate-600">{e.erro}</p>
                <div className="flex gap-4 text-sm tabular-nums sm:w-44 sm:justify-end">
                  <span className="text-slate-500">
                    F1 <strong className="text-navy-950">{pct(e.extracao)}</strong>
                  </span>
                  <span className="text-slate-500">
                    <strong className="text-red-700">{e.perdidos}</strong> crít.
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ResultsTable />

      {/* Limitações */}
      <div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7">
          <h3 className="text-xl font-bold text-navy-950">Limitações</h3>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-slate-600">
            <li>Os laudos são sintéticos. O sistema ainda não foi avaliado com laudos reais.</li>
            <li>
              Os rótulos de risco foram gerados pelas mesmas regras usadas na triagem. Por isso as regras acertam sempre que a
              extração está correta: o erro medido é o da leitura do laudo.
            </li>
            <li>O formato OOD avalia layouts novos, não erros de digitação ou laudos escaneados (PDF/OCR).</li>
            <li>
              Próximo passo: incluir no treino tabelas com colunas em outra ordem e laudos quebrados em linhas.
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

const COLUMNS = [
  { key: "sistema", label: "Sistema" },
  { key: "split", label: "Split" },
  { key: "extracao", label: "F1 extração" },
  { key: "acuracia", label: "Acurácia" },
  { key: "recallCritico", label: "Recall crít." },
  { key: "perdidos", label: "Críticos perdidos" },
];

const SPLIT_PILL = {
  teste: { text: "Teste", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  ood: { text: "OOD", cls: "bg-teal-50 text-teal-700 ring-teal-200" },
};

function ResultsTable() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-bold text-navy-950">Tabela completa dos resultados</h3>
          <p className="mt-1 text-sm text-slate-500">
            Passe o cursor ou toque nos termos sublinhados e nos números para ver o que significam e por que deram esse valor.
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs text-slate-600">
          {SERIES.map((se) => (
            <li key={se.key} className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${SPLIT_PILL[se.key].cls}`}>{SPLIT_PILL[se.key].text}</span>
              {se.label.split(" · ")[1]}
            </li>
          ))}
        </ul>
      </div>

      <InView className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left text-sm tabular-nums">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className="border-b border-slate-200 px-3 pb-3 align-bottom font-semibold first:pl-0">
                  <InfoTip title={c.label} content={COLUNAS[c.key]} className="uppercase">
                    {c.label}
                  </InfoTip>
                </th>
              ))}
            </tr>
          </thead>
          {SISTEMAS.map((si, gi) => (
            <tbody key={si.nome} className={si.destaque ? "bg-sky-50/60" : ""}>
              {SERIES.map((se, i) => {
                const r = si[se.key];
                const delay = (gi * 2 + i) * 80;
                return (
                  <tr key={se.key}>
                    {i === 0 && (
                      <td rowSpan={2} className="w-56 border-b border-slate-200 py-3 pl-3 pr-3 align-middle">
                        <InfoTip title={si.nome} content={si.descricao} className="font-semibold text-navy-950">
                          {si.nome}
                        </InfoTip>
                        {si.destaque && (
                          <span className="mt-1 block w-fit rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            modelo do projeto
                          </span>
                        )}
                      </td>
                    )}
                    <td className={`px-3 py-3 ${i === 1 ? "border-b border-slate-200" : ""}`}>
                      <InfoTip title={SPLIT_PILL[se.key].text} content={COLUNAS.split} className="no-underline">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${SPLIT_PILL[se.key].cls}`}>
                          {SPLIT_PILL[se.key].text}
                        </span>
                      </InfoTip>
                    </td>
                    {["extracao", "acuracia", "recallCritico"].map((metric) => (
                      <td key={metric} className={`px-3 py-3 ${i === 1 ? "border-b border-slate-200" : ""}`}>
                        <MetricCell si={si} se={se} metric={metric} delay={delay} />
                      </td>
                    ))}
                    <td className={`px-3 py-3 ${i === 1 ? "border-b border-slate-200" : ""}`}>
                      <MissedCell si={si} se={se} delay={delay} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </InView>
      <p className="mt-4 text-xs text-slate-500">
        NER (entidades, seqeval micro): F1 {pct(NER_ENTIDADES.teste.f1)} no teste e {pct(NER_ENTIDADES.ood.f1)} no OOD.
        Dataset reproduzível com <code>gerar_dataset.py --seed 42</code>.
      </p>
    </div>
  );
}

function MetricCell({ si, se, metric, delay }) {
  const r = si[se.key];
  const v = r[metric];
  const title = `${si.nome} · ${SPLIT_PILL[se.key].text}`;
  const content = <CellExplanation metric={metric} split={se.key} result={r} />;
  if (v == null) {
    return (
      <InfoTip title={title} content={content} className="text-xs text-slate-400">
        não extrai
      </InfoTip>
    );
  }
  return (
    <div className="flex w-24 flex-col gap-1.5">
      <InfoTip title={title} content={content} className="w-fit font-semibold text-navy-950">
        <CountUp to={v * 100} delay={delay} suffix="%" />
      </InfoTip>
      <div className="h-1.5 rounded-full bg-slate-100">
        <GrowBar percent={v * 100} delay={delay} className="h-1.5 rounded-full" style={{ background: se.color }} />
      </div>
    </div>
  );
}

function MissedCell({ si, se, delay }) {
  const r = si[se.key];
  const total = DATASET.criticos[se.key];
  return (
    <div className="flex w-28 flex-col gap-1.5">
      <InfoTip
        title={`${si.nome} · ${SPLIT_PILL[se.key].text}`}
        content={<CellExplanation metric="perdidos" split={se.key} result={r} />}
        className="w-fit"
      >
        <span className={`font-semibold ${r.perdidos > 0 ? "text-red-700" : "text-green-700"}`}>
          <CountUp to={r.perdidos} decimals={0} delay={delay} />
        </span>
        <span className="text-xs text-slate-400"> de {total}</span>
      </InfoTip>
      <div className="h-1.5 rounded-full bg-slate-100">
        <GrowBar percent={(r.perdidos / total) * 100} delay={delay} className="h-1.5 rounded-full bg-crit" />
      </div>
    </div>
  );
}

// O que o número significa em contagens reais + por que ele ficou assim.
function CellExplanation({ metric, split, result }) {
  const laudos = DATASET.splits[split];
  const criticos = DATASET.criticos[split];
  const v = result[metric];
  const what = {
    extracao:
      v == null
        ? "Este sistema não extrai exames: classifica o laudo inteiro de uma vez."
        : `F1 de ${pct(v)} na extração de cada exame e seu valor.`,
    acuracia: `Acertou o nível de risco em ${Math.round(v * laudos)} de ${laudos} laudos.`,
    recallCritico: `Sinalizou como crítico ${Math.round(v * criticos)} de ${criticos} laudos críticos.`,
    perdidos: `${v} de ${criticos} laudos críticos ficaram sem alerta vermelho.`,
  }[metric];
  return (
    <>
      <p className="font-medium text-slate-700">{what}</p>
      <p className="mt-2">
        <span className="font-semibold text-navy-950">Por quê: </span>
        {result.porque}
      </p>
    </>
  );
}

function Compare({ title, regex, ner }) {
  const rows = [
    { label: "Regex + regras", value: regex, bar: "bg-slate-400" },
    { label: "NER BERTimbau + regras", value: ner, bar: "bg-mint" },
  ];
  return (
    <InView className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <div className="mt-4 flex flex-col gap-4">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-slate-200">{r.label}</span>
              <CountUp to={r.value * 100} suffix="%" delay={i * 250} className="text-2xl font-bold tabular-nums text-white" />
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-white/10">
              <GrowBar percent={Math.max(r.value * 100, 0.5)} delay={i * 250} className={`h-2 rounded-full ${r.bar}`} />
            </div>
          </div>
        ))}
      </div>
    </InView>
  );
}

function BarChart({ title, metric }) {
  return (
    <InView as="figure">
      <figcaption className="mb-4 font-semibold text-slate-700">{title}</figcaption>
      <ul className="flex flex-col gap-5">
        {SISTEMAS.map((si, gi) => (
          <li key={si.nome}>
            <p className={`mb-1.5 text-sm ${si.destaque ? "font-semibold text-navy-950" : "text-slate-600"}`}>{si.nome}</p>
            <div className="flex flex-col gap-0.5">
              {SERIES.map((se, i) => {
                const v = si[se.key][metric];
                const delay = (gi * 2 + i) * 90;
                return (
                  <div
                    key={se.key}
                    className="group flex items-center gap-2"
                    title={`${si.nome} · ${se.label}: ${pct(v)}`}
                  >
                    <div className="h-3 flex-1 border-l border-slate-300">
                      <GrowBar
                        percent={v * 100}
                        delay={delay}
                        className="h-3 rounded-r-[4px] group-hover:opacity-80"
                        style={{ background: se.color }}
                      />
                    </div>
                    <CountUp
                      to={v * 100}
                      suffix="%"
                      delay={delay}
                      className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700"
                    />
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </InView>
  );
}

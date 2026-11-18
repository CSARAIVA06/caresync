import {
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
const num = (v) => v.toLocaleString("pt-BR");

const NER = SISTEMAS.find((s) => s.destaque);
const REGEX = SISTEMAS.find((s) => s.nome.startsWith("Regex"));
const SVM = SISTEMAS.find((s) => s.nome === "TF-IDF + SVM");
const PERDIDOS_NER = NER.teste.perdidos + NER.ood.perdidos;
const TOTAL_CRITICOS = DATASET.criticos.teste + DATASET.criticos.ood;

export default function Results() {
  const s = DATASET.splits;
  const tiles = [
    { value: num(DATASET.total), label: "laudos sintéticos", sub: `${s.treino} treino · ${s.validacao} validação · ${s.teste} teste · ${s.ood} OOD` },
    { value: DATASET.formatos, label: "formatos de laudo", sub: `${DATASET.formatosOod} deles só aparecem no teste OOD` },
    { value: DATASET.marcadores, label: "marcadores laboratoriais", sub: "com unidade, referência e limites críticos" },
    { value: 3, label: "níveis de risco", sub: "Normal · Atenção · Crítico" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Dataset */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-4xl font-extrabold tabular-nums tracking-tight text-navy-950">{t.value}</p>
            <p className="mt-1 font-semibold text-slate-700">{t.label}</p>
            <p className="mt-1 text-sm text-slate-500">{t.sub}</p>
          </div>
        ))}
      </div>

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

      {/* Limitações e tabela completa */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-7">
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

        <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-7">
          <summary className="cursor-pointer text-xl font-bold text-navy-950">Tabela completa dos resultados</summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm tabular-nums">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Sistema</th>
                  <th className="py-2 pr-3">Split</th>
                  <th className="py-2 pr-3">F1 extração</th>
                  <th className="py-2 pr-3">Acurácia</th>
                  <th className="py-2 pr-3">Recall crít.</th>
                  <th className="py-2">Perdidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {SISTEMAS.flatMap((si) =>
                  SERIES.map((se) => {
                    const r = si[se.key];
                    return (
                      <tr key={si.nome + se.key}>
                        <td className="py-2 pr-3 font-medium text-navy-950">{si.nome}</td>
                        <td className="py-2 pr-3">{se.key === "ood" ? "OOD" : "Teste"}</td>
                        <td className="py-2 pr-3">{r.extracao == null ? "—" : pct(r.extracao)}</td>
                        <td className="py-2 pr-3">{pct(r.acuracia)}</td>
                        <td className="py-2 pr-3">{pct(r.recallCritico)}</td>
                        <td className="py-2">{r.perdidos}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-slate-500">
              NER (entidades, seqeval micro): F1 {pct(NER_ENTIDADES.teste.f1)} no teste e {pct(NER_ENTIDADES.ood.f1)} no OOD.
              Dataset reproduzível com <code>gerar_dataset.py --seed 42</code>.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

function Compare({ title, regex, ner }) {
  const rows = [
    { label: "Regex + regras", value: regex, bar: "bg-slate-400" },
    { label: "NER BERTimbau + regras", value: ner, bar: "bg-mint" },
  ];
  return (
    <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <div className="mt-4 flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-slate-200">{r.label}</span>
              <span className="text-2xl font-bold tabular-nums text-white">{pct(r.value)}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-white/10">
              <div className={`h-2 rounded-full ${r.bar}`} style={{ width: `${Math.max(r.value * 100, 0.5)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ title, metric }) {
  return (
    <figure>
      <figcaption className="mb-4 font-semibold text-slate-700">{title}</figcaption>
      <ul className="flex flex-col gap-5">
        {SISTEMAS.map((si) => (
          <li key={si.nome}>
            <p className={`mb-1.5 text-sm ${si.destaque ? "font-semibold text-navy-950" : "text-slate-600"}`}>{si.nome}</p>
            <div className="flex flex-col gap-0.5">
              {SERIES.map((se) => {
                const v = si[se.key][metric];
                return (
                  <div
                    key={se.key}
                    className="group flex items-center gap-2"
                    title={`${si.nome} · ${se.label}: ${pct(v)}`}
                  >
                    <div className="h-3 flex-1 border-l border-slate-300">
                      <div
                        className="h-3 rounded-r-[4px] transition-opacity group-hover:opacity-80"
                        style={{ width: `${v * 100}%`, background: se.color }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">{pct(v)}</span>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

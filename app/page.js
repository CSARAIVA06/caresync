import Navbar from "./components/Navbar";
import HeroMockup from "./components/HeroMockup";
import Simulator from "./components/Simulator";
import Results from "./components/Results";
import PipelineExplorer from "./components/PipelineExplorer";
import { ArrowIcon, BrainIcon, FileIcon, NurseIcon, PulseIcon } from "./components/Icons";
import { LEVEL_DOT } from "./components/RiskBadge";
import { apiEnabled } from "./lib/api";
import { LEVEL_ORDER, LEVELS as RISK_LEVELS } from "./lib/triage";
import { site } from "./site.config";

const STEPS = [
  {
    icon: FileIcon,
    title: "Leitura e Extração",
    text: "O texto do laudo é lido como chega do laboratório. O sistema extrai as entidades (exames), os valores encontrados e os intervalos de referência.",
    tag: "Parsing · NER",
  },
  {
    icon: BrainIcon,
    title: "Triagem & RAG",
    text: "Regras determinísticas classificam o risco, e um modelo de linguagem gera a explicação humanizada a partir de uma base de conhecimento curada (RAG).",
    tag: "Transformer · RAG",
  },
  {
    icon: NurseIcon,
    title: "Enfermagem & Envio",
    text: "Validação humana (Human-in-the-Loop) para exames com alteração e envio direto da mensagem ao paciente.",
    tag: "Human-in-the-Loop",
  },
];

const LEVEL_LIST = LEVEL_ORDER.map((id) => ({
  dot: LEVEL_DOT[id],
  name: RISK_LEVELS[id].label,
  text: RISK_LEVELS[id].action,
}));

const METRICS = [
  {
    name: "Recall para exames críticos",
    text: "Proporção dos laudos realmente críticos que o sistema sinaliza em vermelho. É a métrica prioritária, pois um falso negativo pode atrasar um atendimento de urgência.",
  },
  {
    name: "Precisão do NER",
    text: "Acerto na extração de exames, valores e intervalos de referência a partir do texto do laudo (precisão, recall e F1 por entidade).",
  },
  {
    name: "Índice de legibilidade Flesch Reading Ease",
    text: "Mede se a mensagem gerada é compreensível para o público leigo, com fórmula adaptada ao português.",
  },
];

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-mint">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-lg leading-relaxed text-slate-600">{children}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section id="inicio" className="relative overflow-hidden bg-gradient-to-b from-white to-surface">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-sky-ai/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 top-60 h-[28rem] w-[28rem] rounded-full bg-mint/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="flex flex-col gap-6">
              <span className="w-fit rounded-full bg-navy-800/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy-800">
                PLN · Transformer · RAG · Human-in-the-Loop
              </span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-navy-950 sm:text-5xl xl:text-6xl">
                Laudos complexos, <span className="text-navy-800">comunicação clara</span> e{" "}
                <span className="bg-gradient-to-r from-mint to-sky-ai bg-clip-text text-transparent">segura</span>.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Automação inteligente e triagem pós-exame laboratorial: a plataforma lê o laudo, classifica o risco em
                tempo real e traduz o resultado em uma mensagem empática para o paciente, com supervisão da enfermagem
                nos casos que exigem atenção.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#simulador"
                  className="inline-flex items-center gap-2 rounded-lg bg-mint px-6 py-3.5 font-semibold text-white shadow-lg shadow-mint/30 transition hover:bg-emerald-600"
                >
                  Simular Leitura de Exame <ArrowIcon className="h-5 w-5" />
                </a>
                <a
                  href="#painel"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 font-semibold text-navy-950 transition hover:border-navy-800 hover:text-navy-800"
                >
                  Ver Painel da Enfermagem
                </a>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-slate-500">
                {LEVEL_LIST.map((l) => (
                  <span key={l.name} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} /> {l.name}
                  </span>
                ))}
              </div>
            </div>
            <HeroMockup />
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="Como funciona" title="O pipeline em 3 passos">
            Do laudo técnico à mensagem que o paciente entende, com a equipe de saúde no controle.
          </SectionTitle>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-sky-ai text-white">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <span className="text-5xl font-extrabold text-slate-100">{i + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-navy-950">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{s.text}</p>
                <span className="mt-4 inline-block rounded-full bg-mint/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">{s.tag}</span>
                {i < STEPS.length - 1 && (
                  <ArrowIcon className="absolute -right-5 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-slate-300 md:block" />
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Simulador */}
        <section id="simulador" className="bg-navy-950 py-20">
          <div id="painel" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-mint">Protótipo interativo</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Simulador de laudos</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                Escolha um laudo, processe e veja a mensagem que o paciente receberia. Depois, abra a aba da enfermagem para
                ver como os casos com alteração passam por revisão humana.
              </p>
            </div>
            <Simulator />
            <p className="mt-4 text-center text-xs text-slate-400">
              {apiEnabled
                ? "Laudos processados pela API CareSync NLP (parser, regras e LLM); se ela estiver indisponível, o navegador assume com o motor local."
                : "Demonstração executada no navegador com regras e textos-modelo."}{" "}
              Valores de referência gerais para adultos. Não use para decisões clínicas.
            </p>
          </div>
        </section>

        {/* Sobre a pesquisa */}
        <section id="pesquisa" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="Sobre a pesquisa" title="Automação inteligente e triagem pós-exame laboratorial">
            Transformando laudos complexos em comunicação clara, empática e segura para o paciente.
          </SectionTitle>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-7">
              <h3 className="text-xl font-bold text-navy-950">O desafio</h3>
              <p className="mt-3 leading-relaxed text-slate-600">
                Diariamente, milhares de laudos laboratoriais são disponibilizados aos pacientes como relatórios técnicos
                de difícil compreensão. A baixa alfabetização em saúde (<em>health literacy</em>) faz com que exames
                completamente normais gerem ansiedade e buscas desnecessárias ao pronto-socorro ou à recepção do
                hospital. Por outro lado, alterações importantes ou valores críticos, como anemias graves, podem ser
                negligenciados por falta de entendimento imediato do resultado.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-7">
              <h3 className="text-xl font-bold text-navy-950">A nossa solução</h3>
              <p className="mt-3 leading-relaxed text-slate-600">
                Uma plataforma baseada em Processamento de Linguagem Natural (PLN), arquitetura Transformer (seq2seq) e
                RAG (<em>Retrieval-Augmented Generation</em>) que lê laudos, extrai marcadores de saúde e realiza a
                triagem automatizada de risco em tempo real.
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {LEVEL_LIST.map((l) => (
                  <li key={l.name} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${l.dot}`} />
                    <span>
                      <strong className="text-navy-950">{l.name}:</strong> {l.text}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* Diagrama do pipeline */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7">
            <h3 className="text-xl font-bold text-navy-950">Arquitetura do pipeline</h3>
            <p className="mt-2 text-slate-600">
              O modelo de linguagem gera o texto, mas os valores e as referências vêm da base de conhecimento recuperada,
              o que reduz alucinações. Os guardrails bloqueiam diagnósticos e garantem a orientação ao profissional de saúde.
            </p>
            <PipelineExplorer />
          </div>

          {/* Métricas */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <h3 className="text-xl font-bold text-navy-950">Métricas de avaliação</h3>
              <ul className="mt-5 grid gap-4 md:grid-cols-3">
                {METRICS.map((m) => (
                  <li key={m.name} className="rounded-xl bg-slate-50 p-5">
                    <p className="font-semibold text-navy-800">{m.name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 p-7 text-white">
              <h3 className="text-xl font-bold">Inovação acadêmica e tecnológica</h3>
              <p className="mt-3 leading-relaxed text-slate-200">
                Pesquisa em {site.course} desenvolvida na {site.institution}, combinando IA generativa, restrições éticas de
                segurança clínica (guardrails) e suporte à decisão na recepção hospitalar.
              </p>
            </div>
          </div>
        </section>

        {/* Resultados */}
        <section id="resultados" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <SectionTitle eyebrow="Resultados" title="O que o modelo acerta e onde ele erra">
              Avaliação em laudos de teste nunca usados no treino, incluindo formatos de laudo que o sistema nunca viu.
            </SectionTitle>
            <Results />
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="bg-navy-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-white">
                <PulseIcon className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold text-white">{site.name}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {site.tagline}. Protótipo acadêmico do curso de {site.course}, {site.institution}.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white">Equipe</p>
            <p className="mt-3 text-sm text-slate-400">
              <span className="text-slate-300">{site.authors.length > 1 ? "Autores:" : "Autor:"}</span> {site.authors.join(", ")}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              <span className="text-slate-300">Orientação:</span> {site.advisors.join(", ")}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white">Links</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <a href={site.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
                  Repositório do projeto
                </a>
              </li>
              <li>
                {site.articleUrl ? (
                  <a href={site.articleUrl} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
                    Artigo acadêmico
                  </a>
                ) : (
                  <span className="text-slate-500">Artigo acadêmico (em breve)</span>
                )}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
          © {site.name} · {site.institution} · Ciência de Dados. Projeto educacional, não substitui avaliação médica.
        </div>
      </footer>
    </>
  );
}

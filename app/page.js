import Navbar from "./components/Navbar";
import HeroMockup from "./components/HeroMockup";
import Simulator from "./components/Simulator";
import DatasetExplorer from "./components/DatasetExplorer";
import SlideNav from "./components/SlideNav";
import { ResultsComparison, ResultsErrors, ResultsHighlight, ResultsLimitations } from "./components/Results";
import PipelineExplorer from "./components/PipelineExplorer";
import { AlertIcon, ArrowIcon, PulseIcon, SirenIcon } from "./components/Icons";
import { LEVEL_DOT } from "./components/RiskBadge";
import { apiEnabled } from "./lib/api";
import { LEVEL_ORDER, LEVELS as RISK_LEVELS } from "./lib/triage";
import { site } from "./site.config";

const LEVEL_LIST = LEVEL_ORDER.map((id) => ({
  dot: LEVEL_DOT[id],
  name: RISK_LEVELS[id].label,
}));

// O problema em dois lados: o mesmo laudo difícil de ler causa erros opostos.
const PROBLEMA = [
  {
    icon: AlertIcon,
    tone: "bg-warn/10 text-amber-700",
    title: "Exame normal que assusta",
    text: "Sem entender o laudo, o paciente se preocupa com um resultado que está dentro do esperado e procura o pronto-socorro ou a recepção à toa.",
  },
  {
    icon: SirenIcon,
    tone: "bg-crit/10 text-red-700",
    title: "Exame crítico que passa batido",
    text: "Um valor grave, como uma anemia severa, pode ser ignorado por quem não sabe que aquele número exige atendimento rápido.",
  },
];

function SectionTitle({ eyebrow, title, dark, children }) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center lg:mb-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-mint">{eyebrow}</p>
      <h2 className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-navy-950"}`}>{title}</h2>
      {children && <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>{children}</p>}
    </div>
  );
}

// Uma seção = uma tela, como um slide de apresentação (classe .slide em globals.css).
function Slide({ id, className = "", tight = false, children }) {
  return (
    <section id={id} className={`slide ${className}`}>
      <div className={`mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 ${tight ? "lg:py-4" : "lg:py-10"}`}>{children}</div>
    </section>
  );
}

const SLIDES = [
  { id: "inicio", label: "Início" },
  { id: "problema", label: "O problema" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "simulador", label: "Simulador" },
  { id: "resultados", label: "Os dados" },
  { id: "principal", label: "Principal resultado" },
  { id: "comparacao", label: "Comparação" },
  { id: "erros", label: "Onde o modelo erra" },
  { id: "limitacoes", label: "Limitações" },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <SlideNav slides={SLIDES} />

      <main className="flex-1 pt-16">
        {/* Início */}
        <section id="inicio" className="slide relative overflow-hidden bg-gradient-to-b from-white to-surface">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-sky-ai/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 top-60 h-[28rem] w-[28rem] rounded-full bg-mint/10 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-10">
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
                  href="#resultados"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 font-semibold text-navy-950 transition hover:border-navy-800 hover:text-navy-800"
                >
                  Ver os Resultados
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

        <Slide id="problema">
          <SectionTitle eyebrow="O problema" title="Laudos escritos para médicos chegam às mãos dos pacientes">
            Milhares de laudos são liberados todos os dias como relatórios técnicos. Com a baixa alfabetização em saúde
            (<em>health literacy</em>), o mesmo laudo difícil de ler provoca dois erros opostos:
          </SectionTitle>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {PROBLEMA.map((p) => (
              <article key={p.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-7">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${p.tone}`}>
                  <p.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-navy-950">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{p.text}</p>
                </div>
              </article>
            ))}
          </div>
        </Slide>

        <Slide id="como-funciona" className="border-y border-slate-200 bg-white">
          <SectionTitle eyebrow="Como funciona" title="Do laudo à mensagem, em 7 etapas">
            A IA lê o laudo e escreve a explicação, regras fixas decidem o risco e a enfermagem revisa os casos alterados.
            Clique em cada etapa para ver o que ela faz.
          </SectionTitle>
          <PipelineExplorer />
        </Slide>

        <Slide id="simulador" className="bg-navy-950" tight>
          <div id="painel" className="scroll-mt-20">
            {/* Título compacto: o simulador precisa de quase toda a altura da tela */}
            <div className="mb-5 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white">Simulador de laudos</h2>
              <p className="mt-2 text-slate-300">
                Escolha um laudo e processe. Na aba da enfermagem, veja como os casos alterados passam por revisão humana.
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
        </Slide>

        <Slide id="resultados">
          <SectionTitle eyebrow="Resultados · os dados" title="Com que dados o modelo foi treinado e testado">
            Laudos de teste nunca usados no treino, incluindo formatos que o sistema nunca viu. Clique em cada card.
          </SectionTitle>
          <DatasetExplorer />
        </Slide>

        <Slide id="principal">
          <ResultsHighlight />
        </Slide>

        <Slide id="comparacao" className="bg-white">
          <ResultsComparison />
        </Slide>

        <Slide id="erros">
          <SectionTitle eyebrow="Resultados · erros" title="Quanto e onde o modelo erra" />
          <ResultsErrors />
        </Slide>

        <Slide id="limitacoes" className="bg-white">
          <SectionTitle eyebrow="Resultados · limitações" title="O que ainda falta" />
          <ResultsLimitations />
        </Slide>
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

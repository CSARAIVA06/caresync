import TechAccordion from "./components/TechAccordion";
import RoadmapChecklist from "./components/RoadmapChecklist";
import { technologies, roadmap } from "./data";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Hero */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20 sm:py-28">
          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            CareSync · Saúde Digital
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Automação inteligente no atendimento hospitalar
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            A tecnologia não substitui a equipa médica — liberta os
            profissionais de tarefas burocráticas e repetitivas, devolvendo o
            foco ao atendimento humanizado, à empatia e à relação direta com
            o paciente.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#tecnologias"
              className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Ver tecnologias
            </a>
            <a
              href="#plano"
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Plano de implementação
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-24 px-6 py-20">
        {/* Resumo */}
        <section aria-labelledby="resumo-heading" className="flex flex-col gap-4">
          <h2
            id="resumo-heading"
            className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
          >
            Resumo
          </h2>
          <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            A transformação digital e a automação do fluxo de atendimento nos
            hospitais reduzem gargalos operacionais, otimizam o tempo de
            espera e elevam a precisão da triagem e do encaminhamento
            médico. A automação moderniza a jornada do paciente desde o
            agendamento prévio até ao pós-atendimento.
          </p>
        </section>

        {/* Tecnologias */}
        <section id="tecnologias" aria-labelledby="tech-heading" className="flex flex-col gap-6">
          <div>
            <h2
              id="tech-heading"
              className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              Tecnologias
            </h2>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              As melhores tecnologias de automação hospitalar
            </p>
          </div>
          <TechAccordion items={technologies} />
        </section>

        {/* Plano de ação */}
        <section id="plano" aria-labelledby="plano-heading" className="flex flex-col gap-6">
          <div>
            <h2
              id="plano-heading"
              className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              Plano de ação
            </h2>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              O que deve ser feito para implementar
            </p>
          </div>
          <RoadmapChecklist steps={roadmap} />
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        CareSync — Automação a serviço do cuidado humano.
      </footer>
    </div>
  );
}

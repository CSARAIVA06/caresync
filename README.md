# CareSync — Triagem Inteligente Pós-Exame Laboratorial

Site e simulador do **CareSync**, protótipo acadêmico de Processamento de Linguagem Natural (PLN) que lê laudos
laboratoriais, classifica o risco (Normal, Atenção ou Crítico) e gera uma mensagem clara e empática para o paciente,
com revisão da enfermagem nos casos alterados.

- **Site no ar:** https://caresync-eta-ten.vercel.app
- **API e experimentos (PLN):** [CSARAIVA06/caresync-nlp-core](https://github.com/CSARAIVA06/caresync-nlp-core)

Trabalho da disciplina de Processamento de Linguagem Natural — Ciência de Dados, Fatec Jundiaí.
Autor: Caio Roberto Farias Saraiva · Orientação: Leonardo de Lellis Rossi.

## O que o site mostra

O site funciona como uma apresentação: cada seção ocupa uma tela, e as teclas PageDown/PageUp (ou a roda do mouse)
passam de uma para a outra.

| Seção | Conteúdo |
|---|---|
| O problema | Por que laudos técnicos são difíceis para o paciente |
| Como funciona | As 7 etapas do pipeline, clicáveis: laudo, parsing/NER, motor de regras, RAG, geração do texto, guardrails e revisão humana |
| Simulador | Processa um laudo de exemplo (ou colado) e mostra a mensagem ao paciente e o painel da enfermagem |
| Resultados | Dataset, comparação regex × NER BERTimbau × TF-IDF+SVM, erros por formato e limitações |

Os números da seção de resultados vêm de `resultados/RESULTADOS.md` no repositório
[caresync-nlp-core](https://github.com/CSARAIVA06/caresync-nlp-core).

## Como o simulador processa o laudo

O simulador chama a API do `caresync-nlp-core` quando `NEXT_PUBLIC_TRIAGE_API_URL` está configurada. Se a variável
não existir ou a API estiver fora do ar, um motor equivalente roda no próprio navegador (`app/lib/triage.js`), e o
resultado indica qual motor respondeu.

## Estrutura

```
app/
  page.js                  página (seções em formato de slide)
  components/
    Simulator.js           simulador: visão do paciente e painel da enfermagem
    PipelineExplorer.js    as 7 etapas do pipeline, clicáveis
    DatasetExplorer.js     demonstrações do dataset (formatos, marcadores, níveis)
    Results.js             gráficos, erros, limitações e tabela completa
    SlideNav.js            navegação de apresentação (PageDown/PageUp, roda, bolinhas)
  lib/
    triage.js              motor local de triagem (mesmas regras e base da API)
    api.js                 cliente da API do caresync-nlp-core
    resultados.js          números dos experimentos exibidos no site
  site.config.js           créditos e links do rodapé
```

## Rodando localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev          # http://localhost:3000
```

Para usar a API em vez do motor do navegador, crie um `.env.local` com o endereço dela:

```
NEXT_PUBLIC_TRIAGE_API_URL=http://localhost:8000
```

Outros comandos: `npm run lint` e `npm run build`.

## Aviso

Projeto educacional com laudos sintéticos. Valores de referência gerais para adultos. Não use para decisões clínicas.

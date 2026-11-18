// Resultados experimentais do caresync-nlp-core (resultados/RESULTADOS.md, dataset sintético com seed 42).
// Ao retreinar os modelos, atualize estes números a partir daquele arquivo.

export const DATASET = {
  total: 1200,
  splits: { treino: 630, validacao: 135, teste: 135, ood: 300 },
  formatos: 8,
  formatosOod: 2,
  marcadores: 12,
  criticos: { teste: 47, ood: 99 },
};

// Triagem de risco por sistema: teste (formatos vistos no treino) x teste OOD (formatos nunca vistos).
export const SISTEMAS = [
  {
    nome: "NER BERTimbau + regras",
    destaque: true,
    teste: { extracao: 0.999, acuracia: 0.993, recallCritico: 0.979, perdidos: 1 },
    ood: { extracao: 0.957, acuracia: 0.96, recallCritico: 0.939, perdidos: 6 },
  },
  {
    nome: "Regex + regras",
    teste: { extracao: 1.0, acuracia: 1.0, recallCritico: 1.0, perdidos: 0 },
    ood: { extracao: 0.008, acuracia: 0.323, recallCritico: 0.0, perdidos: 99 },
  },
  {
    nome: "Híbrido (SVM + regras/regex)",
    teste: { extracao: null, acuracia: 0.57, recallCritico: 1.0, perdidos: 0 },
    ood: { extracao: null, acuracia: 0.49, recallCritico: 0.515, perdidos: 48 },
  },
  {
    nome: "TF-IDF + SVM",
    teste: { extracao: null, acuracia: 0.393, recallCritico: 0.489, perdidos: 24 },
    ood: { extracao: null, acuracia: 0.49, recallCritico: 0.515, perdidos: 48 },
  },
];

// Entidades do NER (seqeval, micro).
export const NER_ENTIDADES = {
  teste: { precision: 0.999, recall: 0.999, f1: 0.999 },
  ood: { precision: 0.977, recall: 0.984, f1: 0.98 },
};

// Onde o NER BERTimbau + regras errou, por formato de laudo.
export const ERROS_POR_FORMATO = [
  {
    formato: "Tabela com a referência antes do resultado",
    split: "OOD",
    extracao: 0.933,
    perdidos: 4,
    erro: "Pegou o limite da referência como valor em 37 marcadores e não extraiu outros 6.",
  },
  {
    formato: "Laudo quebrado em várias linhas",
    split: "OOD",
    extracao: 0.982,
    perdidos: 2,
    erro: "Não extraiu 21 marcadores.",
  },
  {
    formato: "Laudo sem valores de referência",
    split: "Teste",
    extracao: 0.994,
    perdidos: 1,
    erro: "Não extraiu 1 marcador.",
  },
];

// Dos 7 críticos perdidos pelo NER + regras, quantos foram classificados como Normal.
export const CRITICOS_COMO_NORMAL = 6;

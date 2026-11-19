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
// "porque" explica o resultado de cada split com base nas matrizes de confusão de resultados/*.json.
export const SISTEMAS = [
  {
    nome: "NER BERTimbau + regras",
    destaque: true,
    descricao:
      "BERTimbau é um modelo BERT pré-treinado em português. Ele foi ajustado (fine-tuning) para marcar no laudo o nome de cada exame, o valor e a referência — isso é o NER, reconhecimento de entidades. Depois, o motor de regras compara os valores com os limites.",
    teste: {
      extracao: 0.999, acuracia: 0.993, recallCritico: 0.979, perdidos: 1,
      porque: "O modelo leu corretamente quase todos os exames. O único crítico perdido foi um laudo sem valores de referência em que um exame não foi extraído.",
    },
    ood: {
      extracao: 0.957, acuracia: 0.96, recallCritico: 0.939, perdidos: 6,
      porque: "Mesmo sem ter visto esses formatos no treino, o modelo reconheceu a maioria dos exames. Os erros vêm da tabela com a referência antes do resultado (às vezes pega o limite da referência como valor) e do laudo quebrado em várias linhas (deixa exames de fora).",
    },
  },
  {
    nome: "Regex + regras",
    descricao:
      "Padrões de texto (expressões regulares) escritos à mão para encontrar o exame e o valor nos 6 formatos usados no treino. Depois, as mesmas regras decidem o nível de risco.",
    teste: {
      extracao: 1.0, acuracia: 1.0, recallCritico: 1.0, perdidos: 0,
      porque: "Os padrões foram escritos exatamente para esses formatos, e os rótulos de risco do dataset foram gerados pelas mesmas regras. O acerto total é esperado por construção e não mostra que o método funciona em laudos diferentes.",
    },
    ood: {
      extracao: 0.008, acuracia: 0.323, recallCritico: 0.0, perdidos: 99,
      porque: "Nos formatos novos os padrões quase não encontram os exames: acertou 7 de 1.179 e capturou 590 números errados. Sem exames lidos, 289 dos 300 laudos viraram Normal. A acurácia vem quase só dos laudos que já eram normais, e nenhum crítico foi sinalizado.",
    },
  },
  {
    nome: "Híbrido (SVM + regras/regex)",
    descricao:
      "Combina o Regex + regras com o TF-IDF + SVM: se as regras com regex encontram um valor crítico, o laudo é Crítico; caso contrário, vale o palpite do SVM.",
    teste: {
      extracao: null, acuracia: 0.57, recallCritico: 1.0, perdidos: 0,
      porque: "No teste o regex encontra todos os críticos, por isso o recall é 100%. Mas Normal e Atenção continuam sendo decididos pelo SVM, que erra muito — daí a acurácia de só 57%.",
    },
    ood: {
      extracao: null, acuracia: 0.49, recallCritico: 0.515, perdidos: 48,
      porque: "Nos formatos novos o regex não encontra nenhum crítico, então a regra nunca entra em ação. O resultado fica idêntico ao do SVM sozinho.",
    },
  },
  {
    nome: "TF-IDF + SVM",
    descricao:
      "Classificador estatístico clássico: transforma o laudo em pesos de palavras (TF-IDF) e uma SVM prevê o nível de risco direto, sem extrair os valores dos exames.",
    teste: {
      extracao: null, acuracia: 0.393, recallCritico: 0.489, perdidos: 24,
      porque: "O classificador olha as palavras, não o valor dos números. Um laudo normal e um crítico usam as mesmas palavras (Hemoglobina, g/dL…) — o que muda é o número. Por isso o acerto fica perto do acaso, que seria 33% com 3 níveis.",
    },
    ood: {
      extracao: null, acuracia: 0.49, recallCritico: 0.515, perdidos: 48,
      porque: "Continua sem entender os valores dos exames, então segue perto do acaso também nos formatos novos.",
    },
  },
];

// Significado de cada coluna da tabela de resultados.
export const COLUNAS = {
  sistema: "A abordagem usada para chegar ao nível de risco. Passe o cursor ou toque em cada nome para ver como ela funciona.",
  split:
    "Teste: 135 laudos novos, mas em formatos que apareceram no treino. OOD (out-of-distribution): 300 laudos em 2 formatos que o sistema nunca viu — mede se ele generaliza.",
  extracao:
    "Mede a leitura do laudo: se cada exame e seu valor foram extraídos corretamente. O F1 combina precisão (não inventar exames) e recall (não deixar exames de fora).",
  acuracia: "Porcentagem de laudos com o nível de risco correto (Normal, Atenção ou Crítico).",
  recallCritico:
    "Dos laudos realmente críticos, quantos foram sinalizados como críticos. É a métrica mais importante: um crítico perdido pode atrasar um atendimento de urgência.",
  perdidos: "Quantidade de laudos críticos que ficaram sem alerta vermelho.",
};

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

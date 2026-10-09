// Motor de triagem simulado (executa 100% no navegador).
// Reproduz, de forma didática, as etapas do pipeline:
//   1. Extração (parsing) dos marcadores do laudo
//   2. Classificação de risco por regras (Verde / Amarelo / Vermelho)
//   3. Geração de mensagem humanizada com "base de conhecimento" (RAG simulado)
// Os intervalos são valores de referência gerais para adultos, apenas para demonstração.

export const MARKERS = [
  {
    id: "hemoglobina",
    name: "Hemoglobina",
    aliases: ["hemoglobina", "hb", "hgb"],
    exclude: /^\s*(glicada|glicosilada|a1c)/,
    unit: "g/dL",
    ref: [12, 17.5],
    critical: [7, 20],
    plain: "proteína do sangue que transporta oxigênio pelo corpo",
    low: "pode indicar anemia, que causa cansaço e fraqueza",
    high: "pode estar relacionado a desidratação ou outras condições",
  },
  {
    id: "hematocrito",
    name: "Hematócrito",
    aliases: ["hematocrito", "ht", "hct"],
    unit: "%",
    ref: [36, 52],
    critical: [21, 60],
    plain: "porcentagem do sangue ocupada pelas células vermelhas",
    low: "costuma acompanhar quadros de anemia",
    high: "pode indicar desidratação ou excesso de células vermelhas",
  },
  {
    id: "leucocitos",
    name: "Leucócitos",
    aliases: ["leucocitos", "globulos brancos", "wbc"],
    unit: "/mm³",
    ref: [4000, 11000],
    critical: [2000, 30000],
    plain: "contagem das células de defesa do organismo",
    low: "pode reduzir a capacidade do corpo de combater infecções",
    high: "costuma aparecer quando o corpo está combatendo uma infecção ou inflamação",
  },
  {
    id: "plaquetas",
    name: "Plaquetas",
    aliases: ["plaquetas", "plt"],
    unit: "/mm³",
    ref: [150000, 450000],
    critical: [20000, 1000000],
    plain: "contagem das células que ajudam o sangue a coagular",
    low: "pode aumentar o risco de sangramentos e manchas roxas",
    high: "pode aumentar o risco de formação de coágulos",
  },
  {
    id: "glicose",
    name: "Glicose (jejum)",
    aliases: ["glicose", "glicemia"],
    unit: "mg/dL",
    ref: [70, 99],
    critical: [50, 400],
    plain: "quantidade de açúcar no sangue",
    low: "pode causar tontura, suor e confusão",
    high: "merece avaliação para pré-diabetes ou diabetes",
  },
  {
    id: "potassio",
    name: "Potássio",
    aliases: ["potassio", "k+"],
    unit: "mEq/L",
    ref: [3.5, 5.1],
    critical: [2.8, 6.2],
    plain: "dosagem de um mineral importante para os músculos e o coração",
    low: "pode causar cãibras, fraqueza e alterações no ritmo do coração",
    high: "pode alterar o ritmo do coração",
  },
  {
    id: "sodio",
    name: "Sódio",
    aliases: ["sodio", "na+"],
    unit: "mEq/L",
    ref: [135, 145],
    critical: [120, 160],
    plain: "dosagem de um mineral que regula a água no corpo",
    low: "pode causar enjoo, dor de cabeça e confusão",
    high: "costuma estar ligado a desidratação",
  },
  {
    id: "creatinina",
    name: "Creatinina",
    aliases: ["creatinina"],
    unit: "mg/dL",
    ref: [0.6, 1.3],
    critical: [null, 5],
    plain: "dosagem da substância que mostra como os rins estão filtrando o sangue",
    low: "geralmente não é motivo de preocupação",
    high: "pode indicar que os rins estão filtrando menos do que o esperado",
  },
  {
    id: "ureia",
    name: "Ureia",
    aliases: ["ureia"],
    unit: "mg/dL",
    ref: [15, 45],
    critical: [null, 200],
    plain: "dosagem de outro marcador do funcionamento dos rins",
    low: "geralmente não é motivo de preocupação",
    high: "pode indicar desidratação ou alteração na função dos rins",
  },
  {
    id: "colesterol",
    name: "Colesterol total",
    aliases: ["colesterol total", "colesterol"],
    exclude: /^\s*(hdl|ldl|vldl|nao)/,
    unit: "mg/dL",
    ref: [null, 190],
    critical: [null, null],
    plain: "medida da gordura do sangue ligada à saúde do coração",
    low: "",
    high: "aumenta o risco cardiovascular a longo prazo",
  },
  {
    id: "triglicerideos",
    name: "Triglicerídeos",
    aliases: ["triglicerideos", "triglicerides"],
    unit: "mg/dL",
    ref: [null, 150],
    critical: [null, 1000],
    plain: "medida de outro tipo de gordura do sangue, ligada à alimentação",
    low: "",
    high: "se relaciona à alimentação e ao risco cardiovascular",
  },
  {
    id: "tsh",
    name: "TSH",
    aliases: ["tsh"],
    unit: "µUI/mL",
    ref: [0.4, 4.5],
    critical: [null, null],
    plain: "dosagem do hormônio que controla o funcionamento da tireoide",
    low: "pode indicar tireoide mais acelerada que o normal",
    high: "pode indicar tireoide mais lenta que o normal",
  },
];

// Fonte única dos níveis de risco (usada pelo badge, pela página e pelo motor).
export const LEVELS = {
  verde: {
    id: "verde",
    label: "Verde · Normal",
    short: "Normal",
    action: "Envio direto de mensagem explicativa e tranquilizadora.",
  },
  amarelo: {
    id: "amarelo",
    label: "Amarelo · Atenção",
    short: "Atenção",
    action: "Orientação para agendamento de consulta de retorno.",
  },
  vermelho: {
    id: "vermelho",
    label: "Vermelho · Crítico",
    short: "Emergência",
    action: "Alerta instantâneo à equipe de saúde e orientação direta ao paciente.",
  },
};

export const LEVEL_ORDER = ["verde", "amarelo", "vermelho"];

export const SAMPLE_REPORTS = [
  {
    id: "normal",
    label: "Exemplo 1: Hemograma Normal",
    patient: "Ana Souza",
    text: `HEMOGRAMA COMPLETO
Hemoglobina: 14,2 g/dL      (VR: 12,0 a 17,5)
Hematócrito: 42 %           (VR: 36 a 52)
Leucócitos: 6.800 /mm³      (VR: 4.000 a 11.000)
Plaquetas: 245.000 /mm³     (VR: 150.000 a 450.000)

BIOQUÍMICA
Glicose: 88 mg/dL           (VR: 70 a 99)
Creatinina: 0,9 mg/dL       (VR: 0,6 a 1,3)`,
  },
  {
    id: "critico",
    label: "Exemplo 2: Anemia Severa / Risco Crítico",
    patient: "José Almeida",
    text: `HEMOGRAMA COMPLETO
Hemoglobina: 6,4 g/dL       (VR: 12,0 a 17,5)
Hematócrito: 20 %           (VR: 36 a 52)
Leucócitos: 5.200 /mm³      (VR: 4.000 a 11.000)
Plaquetas: 98.000 /mm³      (VR: 150.000 a 450.000)

ELETRÓLITOS
Potássio: 4,2 mEq/L         (VR: 3,5 a 5,1)`,
  },
  {
    id: "moderado",
    label: "Exemplo 3: Perfil Metabólico Alterado",
    patient: "Maria Oliveira",
    text: `PERFIL METABÓLICO
Glicose: 118 mg/dL          (VR: 70 a 99)
Colesterol total: 232 mg/dL (VR: < 190)
Triglicerídeos: 210 mg/dL   (VR: < 150)
Creatinina: 1,0 mg/dL       (VR: 0,6 a 1,3)
TSH: 2,1 µUI/mL             (VR: 0,4 a 4,5)`,
  },
];

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Converte "6,8" -> 6.8, "150.000" -> 150000, "250 mil" -> 250000
function parseNumber(raw, rest) {
  let s = raw;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  let n = Number(s);
  if (/^\s*mil\b/.test(rest)) n *= 1000;
  return Number.isFinite(n) ? n : null;
}

// Aceita "6,4", "6.4", "150.000" e "1.234,5".
const NUMBER_RE = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?/;

// Remove do trecho o que não é o resultado: intervalos de referência e datas.
function cleanSegment(seg) {
  return seg
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(
      /\b(vr|ref|referencia|valores? de referencia)\b\s*:?\s*[<>≤≥]?\s*[\d.,]+(\s*(a|-|ate)\s*[\d.,]+)?/g,
      " "
    )
    .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, " ");
}

// Encontra todas as menções de marcadores numa linha, na ordem em que aparecem.
// Menções excluídas (ex.: "hemoglobina glicada", "colesterol HDL") servem só de fronteira.
function findMentions(norm) {
  const hits = [];
  for (const m of MARKERS) {
    for (const alias of m.aliases) {
      const re = new RegExp(`(^|[^a-z])(${escapeRe(alias)})(?![a-z])`, "g");
      let r;
      while ((r = re.exec(norm))) {
        const start = r.index + r[1].length;
        const end = start + alias.length;
        const excluded = m.exclude?.test(norm.slice(end));
        hits.push({ marker: excluded ? null : m, start, end });
      }
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const out = [];
  let lastEnd = -1;
  for (const h of hits) {
    if (h.start < lastEnd) continue;
    out.push(h);
    lastEnd = h.end;
  }
  return out;
}

// 1. Extração: cada marcador recebe o primeiro número entre o seu nome e o próximo marcador.
export function extractMarkers(text) {
  const found = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    const norm = normalize(line);
    const mentions = findMentions(norm);
    mentions.forEach((h, i) => {
      if (!h.marker || seen.has(h.marker.id)) return;
      const next = mentions[i + 1]?.start ?? norm.length;
      const seg = cleanSegment(norm.slice(h.end, next));
      const match = NUMBER_RE.exec(seg);
      if (!match) return;
      const value = parseNumber(
        match[0],
        seg.slice(match.index + match[0].length)
      );
      if (value === null) return;
      seen.add(h.marker.id);
      found.push({ marker: h.marker, value, ...classifyValue(h.marker, value) });
    });
  }
  return found;
}

const EXAM_HEADINGS = [
  [/hemograma/, "Hemograma"],
  [/perfil lipidico|lipidograma/, "Perfil lipídico"],
  [/perfil metabolico/, "Perfil metabólico"],
  [/eletrolitos|ionograma/, "Eletrólitos"],
  [/funcao renal/, "Função renal"],
  [/tireoide|tireoidiana/, "Função tireoidiana"],
  [/bioquimica/, "Bioquímica"],
  [/glicemia/, "Glicemia"],
];

const BLOOD_COUNT = ["hemoglobina", "hematocrito", "leucocitos", "plaquetas"];
const LIPIDS = ["colesterol", "triglicerideos"];

// Tipo de exame: título reconhecido no laudo; senão, inferido pelos marcadores.
function detectExamType(text, items) {
  const norm = normalize(text);
  let best = null;
  for (const [re, label] of EXAM_HEADINGS) {
    const idx = norm.search(re);
    if (idx >= 0 && (best === null || idx < best.idx)) best = { idx, label };
  }
  if (best) return best.label;
  const ids = items.map((i) => i.marker.id);
  if (ids.every((id) => BLOOD_COUNT.includes(id))) return "Hemograma";
  if (ids.every((id) => LIPIDS.includes(id))) return "Perfil lipídico";
  return "Exames laboratoriais";
}

// 2. Classificação por regras
function classifyValue(m, v) {
  const [refLo, refHi] = m.ref;
  const [critLo, critHi] = m.critical;
  const direction =
    refLo !== null && v < refLo
      ? "low"
      : refHi !== null && v > refHi
        ? "high"
        : null;
  if ((critLo !== null && v < critLo) || (critHi !== null && v > critHi))
    return { status: "vermelho", direction };
  if (direction) return { status: "amarelo", direction };
  return { status: "verde", direction: null };
}

const RANK = { verde: 0, amarelo: 1, vermelho: 2 };

export function formatValue(v) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatRef(m) {
  const [lo, hi] = m.ref;
  if (lo === null) return `até ${formatValue(hi)} ${m.unit}`;
  if (hi === null) return `acima de ${formatValue(lo)} ${m.unit}`;
  return `${formatValue(lo)} a ${formatValue(hi)} ${m.unit}`;
}

const explain = (i) =>
  `• ${i.marker.name}: ${formatValue(i.value)} ${i.marker.unit} (${
    i.direction === "low" ? "abaixo" : "acima"
  } da referência de ${formatRef(i.marker)}). É a ${i.marker.plain}. Esse resultado ${
    i.marker[i.direction]
  }.`;

// 3. Comunicação humanizada (modelo simulado por templates + base de conhecimento)
function buildMessage(level, items, patientName) {
  const first = patientName?.trim() ? patientName.trim().split(/\s+/)[0] : "";
  const lines = [first ? `Olá, ${first}!` : "Olá!"];

  if (level === "verde") {
    lines.push(
      "Seus resultados chegaram e temos uma boa notícia: todos os exames analisados estão dentro dos valores esperados.",
      "",
      ...items.map(
        (i) =>
          `• ${i.marker.name}: ${formatValue(i.value)} ${i.marker.unit}. É a ${i.marker.plain}, e está normal.`
      ),
      "",
      "Não é necessária nenhuma ação imediata. Leve estes resultados na sua próxima consulta de rotina."
    );
  } else if (level === "amarelo") {
    lines.push(
      "Seus resultados chegaram. A maior parte está dentro do esperado, mas alguns valores merecem a atenção do seu médico. Isso é comum e não indica uma emergência.",
      "",
      ...items.filter((i) => i.status !== "verde").map(explain),
      "",
      "Recomendamos agendar uma consulta de retorno nos próximos dias para avaliar esses resultados com calma. Você pode marcar pelo nosso canal de atendimento."
    );
  } else {
    lines.push(
      "Seus resultados chegaram e um ou mais valores precisam de avaliação médica rápida. Nossa equipe de saúde já foi avisada e vai entrar em contato com você.",
      "",
      ...items.filter((i) => i.status !== "verde").map(explain),
      "",
      "Por favor, procure atendimento ainda hoje. Se sentir falta de ar, dor no peito, desmaio, sangramento ou fraqueza intensa, vá imediatamente ao pronto-socorro ou ligue 192 (SAMU)."
    );
  }

  lines.push(
    "",
    "Esta mensagem explica seus resultados em linguagem simples e não substitui a avaliação do seu médico."
  );
  return lines.join("\n");
}

export function analyzeReport(text, patientName = "") {
  const items = extractMarkers(text);
  if (items.length === 0) return null;
  const level = items.reduce(
    (acc, i) => (RANK[i.status] > RANK[acc] ? i.status : acc),
    "verde"
  );
  return {
    level,
    items,
    examType: detectExamType(text, items),
    message: buildMessage(level, items, patientName),
    sources: items.map(
      (i) =>
        `${i.marker.name}: ${i.marker.plain}. Referência (adulto): ${formatRef(i.marker)}.`
    ),
    guardrails: [
      "Nenhum diagnóstico é afirmado, apenas a explicação do resultado.",
      "Toda mensagem orienta a avaliação com um profissional de saúde.",
      "Valores de referência vêm da base de conhecimento, não do modelo.",
      level === "verde"
        ? "Risco baixo: liberado para envio automático."
        : "Risco moderado ou crítico: retido para validação da enfermagem.",
    ],
  };
}

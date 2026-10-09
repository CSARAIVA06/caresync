// Cliente da API CareSync NLP Core (repositório caresync-nlp-core).
// Sem NEXT_PUBLIC_TRIAGE_API_URL, ou se a API falhar, o simulador usa o motor local (triage.js).
import { MARKERS } from "./triage";

const API_URL = process.env.NEXT_PUBLIC_TRIAGE_API_URL?.replace(/\/+$/, "");

export const apiEnabled = Boolean(API_URL);

const LEVEL_FROM_API = { NORMAL: "verde", ATENCAO: "amarelo", CRITICO: "vermelho" };
const DIRECTION_FROM_API = { baixo: "low", alto: "high" };
const MARKER_BY_ID = Object.fromEntries(MARKERS.map((m) => [m.id, m]));

// Converte a resposta da API para o mesmo formato de analyzeReport().
// Retorna null quando a API não reconhece nenhum marcador (HTTP 400).
export async function analyzeReportRemote(text, patientName, { timeoutMs = 15000 } = {}) {
  const res = await fetch(`${API_URL}/api/v1/triagem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto_laudo: text, paciente_nome: patientName?.trim() || null }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (res.status === 400) return null;
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  const data = await res.json();
  return {
    level: LEVEL_FROM_API[data.classificacao_geral],
    examType: data.tipo_exame,
    message: data.mensagem_humanizada,
    sources: data.fontes,
    guardrails: data.guardrails,
    items: data.exames_extraidos.map((i) => ({
      // A referência exibida é a usada pela API (do laudo, quando informada).
      marker: { ...MARKER_BY_ID[i.id], id: i.id, name: i.parametro, unit: i.unidade, ref: [i.ref_min, i.ref_max] },
      value: i.valor,
      status: LEVEL_FROM_API[i.status_item],
      direction: DIRECTION_FROM_API[i.direcao] ?? null,
    })),
    engine: { llm: "api-llm", ptt5: "api-ptt5" }[data.fonte_mensagem] ?? "api",
  };
}

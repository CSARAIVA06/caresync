export const technologies = [
  {
    id: "chatbots",
    title: "Agendamento Inteligente & Chatbots (IA Conversacional)",
    what: "Confirmação automática de consultas via WhatsApp/SMS, triagem inicial de sintomas, remarcações e orientação pré-exames.",
    benefit: "Redução de até 40% na taxa de não comparência (no-show) e descongestionamento dos canais telefónicos.",
    metric: "40%",
    metricLabel: "menos faltas",
  },
  {
    id: "checkin",
    title: "Triagem Digital e Quiosques de Self-Check-in",
    what: "Totens e aplicações móveis para check-in rápido, leitura de documentos e recolha inicial de dados vitais antes da entrada nas urgências.",
    benefit: "Redução significativa do tempo de fila na receção e aceleração no encaminhamento por risco.",
    metric: "-30%",
    metricLabel: "tempo de fila",
  },
  {
    id: "pep",
    title: "Prontuário Eletrónico do Paciente (PEP) com IA",
    what: "Centralização de exames, histórico médico, prescrições eletrónicas e alertas automáticos sobre reações adversas ou interações medicamentosas.",
    benefit: "Eliminação do uso de papel, redução de erros médicos e rapidez no acesso ao historial do paciente.",
    metric: "100%",
    metricLabel: "digital",
  },
  {
    id: "telemedicina",
    title: "Telemedicina e Triagem Remota",
    what: "Consultas virtuais e pré-avaliação à distância para casos de menor gravidade.",
    benefit: "Desobstrução das urgências hospitalares físicas.",
    metric: "24/7",
    metricLabel: "acesso remoto",
  },
  {
    id: "leitos",
    title: "Gestão de Leitos e Fluxo de Pacientes (IoT e RTLS)",
    what: "Identificação por radiofrequência ou etiquetas inteligentes para monitorizar a alocação de leitos em tempo real e a movimentação do paciente.",
    benefit: "Redução do tempo de espera entre a alta e a entrada de um novo paciente.",
    metric: "Tempo real",
    metricLabel: "ocupação de leitos",
  },
];

export const roadmap = [
  {
    id: "mapeamento",
    title: "Mapeamento da Jornada do Paciente",
    description:
      "Identificar os principais gargalos (ex.: tempo excessivo na receção, demora na entrega de resultados de exames ou filas no acolhimento).",
  },
  {
    id: "integracao",
    title: "Integração de Sistemas (Interoperabilidade)",
    description:
      "Garantir que o sistema de agendamento, os totens da receção e o Prontuário Eletrónico comuniquem perfeitamente entre si em tempo real.",
  },
  {
    id: "capacitacao",
    title: "Capacitação e Formação das Equipas",
    description:
      "Treinar rececionistas, enfermeiros e médicos para utilizar as novas ferramentas, reforçando que a automação serve como apoio e não como substituição do trabalho humano.",
  },
  {
    id: "seguranca",
    title: "Garantia de Segurança e Conformidade",
    description:
      "Implementar protocolos rígidos de proteção de dados (como o RGPD ou LGPD) para garantir a privacidade e segurança das informações médicas confidenciais.",
  },
  {
    id: "humanizacao",
    title: "Manutenção do Foco na Humanização",
    description:
      "Garantir que o atendimento presencial continue acolhedor para doentes que necessitam de apoio especial (ex.: idosos ou casos urgentes de elevada complexidade).",
  },
];

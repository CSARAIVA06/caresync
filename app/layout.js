import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "CareSync | Triagem Inteligente Pós-Exame Laboratorial",
  description:
    "Protótipo acadêmico (Fatec Jundiaí, Ciência de Dados) que lê laudos laboratoriais, classifica o risco e gera mensagens claras e empáticas para o paciente, com supervisão da enfermagem.",
  keywords: [
    "triagem laboratorial",
    "PLN",
    "RAG",
    "human-in-the-loop",
    "health literacy",
    "IA na saúde",
    "Fatec Jundiaí",
  ],
  openGraph: {
    title: "CareSync | Triagem Inteligente Pós-Exame Laboratorial",
    description:
      "Transformando laudos complexos em comunicação clara, empática e segura para o paciente.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}

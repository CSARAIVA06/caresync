import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CareSync | Automação Inteligente no Atendimento Hospitalar",
  description:
    "Como a transformação digital e a automação do fluxo de atendimento reduzem gargalos, otimizam o tempo de espera e elevam a precisão da triagem hospitalar — sem substituir o cuidado humano.",
  keywords: [
    "automação hospitalar",
    "transformação digital em saúde",
    "triagem digital",
    "prontuário eletrônico",
    "telemedicina",
    "gestão de leitos",
    "IA na saúde",
  ],
  openGraph: {
    title: "CareSync | Automação Inteligente no Atendimento Hospitalar",
    description:
      "Tecnologia que liberta as equipas médicas de tarefas burocráticas para devolver o foco ao atendimento humanizado.",
    type: "article",
    locale: "pt_PT",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

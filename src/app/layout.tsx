import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Display: Cinzel — traço mais denso, presença de inscrição; evita Cormorant/Playfair genéricos. */
const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Veluxa",
    template: "%s · Veluxa",
  },
  description:
    "ERP para funerárias — atendimento, agenda, estoque, contratos e faturamento em um único sistema.",
  icons: {
    icon: "/brand/mark-dark.png",
    apple: "/brand/mark-dark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sourceSans.variable} ${cinzel.variable} ${jetbrains.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

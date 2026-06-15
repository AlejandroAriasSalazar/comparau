import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "comparaU.com — Compara universidades de Colombia con datos oficiales",
  description:
    "Compara universidades y programas de Colombia con datos 100% oficiales: SNIES, ICFES Saber Pro, OLE (empleabilidad e ingreso) y SPADIES. Verificable y sin rankings inventados.",
  metadataBase: new URL("https://comparau.com"),
  openGraph: {
    title: "comparaU.com — Compara universidades de Colombia",
    description: "Datos oficiales de calidad, empleabilidad y permanencia. Verificable.",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

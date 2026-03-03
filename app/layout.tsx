import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/providers/SessionProvider";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Letterboxd de Música",
  description: "Califica tus discos favoritos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        <SessionProvider>

          {/* 2. CREAMOS EL LAYOUT DIVIDIDO (Flexbox) */}
          <div className="flex h-screen overflow-hidden">

            {/* Barra lateral a la izquierda */}
            <Sidebar />

            {/* Contenido principal a la derecha (con scroll independiente) */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>

          </div>

        </SessionProvider>
      </body>
    </html>
  );
}
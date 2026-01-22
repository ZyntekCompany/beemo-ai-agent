import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Vera Widget — Asistente IA para soporte al cliente",
  description:
    "Vera automatiza el soporte al cliente: respuestas automáticas, clasificación de tickets, escalado y analíticas.",
  keywords: [
    "asistente-ia",
    "soporte-al-cliente",
    "automatizacion",
    "chatbot",
    "NLP",
    "tickets",
  ],
  authors: [{ name: "Equipo Zyntek", url: "jamesrgal@gmail.com" }],
  metadataBase: new URL("https://your-domain.example"),
  openGraph: {
    title: "Vera — Asistente IA para soporte al cliente",
    description:
      "Automatiza respuestas, clasifica tickets y aporta analíticas para mejorar SLA y satisfacción.",
    url: "https://your-domain.example",
    siteName: "Vera",
    images: [
      { url: "/web-app-manifest-512x512.png", alt: "Vera — asistente IA" },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vera — Asistente IA para soporte al cliente",
    description:
      "Automatiza respuestas, clasifica tickets y mejora la experiencia del cliente.",
    images: ["/web-app-manifest-512x512.png"],
  },
  themeColor: "#0EA5A4",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-96x96.png",
    apple: "/apple-touch-icon.png",
    other: [
      { url: "/favicon.svg", rel: "icon", sizes: "any" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <div className="w-screen h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import { EB_Garamond } from "next/font/google"
import { cn } from "@/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const eb_garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "MonitorFlow - Monitor Your Events",
    template: "%s | MonitorFlow"
  },
  description: "Monitor and track your events in real-time with MonitorFlow. Get instant notifications and detailed analytics for your application events.",
  keywords: ["event monitoring", "real-time tracking", "application monitoring", "event analytics"],
  authors: [{ name: "MonitorFlow Team" }],
  creator: "MonitorFlow",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "MonitorFlow - Monitor Your Events",
    description: "Monitor and track your events in real-time with MonitorFlow. Get instant notifications and detailed analytics for your application events.",
    siteName: "MonitorFlow"
  },
  twitter: {
    card: "summary_large_image",
    title: "MonitorFlow - Monitor Your Events",
    description: "Monitor and track your events in real-time with MonitorFlow. Get instant notifications and detailed analytics for your application events."
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#ffffff",
  manifest: "/site.webmanifest"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={cn(inter.variable, eb_garamond.variable)}>
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </head>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="theme">
          <body className="min-h-[calc(100vh-1px)] flex flex-col font-sans bg-background text-foreground antialiased">
            <main className="relative flex-1 flex flex-col">
              <Providers>{children}</Providers>
            </main>
            <Toaster />
          </body>
        </ThemeProvider>
      </html>
    </ClerkProvider>
  )
}

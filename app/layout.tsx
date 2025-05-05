import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "St. Agnes Parish Management System",
  description: "Parish management system for St. Agnes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <footer className="py-4 text-center text-sm text-muted-foreground border-t">
            <p>powered by Simboti inc</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}

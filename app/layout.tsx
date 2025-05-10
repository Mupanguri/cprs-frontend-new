import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./global.css" // Corrected import path
import { ThemeProvider } from "@/components/theme-provider"
import SessionProviderWrapper from "@/components/SessionProviderWrapper" // Import the wrapper

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
        {/* Wrap ThemeProvider's children with SessionProviderWrapper */}
        <SessionProviderWrapper> 
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            {/* Footer might be better outside ThemeProvider if it doesn't need theme context, but okay here too */}
            <footer className="py-4 text-center text-sm text-muted-foreground border-t">
              <p>powered by Simboti inc</p>
            </footer>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}

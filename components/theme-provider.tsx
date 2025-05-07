"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Removed explicit type import as it might not be available or needed in this version

// Pass props through without explicit typing for ThemeProviderProps
export function ThemeProvider({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

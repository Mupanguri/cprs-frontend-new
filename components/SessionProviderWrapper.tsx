"use client";

import { SessionProvider } from "next-auth/react";
import type React from "react";

interface Props {
  children: React.ReactNode;
}

// This wrapper component is needed because SessionProvider uses React Context,
// which requires it to be a Client Component in the Next.js App Router.
export default function SessionProviderWrapper({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}

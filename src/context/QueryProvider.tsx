"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server components deliver the first paint, so a short window of
        // freshness keeps Query from immediately refetching what we just sent.
        staleTime: 30 * 1000,
        // Data can change from another tab or teammate; refetching on focus
        // is cheap because staleTime already suppresses the noisy case.
        refetchOnWindowFocus: true,
        // Keep previous pages around so paging back is instant.
        gcTime: 10 * 60 * 1000,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always a fresh client so requests never share cache.
    return makeQueryClient()
  }
  // Browser: reuse one client across renders.
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

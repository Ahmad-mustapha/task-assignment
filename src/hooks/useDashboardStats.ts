"use client"

import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { DashboardStats } from "@/types"

export function useDashboardStats(initialData?: DashboardStats) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
    initialData,
  })
}

"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { ReactNode } from "react";
import { isTodayMonday } from "@/lib/date";

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : null,
});

// On Mondays, always refetch to ensure users get fresh menu data
const isMonday = typeof window !== "undefined" && isTodayMonday();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: isMonday ? 5 * 60 * 1000 : 30 * 60 * 1000,
      gcTime: isMonday ? 15 * 60 * 1000 : 60 * 60 * 1000,
      refetchOnWindowFocus: false, // Reduce unnecessary fetches
      refetchOnReconnect: false, // Don't refetch on reconnect
      refetchOnMount: isMonday ? "always" : false, // Always refetch on Monday page loads
      retry: 1, // Only retry once for faster failure feedback
      networkMode: 'offlineFirst', // Use cached data when offline
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

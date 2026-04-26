"use client";

import * as React from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { ReactNode } from "react";
import { QUERY_PERSIST_STORAGE_KEY } from "@/lib/queryPersistence";

const persister = createSyncStoragePersister({
  key: QUERY_PERSIST_STORAGE_KEY,
  storage: typeof window !== "undefined" ? window.localStorage : null,
});

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
            networkMode: "offlineFirst",
          },
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, buster: "v3" }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

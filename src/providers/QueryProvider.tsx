"use client";

import * as React from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { PersistedClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { ReactNode } from "react";
import { QUERY_PERSIST_STORAGE_KEY } from "@/lib/queryPersistence";
import { hasMenuDays, isValidWeekMenu } from "@/lib/menuWeek";

// The persisted cache is untrusted input like any other: localStorage can
// hold a week written by an older build or corrupted in place, and a restored
// week renders before any refetch completes. Dropping bad entries at restore
// just means those queries fetch as if they were never cached. A cache that
// fails to parse at all is discarded by the persist layer itself.
function deserializeValidated(cached: string): PersistedClient {
  const client = JSON.parse(cached) as PersistedClient;
  client.clientState.queries = client.clientState.queries.filter((query) => {
    if (query.queryKey[0] !== "weekMenu") return true;
    const { data } = query.state;
    return isValidWeekMenu(data) && hasMenuDays(data);
  });
  return client;
}

const persister = createSyncStoragePersister({
  key: QUERY_PERSIST_STORAGE_KEY,
  storage: typeof window !== "undefined" ? window.localStorage : null,
  deserialize: deserializeValidated,
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
      }),
  );

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, buster: "v4" }}>
      {children}
    </PersistQueryClientProvider>
  );
}

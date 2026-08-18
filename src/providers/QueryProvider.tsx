"use client";

import * as React from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { PersistedClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { ReactNode } from "react";
import { QUERY_PERSIST_STORAGE_KEY } from "@/lib/queryPersistence";
import { hasMenuDays, parseWeekMenu } from "@/lib/menuWeek";
import type { JsonValue } from "@/lib/json";

// The persisted cache is untrusted input like any other: localStorage can
// hold a week written by an older build or corrupted in place, and a restored
// week renders before any refetch completes. Dropping bad entries at restore
// just means those queries fetch as if they were never cached. A cache that
// fails to parse at all is discarded by the persist layer itself.
function deserializeValidated(cached: string): PersistedClient {
  // SAFETY: `cached` is the string this same persister wrote under a key it
  // owns, via JSON.stringify of a PersistedClient — the shape is this app's,
  // not a third party's. It is still treated as suspect: the only field read
  // below is guarded by the Array.isArray check, and each week is re-parsed.
  const client = JSON.parse(cached) as PersistedClient;
  // An unexpected overall shape must not throw here — the persist layer would
  // respond by discarding the entire cache when at worst only the bad entries
  // deserve to go. Hand it back and let the buster/version checks handle it.
  if (!Array.isArray(client?.clientState?.queries)) return client;
  client.clientState.queries = client.clientState.queries.flatMap((query) => {
    if (query.queryKey[0] !== "weekMenu") return [query];
    // SAFETY: `client` is the result of JSON.parse, so every value nested in it
    // is by construction a JSON value. parseWeekMenu rejects anything that is
    // not actually a week.
    const week = parseWeekMenu(query.state.data as JsonValue);
    if (week === null || !hasMenuDays(week)) return [];
    // Restore the parsed week rather than the raw one, so a cache written in the
    // older item format is upgraded on the way in instead of reaching the UI.
    return [{ ...query, state: { ...query.state, data: week } }];
  });
  return client;
}

const persister = createSyncStoragePersister({
  key: QUERY_PERSIST_STORAGE_KEY,
  storage: "window" in globalThis ? window.localStorage : null,
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

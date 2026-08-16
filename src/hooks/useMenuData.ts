"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { isTodayMonday } from "@/lib/date";
import type { WeekMenu, Meal, MealKey, MenuItem } from "@/lib/types";
import {
  fetchStaticManifest,
  fetchStaticWeek,
  getWeeksForType,
  normalizeWeekIdToStartDate,
  weeksCoverToday,
  type MenuType,
} from "@/lib/staticMenuBundle";
import { EmptyWeekError, hasMenuDays, isValidWeekMenu } from "@/lib/menuWeek";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const API_BASE = process.env.NEXT_PUBLIC_MENU_API_URL ?? "https://tikm.coolstuff.work";

export type { MenuType };

// Re-export types for convenience
export type { WeekMenu, Meal, MealKey, MenuItem };

export interface WeekSummary {
  week: string;
  foodCourt: string;
  startDate: string;
  endDate: string;
  numDays: number;
  weekMonday: string;
  lastModified?: string | null;
}

export interface HistoryResponse {
  weeks: WeekSummary[];
}

const MONDAY_HISTORY_GC_MS = 15 * 60 * 1000;
const NON_MONDAY_HISTORY_GC_MS = 24 * 60 * 60 * 1000;

async function fetchLiveHistory(): Promise<HistoryResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/api/history?v=2`);
  if (!res.ok) throw new Error("Failed to fetch weeks info");
  return res.json();
}

export function useWeeksInfo() {
  const isMonday = isTodayMonday();
  return useQuery({
    queryKey: ["weeksInfo"],
    queryFn: async (): Promise<HistoryResponse> => {
      try {
        const manifest = await fetchStaticManifest();
        const weeks = manifest.normal.weeks;

        // A bundle whose newest week already ended is behind the live API: the
        // menu was uploaded after the last build. Without this the app is stuck
        // showing the stale-week notice until someone redeploys, and Refresh
        // Data can't help because it only re-reads the same manifest.
        if (weeksCoverToday(weeks)) return { weeks };

        try {
          const live = await fetchLiveHistory();
          if (live.weeks?.length) return live;
        } catch {
          // Keep the baked weeks: stale data beats no data.
        }
        return { weeks };
      } catch {
        const live = await fetchLiveHistory();
        // An empty week list is the same manufactured "success" the menu
        // endpoints produce on failure; treat it as an error so it is retried
        // rather than persisted as the truth.
        if (!live.weeks?.length) throw new Error("Menu history is empty");
        return live;
      }
    },
    staleTime: 0,
    gcTime: isMonday ? MONDAY_HISTORY_GC_MS : NON_MONDAY_HISTORY_GC_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

async function fetchWeekMenu(weekId: string | null, menuType: MenuType): Promise<WeekMenu> {
  const endpoint = menuType === "jain" ? "jain-menu" : "menu";
  const startDate = normalizeWeekIdToStartDate(weekId);

  try {
    const manifest = await fetchStaticManifest();
    const entry = getWeeksForType(manifest, menuType).find(
      (week) => week.startDate === startDate,
    );
    if (entry) {
      const staticWeek: unknown = await fetchStaticWeek(entry);
      if (isValidWeekMenu(staticWeek) && hasMenuDays(staticWeek)) return staticWeek;
    }
  } catch {
    // Fall through to the live API for local development or incomplete static bundles.
  }

  const res = await fetchWithTimeout(`${API_BASE}/api/${endpoint}?weekStart=${startDate}&v=2`);
  // 404 is the API saying this week has no menu of this type — an absence, not
  // a failure. A 503 or anything else is a real fault and stays a plain error
  // so it retries and falls back to the baked bundle.
  if (res.status === 404) throw new EmptyWeekError(weekId);
  if (!res.ok) throw new Error(`Failed to fetch week menu: ${weekId}`);

  const week: unknown = await res.json();
  // A structurally wrong payload is a fault, not an absence — keep it a plain
  // error so it retries instead of reading as "no menu this week".
  if (!isValidWeekMenu(week)) throw new Error(`Malformed week menu payload: ${weekId}`);
  // Older API builds report that same absence as a 200 with an empty menu.
  // Rejecting it here keeps the payload out of the persisted cache, so one
  // momentary backend blip can't follow the visitor around for days.
  if (!hasMenuDays(week)) throw new EmptyWeekError(weekId);
  return week;
}

function retryWeekQuery(failureCount: number, error: unknown) {
  // An empty week is a definite answer, not a flake — retrying just stalls the
  // UI before it can fall back.
  if (error instanceof EmptyWeekError) return false;
  return failureCount < 1;
}

export function useWeekMenu(weekId: string | null, menuType: MenuType = "normal") {
  const isMonday = isTodayMonday();

  return useQuery({
    queryKey: ["weekMenu", weekId, menuType],
    queryFn: () => fetchWeekMenu(weekId, menuType),
    staleTime: 0,
    gcTime: isMonday ? 15 * 60 * 1000 : 60 * 60 * 1000,
    enabled: !!weekId,
    retry: retryWeekQuery,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

export function useOfflineStatus() {
  return useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot);
}

export function usePrefetchWeekMenu() {
  const queryClient = useQueryClient();

  return (weekId: string, menuType: MenuType = "normal") => {
    queryClient.prefetchQuery({
      queryKey: ["weekMenu", weekId, menuType],
      queryFn: () => fetchWeekMenu(weekId, menuType),
      retry: retryWeekQuery,
    });
  };
}

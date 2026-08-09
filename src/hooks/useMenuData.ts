"use client";

import { useQuery } from "@tanstack/react-query";
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
  const res = await fetch(`${API_BASE}/api/history?v=2`);
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
        return fetchLiveHistory();
      }
    },
    staleTime: 0,
    gcTime: isMonday ? MONDAY_HISTORY_GC_MS : NON_MONDAY_HISTORY_GC_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useWeekMenu(weekId: string | null, menuType: MenuType = 'normal', initialData?: WeekMenu) {
  const isMonday = isTodayMonday();
  const endpoint = menuType === 'jain' ? 'jain-menu' : 'menu';

  return useQuery({
    // Normalize so "2026-08-03" and "2026-08-03_to_2026-08-09" share one entry.
    queryKey: ["weekMenu", normalizeWeekIdToStartDate(weekId), menuType],
    queryFn: async (): Promise<WeekMenu> => {
      const startDate = normalizeWeekIdToStartDate(weekId);
      try {
        const manifest = await fetchStaticManifest();
        const entry = getWeeksForType(manifest, menuType).find((week) => week.startDate === startDate);
        if (entry) return fetchStaticWeek(entry);
      } catch {
        // Fall through to the live API for local development or incomplete static bundles.
      }

      const res = await fetch(`${API_BASE}/api/${endpoint}?weekStart=${startDate}&v=2`);
      if (!res.ok) throw new Error(`Failed to fetch week menu: ${weekId}`);
      return res.json();
    },
    // Short staleTime, never Infinity: a menu revision keeps this query key but
    // moves to a new content-hashed file via the manifest, so in-session
    // revalidation must stay possible. Baked initialData starts fresh, so it
    // isn't re-fetched right after hydration; later remounts revalidate.
    staleTime: 60_000,
    gcTime: isMonday ? 15 * 60 * 1000 : 60 * 60 * 1000,
    enabled: !!weekId,
    initialData,
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

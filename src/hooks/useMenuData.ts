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

export function useWeeksInfo() {
  const isMonday = isTodayMonday();
  return useQuery({
    queryKey: ["weeksInfo"],
    queryFn: async (): Promise<HistoryResponse> => {
      try {
        const manifest = await fetchStaticManifest();
        return { weeks: manifest.normal.weeks };
      } catch {
        const res = await fetch(`${API_BASE}/api/history`);
        if (!res.ok) throw new Error("Failed to fetch weeks info");
        return res.json();
      }
    },
    staleTime: 0,
    gcTime: isMonday ? MONDAY_HISTORY_GC_MS : NON_MONDAY_HISTORY_GC_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useWeekMenu(weekId: string | null, menuType: MenuType = 'normal') {
  const isMonday = isTodayMonday();
  const endpoint = menuType === 'jain' ? 'jain-menu' : 'menu';

  return useQuery({
    queryKey: ["weekMenu", weekId, menuType],
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
    staleTime: 0,
    gcTime: isMonday ? 15 * 60 * 1000 : 60 * 60 * 1000,
    enabled: !!weekId,
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

  return (weekId: string, menuType: MenuType = 'normal') => {
    const endpoint = menuType === 'jain' ? 'jain-menu' : 'menu';

    queryClient.prefetchQuery({
      queryKey: ["weekMenu", weekId, menuType],
      queryFn: async (): Promise<WeekMenu> => {
        const startDate = normalizeWeekIdToStartDate(weekId);
        try {
          const manifest = await fetchStaticManifest();
          const entry = getWeeksForType(manifest, menuType).find((week) => week.startDate === startDate);
          if (entry) return fetchStaticWeek(entry);
        } catch {
          // Fall through to live API fallback.
        }

        const res = await fetch(`${API_BASE}/api/${endpoint}?weekStart=${startDate}&v=2`);
        if (!res.ok) throw new Error(`Failed to prefetch week menu: ${weekId}`);
        return res.json();
      },
    });
  };
}

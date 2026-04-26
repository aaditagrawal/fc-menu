"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { isTodayMonday } from "@/lib/date";
import type { WeekMenu, Meal, MealKey, MenuItem } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_MENU_API_URL ?? "https://tikm.coolstuff.work";

// Menu type: 'normal' or 'jain'
export type MenuType = 'normal' | 'jain';

// Re-export types for convenience
export type { WeekMenu, Meal, MealKey, MenuItem };

export interface WeekSummary {
  week: string;
  foodCourt: string;
  startDate: string;
  endDate: string;
  numDays: number;
  weekMonday: string;
  lastModified: string;
}

export interface HistoryResponse {
  weeks: WeekSummary[];
}

const MONDAY_HISTORY_STALE_MS = 5 * 60 * 1000;
const NON_MONDAY_HISTORY_STALE_MS = 12 * 60 * 60 * 1000;
const MONDAY_HISTORY_GC_MS = 15 * 60 * 1000;
const NON_MONDAY_HISTORY_GC_MS = 24 * 60 * 60 * 1000;

export function useWeeksInfo() {
  const isMonday = isTodayMonday();
  return useQuery({
    queryKey: ["weeksInfo"],
    queryFn: async (): Promise<HistoryResponse> => {
      const res = await fetch(`${API_BASE}/api/history`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch weeks info");
      return res.json();
    },
    // Monday stays aggressive; the rest of the week can lean on persisted cache.
    staleTime: isMonday ? MONDAY_HISTORY_STALE_MS : NON_MONDAY_HISTORY_STALE_MS,
    gcTime: isMonday ? MONDAY_HISTORY_GC_MS : NON_MONDAY_HISTORY_GC_MS,
    refetchOnMount: isMonday ? "always" : false,
    refetchOnWindowFocus: false,
  });
}

export function useWeekMenu(weekId: string | null, menuType: MenuType = 'normal') {
  const isMonday = isTodayMonday();
  const endpoint = menuType === 'jain' ? 'jain-menu' : 'menu';

  return useQuery({
    queryKey: ["weekMenu", weekId, menuType],
    queryFn: async (): Promise<WeekMenu> => {
      const startDate = weekId?.split("_")[0] ?? "";
      // Always use V2 format for tag support
      const res = await fetch(`${API_BASE}/api/${endpoint}?weekStart=${startDate}&v=2`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch week menu: ${weekId}`);
      return res.json();
    },
    // On Monday, use shorter cache and always refetch on mount to get fresh data
    staleTime: isMonday ? 5 * 60 * 1000 : 30 * 60 * 1000,
    gcTime: isMonday ? 15 * 60 * 1000 : 60 * 60 * 1000,
    enabled: !!weekId,
    refetchOnMount: isMonday ? "always" : false,
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
        const startDate = weekId.split("_")[0];
        const res = await fetch(`${API_BASE}/api/${endpoint}?weekStart=${startDate}&v=2`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to prefetch week menu: ${weekId}`);
        return res.json();
      },
    });
  };
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

export function useWeeksInfo() {
  const isMonday = isTodayMonday();
  return useQuery({
    queryKey: ["weeksInfo"],
    queryFn: async (): Promise<HistoryResponse> => {
      const res = await fetch(`${API_BASE}/api/history`);
      if (!res.ok) throw new Error("Failed to fetch weeks info");
      return res.json();
    },
    // On Monday, use shorter cache and always refetch on mount to get fresh data
    staleTime: isMonday ? 5 * 60 * 1000 : 30 * 60 * 1000,
    gcTime: isMonday ? 15 * 60 * 1000 : 60 * 60 * 1000,
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
      const res = await fetch(`${API_BASE}/api/${endpoint}?weekStart=${startDate}&v=2`);
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

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}

export function usePrefetchWeekMenu() {
  const queryClient = useQueryClient();

  return (weekId: string, menuType: MenuType = 'normal') => {
    const endpoint = menuType === 'jain' ? 'jain-menu' : 'menu';

    queryClient.prefetchQuery({
      queryKey: ["weekMenu", weekId, menuType],
      queryFn: async (): Promise<WeekMenu> => {
        const startDate = weekId.split("_")[0];
        const res = await fetch(`${API_BASE}/api/${endpoint}?weekStart=${startDate}&v=2`);
        if (!res.ok) throw new Error(`Failed to prefetch week menu: ${weekId}`);
        return res.json();
      },
    });
  };
}

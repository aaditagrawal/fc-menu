"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { isTodayMonday } from "@/lib/date";

const API_BASE = process.env.NEXT_PUBLIC_MENU_API_URL ?? "https://tikm.coolstuff.work";

export type MealKey = "breakfast" | "lunch" | "snacks" | "dinner";

export interface Meal {
  name: string;
  startTime: string;
  endTime: string;
  items: string[];
}

export interface DayMenu {
  day: string;
  meals: Record<MealKey, Meal>;
}

export interface WeekMenu {
  foodCourt: string;
  week: string;
  menu: Record<string, DayMenu>;
}

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
  return useQuery({
    queryKey: ["weeksInfo"],
    queryFn: async (): Promise<HistoryResponse> => {
      const res = await fetch(`${API_BASE}/api/history`);
      if (!res.ok) throw new Error("Failed to fetch weeks info");
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - menu data rarely changes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnMount: false, // Don't refetch if we have cached data
    refetchOnWindowFocus: false, // Avoid unnecessary refetches
  });
}

export function useWeekMenu(weekId: string | null) {
  const isMonday = isTodayMonday();
  return useQuery({
    queryKey: ["weekMenu", weekId],
    queryFn: async (): Promise<WeekMenu> => {
      const startDate = weekId?.split("_")[0] ?? "";
      const res = await fetch(`${API_BASE}/api/menu?weekStart=${startDate}`);
      if (!res.ok) throw new Error(`Failed to fetch week menu: ${weekId}`);
      return res.json();
    },
    staleTime: isMonday ? 0 : 30 * 60 * 1000,
    gcTime: isMonday ? 0 : 60 * 60 * 1000,
    enabled: !!weekId,
    refetchOnMount: isMonday,
    refetchOnWindowFocus: isMonday,
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

  return (weekId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["weekMenu", weekId],
      queryFn: async (): Promise<WeekMenu> => {
        const startDate = weekId.split("_")[0];
        const res = await fetch(`${API_BASE}/api/menu?weekStart=${startDate}`);
        if (!res.ok) throw new Error(`Failed to prefetch week menu: ${weekId}`);
        return res.json();
      },
    });
  };
}

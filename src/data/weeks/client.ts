"use client";

import type { WeekMenu, WeekMeta } from "@/lib/types";
import { cache, CACHE_KEYS, CACHE_TTL, clearAllCache } from "@/lib/cache";
import { findCurrentOrUpcomingMeal } from "@/lib/date";

export type WeekId = string;

export async function fetchWeeksInfo(): Promise<{ weekIds: WeekId[]; meta: WeekMeta[] }>{
  const cacheKey = CACHE_KEYS.weeksInfo();

  // Try to get from cache first
  const cached = cache.get<{ weekIds: WeekId[]; meta: WeekMeta[] }>(cacheKey);
  if (cached) {
    console.log('📋 Using cached weeks info');
    return cached;
  }

  // Fetch from API if not cached or expired
  console.log('🌐 Fetching fresh weeks info');
  const res = await fetch(`/api/weeks`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch week ids");
  const data = (await res.json()) as { weekIds: WeekId[]; meta: WeekMeta[] };

  // Cache the response
  cache.set(cacheKey, data, CACHE_TTL.WEEKS_INFO);

  return data;
}

export async function getWeekMenuClient(id: WeekId): Promise<WeekMenu> {
  const cacheKey = CACHE_KEYS.weekMenu(id);

  // Try to get from cache first
  const cached = cache.get<WeekMenu>(cacheKey);
  if (cached) {
    console.log(`📋 Using cached week menu for ${id}`);
    return cached;
  }

  // Fetch from API if not cached or expired
  console.log(`🌐 Fetching fresh week menu for ${id}`);
  const res = await fetch(`/api/week/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch week menu");
  const data = (await res.json()) as WeekMenu;

  // Cache the response
  cache.set(cacheKey, data, CACHE_TTL.WEEK_MENU);

  return data;
}

export function getWeeksByYearFromList(all: WeekId[], year: string): WeekId[] {
  return all.filter((id) => id.startsWith(`${year}-`)).sort();
}

export function getAllYearsFromList(all: WeekId[]): string[] {
  const set = new Set<string>();
  for (const id of all) set.add(id.slice(0, 4));
  return Array.from(set).sort();
}

export function getLatestWeekIdForYearFromList(all: WeekId[], year: string): WeekId | null {
  const weeks = getWeeksByYearFromList(all, year);
  if (weeks.length === 0) return null;
  return weeks[weeks.length - 1];
}

// Smart refresh functions - only refresh when no upcoming meal data is available
export async function fetchWeeksInfoFresh(): Promise<{ weekIds: WeekId[]; meta: WeekMeta[] }>{
  const cacheKey = CACHE_KEYS.weeksInfo();

  // Force fresh fetch with cache-busting parameter and timestamp
  console.log('🔄 Force fetching fresh weeks info');
  const timestamp = Date.now();
  const res = await fetch(`/api/weeks?fresh=true&t=${timestamp}`, { 
    cache: "no-store",
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  if (!res.ok) throw new Error("Failed to fetch week ids");
  const data = (await res.json()) as { weekIds: WeekId[]; meta: WeekMeta[] };

  // Update cache with fresh data
  cache.set(cacheKey, data, CACHE_TTL.WEEKS_INFO);

  return data;
}

export async function getWeekMenuClientFresh(id: WeekId): Promise<WeekMenu> {
  const cacheKey = CACHE_KEYS.weekMenu(id);

  // Force fresh fetch with cache-busting parameter and timestamp
  console.log(`🔄 Force fetching fresh week menu for ${id}`);
  const timestamp = Date.now();
  const res = await fetch(`/api/week/${id}?fresh=true&t=${timestamp}`, { 
    cache: "no-store",
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  if (!res.ok) throw new Error("Failed to fetch week menu");
  const data = (await res.json()) as WeekMenu;

  // Update cache with fresh data
  cache.set(cacheKey, data, CACHE_TTL.WEEK_MENU);

  return data;
}

// Smart refresh function - only refreshes if no upcoming meal data is available
export async function refreshDataIfNeeded(week: WeekMenu): Promise<boolean> {
  // Check if there's upcoming meal data
  const upcomingMeal = findCurrentOrUpcomingMeal(week);

  if (upcomingMeal) {
    // We have upcoming meal data, no need to refresh
    console.log('✅ Upcoming meal data available, no refresh needed');
    return false;
  }

  // No upcoming meal data, let's refresh
  console.log('⚠️ No upcoming meal data found, refreshing...');

  try {
    // Clear all cache first to ensure fresh data
    clearAllCache();

    // Get the latest week info
    const { weekIds } = await fetchWeeksInfoFresh();

    if (weekIds.length > 0) {
      // Get the latest week data
      const latestWeekId = weekIds[0];
      await getWeekMenuClientFresh(latestWeekId);

      console.log('✅ Data refreshed successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to refresh data:', error);
  }

  return false;
}


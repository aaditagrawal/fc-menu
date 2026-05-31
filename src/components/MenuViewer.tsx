"use client";

import * as React from "react";
import type { MealKey, WeekMenu } from "@/lib/types";
import {
  findCurrentOrUpcomingMeal,
  pickHighlightMealForDay,
  getISTNow,
  formatDateKey,
  sortDateKeysAsc,
  getMondayDateKeyContainingIST,
} from "@/lib/date";
import { InlineSelect } from "@/components/InlineSelect";
import { MealCarousel, type MealCarouselHandle } from "@/components/MealCarousel";
import { useWeeksInfo, useWeekMenu } from "@/hooks/useMenuData";
import type { MenuType } from "@/hooks/useMenuData";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Grid3X3, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { DietaryFilter } from "@/components/DietaryFilter";
import { type DietaryFilter as DietaryFilterType, getFilterState, setFilterState, filterMeal } from "@/lib/filters";
import { QUERY_PERSIST_STORAGE_KEY } from "@/lib/queryPersistence";
import { useMountEffect } from "@/hooks/useMountEffect";
import { toast } from "sonner";
import { StaleWeekNotice } from "@/components/StaleWeekNotice";
import { selectEffectiveWeek } from "@/lib/staticMenuBundle";

export type WeekId = string;

const MENU_QUERY_ROOT_KEYS = new Set(["weekMenu", "weeksInfo"]);

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="text-red-500 text-sm">{message}</div>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
      >
        Try Again
      </Button>
    </div>
  );
}

function getPreferredFoodCourtFromCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    const match = document.cookie.match(/(?:^|; )preferredFoodCourt=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function persistFoodCourtCookie(foodCourt: string) {
  try {
    document.cookie = `preferredFoodCourt=${encodeURIComponent(foodCourt)}; path=/; max-age=${60 * 60 * 24 * 365}`;
  } catch {}
}

function isMenuQuery(query: { queryKey: readonly unknown[] }) {
  return MENU_QUERY_ROOT_KEYS.has(String(query.queryKey[0]));
}

async function clearPersistedMenuCaches() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(QUERY_PERSIST_STORAGE_KEY);
  } catch {}

  if (!("caches" in window)) {
    return;
  }

  try {
    const cacheNames = await window.caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith("fc-menu"))
        .map((cacheName) => window.caches.delete(cacheName))
    );
  } catch {}
}

export function MenuViewer({
  initialWeekId,
  initialWeek,
}: {
  initialWeekId?: WeekId | null;
  initialWeek?: WeekMenu | null;
}) {
  const { data: weeksInfo, isLoading: isWeeksLoading, error: weeksError } = useWeeksInfo();
  const [selectedWeekId, setSelectedWeekId] = React.useState<WeekId | null>(initialWeekId ?? null);
  const [foodCourt, setFoodCourt] = React.useState<string>(initialWeek?.foodCourt ?? "");
  const [dietaryFilter, setDietaryFilter] = React.useState<DietaryFilterType>("all");
  const [userDateKey, setUserDateKey] = React.useState<string | null>(null);
  const [userDateWeekId, setUserDateWeekId] = React.useState<WeekId | null>(null);
  const [now, setNow] = React.useState(() => getISTNow());
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshNonce, setRefreshNonce] = React.useState(0);

  const carouselRef = React.useRef<MealCarouselHandle>(null);
  const router = useRouter();

  const menuType: MenuType = dietaryFilter === 'jain' ? 'jain' : 'normal';
  const weekMenuQuery = useWeekMenu(selectedWeekId, menuType);
  const week = weekMenuQuery.data ?? (menuType === 'normal' ? initialWeek : null) ?? null;
  const queryClient = useQueryClient();

  // Mount: read persisted state + start clock
  useMountEffect(() => {
    const saved = getFilterState();
    const preferredFoodCourt = getPreferredFoodCourtFromCookie();

    setDietaryFilter(saved.dietary);
    if (preferredFoodCourt && !initialWeek?.foodCourt) {
      setFoodCourt((current) => current || preferredFoodCourt);
    }

    const interval = setInterval(() => {
      setNow(getISTNow());
    }, 60 * 1000);

    return () => clearInterval(interval);
  });

  // Derive whether user's day selection applies to the current week
  const isUserSelectedDay = userDateKey !== null && userDateWeekId === selectedWeekId;

  const weeks = weeksInfo?.weeks;
  const availableFoodCourts = React.useMemo(() => {
    if (!weeks) return [];
    const courts = new Set(weeks.map((w) => w.foodCourt));
    return Array.from(courts).sort();
  }, [weeks]);

  const resolvedFoodCourt = foodCourt || initialWeek?.foodCourt || availableFoodCourts[0] || "";

  // Derive the selected week ID from available data
  const resolvedWeekId = React.useMemo(() => {
    if (initialWeekId) return initialWeekId;
    if (!weeks || !resolvedFoodCourt) return selectedWeekId;
    const forCourt = weeks
      .filter((w) => w.foodCourt === resolvedFoodCourt);
    return selectEffectiveWeek(forCourt, formatDateKey(now))?.startDate ?? selectedWeekId;
  }, [initialWeekId, selectedWeekId, weeks, resolvedFoodCourt, now]);

  React.useEffect(() => {
    if (resolvedWeekId && resolvedWeekId !== selectedWeekId) {
      setSelectedWeekId(resolvedWeekId);
    }
  }, [resolvedWeekId, selectedWeekId]);

  // Derive dateKey: use user selection if it's for this week, otherwise auto-detect
  const dateKey = React.useMemo(() => {
    if (isUserSelectedDay && userDateKey && week?.menu[userDateKey]) {
      return userDateKey;
    }
    if (week) {
      const ptr = findCurrentOrUpcomingMeal(week, now);
      return ptr?.dateKey ?? Object.keys(week.menu)[0];
    }
    return null;
  }, [isUserSelectedDay, userDateKey, week, now]);

  const handleRefresh = React.useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setUserDateKey(null);
    setUserDateWeekId(null);
    setSelectedWeekId(initialWeekId ?? null);
    setNow(getISTNow());
    setRefreshNonce((current) => current + 1);

    try {
      await queryClient.cancelQueries({ predicate: isMenuQuery });
      await clearPersistedMenuCaches();
      router.refresh();
      await queryClient.resetQueries({ predicate: isMenuQuery, type: "all" });
      await queryClient.refetchQueries({ predicate: isMenuQuery, type: "active" });
      toast.success("Menu data fully refreshed");
    } catch {
      toast.error("Could not refresh menu data. Try again in a moment.");
    } finally {
      setIsRefreshing(false);
    }
  }, [initialWeekId, isRefreshing, queryClient, router]);

  const handleDietaryFilterChange = React.useCallback((filter: DietaryFilterType) => {
    setDietaryFilter(filter);
    setFilterState({ dietary: filter });
  }, []);

  const handleFoodCourtChange = React.useCallback((v: string) => {
    setFoodCourt(v);
    persistFoodCourtCookie(v);
  }, []);

  const handleDayChange = React.useCallback((v: string) => {
    setUserDateKey(v);
    setUserDateWeekId(selectedWeekId);
  }, [selectedWeekId]);

  const foodCourtOptions = React.useMemo(
    () => availableFoodCourts.map((fc) => ({ label: fc, value: fc })),
    [availableFoodCourts]
  );

  const sortedDateKeys = React.useMemo(() => (week ? Object.keys(week.menu).sort() : []), [week]);

  const dayOptions = React.useMemo(
    () =>
      week
        ? sortedDateKeys.map((k) => ({ label: `${week.menu[k].day} • ${k}`, value: k }))
        : [],
    [week, sortedDateKeys]
  );

  if (weeksError && !initialWeek) {
    return <ErrorState message="Failed to load menu data" />;
  }

  if (!weeksInfo && !initialWeek) {
    if (weeksInfo === undefined) {
      return null;
    }
    return <ErrorState message="No menu available" />;
  }

  if (!week) {
    if (
      isWeeksLoading ||
      weekMenuQuery.isLoading ||
      (resolvedWeekId !== null && resolvedWeekId !== selectedWeekId)
    ) {
      return null;
    }
    return <ErrorState message="No menu available" />;
  }

  const pointer = findCurrentOrUpcomingMeal(week, now);
  const fallbackDateKey = sortedDateKeys[0];

  // Compute the full week ID (e.g. "2026-02-02_to_2026-02-08") matching generateStaticParams format
  const ascDateKeys = sortDateKeysAsc(Object.keys(week.menu));
  const thisWeekMondayKey = getMondayDateKeyContainingIST(now);
  const displayedWeekMondayKey = ascDateKeys[0] ?? "";
  const showStaleWeekNotice =
    (initialWeekId == null || initialWeekId === "") &&
    displayedWeekMondayKey !== "" &&
    displayedWeekMondayKey < thisWeekMondayKey;
  const fullWeekId = `${ascDateKeys[0]}_to_${ascDateKeys[ascDateKeys.length - 1]}`;
  const resolvedDateKey =
    (dateKey && week.menu[dateKey] ? dateKey : null) ??
    (pointer?.dateKey && week.menu[pointer.dateKey] ? pointer.dateKey : null) ??
    fallbackDateKey;

  if (!resolvedDateKey) {
    return <ErrorState message="No menu days available" />;
  }

  const day = week.menu[resolvedDateKey];

  if (!day) {
    return <ErrorState message="No menu data for selected day" />;
  }

  if (!day.meals) {
    return <ErrorState message="No meals data for selected day" />;
  }

  const order: MealKey[] = ["breakfast", "lunch", "snacks", "dinner"];
  const meals = order
    .filter((k) => day.meals[k])
    .map((k) => ({
      key: k,
      meal: filterMeal(day.meals[k]!, dietaryFilter),
      timeRange: `${day.meals[k]!.startTime} – ${day.meals[k]!.endTime} IST`,
      title: k[0].toUpperCase() + k.slice(1),
    }))
    .filter((m) => m.meal.items.length > 0);

  const picked = pickHighlightMealForDay(week, resolvedDateKey, now);
  const highlightKey = (picked?.mealKey ?? (meals[0]?.key ?? "breakfast")) as MealKey;
  const isPrimaryUpcoming = Boolean(picked?.isPrimaryUpcoming);
  const isLive = Boolean(picked?.isLive);

  const isRefreshButtonBusy = isRefreshing || weekMenuQuery.isFetching;

  return (
    <div className="space-y-4 content-loaded">
      {showStaleWeekNotice && <StaleWeekNotice weekLabel={week.week} />}
      <header className="mb-4 space-y-3">
        <div className="space-y-1.5">
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.1]">
            {resolvedFoodCourt.replace(/Food Court (\d+)/, "Food Court $1")}: Menu
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {foodCourtOptions.length > 1 && (
              <InlineSelect
                label="Mess"
                value={resolvedFoodCourt}
                options={foodCourtOptions}
                onChange={(v) => handleFoodCourtChange(String(v))}
                className="text-sm"
              />
            )}
            <InlineSelect
              label="Day"
              value={resolvedDateKey}
              options={dayOptions}
              onChange={(v) => handleDayChange(String(v))}
              className="text-sm"
            />
          </div>
        </div>
        <DietaryFilter value={dietaryFilter} onChange={handleDietaryFilterChange} />
      </header>

      <MealCarousel
        key={`${resolvedWeekId}:${resolvedDateKey}:${menuType}:${refreshNonce}`}
        ref={carouselRef}
        meals={meals}
        highlightKey={highlightKey}
        isPrimaryUpcoming={isPrimaryUpcoming}
        isLive={isLive}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/week/full?id=${fullWeekId}`} title="View full week menu">
              <Grid3X3 className="h-4 w-4 mr-2" />
              View Full Week Menu
            </Link>
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshButtonBusy}
            variant="outline"
            title="Reload UI state and menu data"
            aria-busy={isRefreshButtonBusy}
          >
            {isRefreshButtonBusy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh Data"
            )}
          </Button>
        </div>

        {/* Desktop-only carousel navigation - far right */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => carouselRef.current?.goPrev()}
            aria-label="Previous meal"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => carouselRef.current?.goNext()}
            aria-label="Next meal"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

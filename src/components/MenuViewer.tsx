"use client";

import * as React from "react";
import type { MealKey, WeekMenu } from "@/lib/types";
import { findCurrentOrUpcomingMeal, pickHighlightMealForDay, getISTNow, sortDateKeysAsc } from "@/lib/date";
import { InlineSelect } from "@/components/InlineSelect";
import { MealCarousel, type MealCarouselHandle } from "@/components/MealCarousel";
import { useWeeksInfo, useWeekMenu } from "@/hooks/useMenuData";
import type { MenuType } from "@/hooks/useMenuData";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Grid3X3, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { DietaryFilter } from "@/components/DietaryFilter";
import { type DietaryFilter as DietaryFilterType, getFilterState, setFilterState, filterMeal } from "@/lib/filters";
import { useMountEffect } from "@/hooks/useMountEffect";

export type WeekId = string;

const LOADING_QUOTES = [
  "Warming up the tawa... 🍳",
  "Stirring the daal... 🥘",
  "Flipping the rotis... 🫓",
  "Checking the biryani... 🍚",
  "Marinating the paneer... 🧈",
  "Simmering the curry... 🍛",
  "Tasting for masala... 🌶️",
  "Rolling out parathas... 🥙",
  "Tempering the tadka... ✨",
  "Almost ready to serve... 🍽️",
];

function MenuViewerSkeleton() {
  const [quoteIndex, setQuoteIndex] = React.useState(0);

  useMountEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
    }, 1800);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] py-16 loading-fade-in">
      {/* Glowing background effect */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl animate-pulse scale-150" />

        {/* Elegant spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-[3px] border-muted/30" />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-amber-500 animate-spin"
            style={{ animationDuration: '0.8s' }}
          />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
        </div>
      </div>

      {/* Witty quote with fade transition */}
      <div className="mt-8 text-center max-w-xs">
        <p
          key={quoteIndex}
          className="text-base font-medium text-foreground/80 animate-in fade-in duration-500"
        >
          {LOADING_QUOTES[quoteIndex]}
        </p>
      </div>
    </div>
  );
}

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

  const carouselRef = React.useRef<MealCarouselHandle>(null);

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
    if (selectedWeekId) return selectedWeekId;
    if (!weeks || !resolvedFoodCourt) return null;
    const forCourt = weeks
      .filter((w) => w.foodCourt === resolvedFoodCourt)
      .sort((a, b) => b.weekMonday.localeCompare(a.weekMonday));
    return forCourt[0]?.weekMonday ?? null;
  }, [initialWeekId, selectedWeekId, weeks, resolvedFoodCourt]);

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
    await queryClient.invalidateQueries({ queryKey: ["weekMenu", selectedWeekId] });
    await queryClient.invalidateQueries({ queryKey: ["weeksInfo"] });
    await queryClient.refetchQueries({ queryKey: ["weekMenu", selectedWeekId], type: "active" });
    await queryClient.refetchQueries({ queryKey: ["weeksInfo"], type: "active" });
  }, [queryClient, selectedWeekId]);

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

  if (isWeeksLoading) {
    return <MenuViewerSkeleton />;
  }

  if (weeksError) {
    return <ErrorState message="Failed to load menu data" />;
  }

  if (!weeksInfo) {
    if (weeksInfo === undefined) {
      return <MenuViewerSkeleton />;
    }
    return <ErrorState message="No menu available" />;
  }

  if (!week) {
    return <MenuViewerSkeleton />;
  }

  const pointer = findCurrentOrUpcomingMeal(week, now);
  const fallbackDateKey = sortedDateKeys[0];

  // Compute the full week ID (e.g. "2026-02-02_to_2026-02-08") matching generateStaticParams format
  const ascDateKeys = sortDateKeysAsc(Object.keys(week.menu));
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

  return (
    <div className="space-y-4 content-loaded">
      <header className="mb-4 space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold">
            {resolvedFoodCourt.replace(/Food Court (\d+)/, "Food Court $1")}: Menu
          </h1>
          <p className="text-muted-foreground">{week.week}</p>
        </div>
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
        <DietaryFilter value={dietaryFilter} onChange={handleDietaryFilterChange} />
      </header>

      <MealCarousel ref={carouselRef} meals={meals} highlightKey={highlightKey} isPrimaryUpcoming={isPrimaryUpcoming} isLive={isLive} />

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
            disabled={weekMenuQuery.isPending}
            variant="outline"
            title="Refresh data"
          >
            {weekMenuQuery.isPending ? (
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

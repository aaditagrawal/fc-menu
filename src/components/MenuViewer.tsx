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

  React.useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

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
  const [dietaryFilter, setDietaryFilter] = React.useState<DietaryFilterType>('all');
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [dateKey, setDateKey] = React.useState<string | null>(null);
  const [isUserSelectedDay, setIsUserSelectedDay] = React.useState(false);
  const [now, setNow] = React.useState(() => getISTNow());

  const carouselRef = React.useRef<MealCarouselHandle>(null);

  const menuType: MenuType = dietaryFilter === 'jain' ? 'jain' : 'normal';
  const weekMenuQuery = useWeekMenu(selectedWeekId, menuType);
  const week = weekMenuQuery.data ?? (menuType === 'normal' ? initialWeek : null) ?? null;
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setIsHydrated(true);
    // Restore dietary filter from localStorage
    const saved = getFilterState();
    setDietaryFilter(saved.dietary);
    // Update 'now' every minute to keep UI fresh
    const interval = setInterval(() => {
      setNow(getISTNow());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (initialWeekId && !selectedWeekId) {
      setSelectedWeekId(initialWeekId);
    }
  }, [isHydrated, initialWeekId, selectedWeekId]);

  // Reset manual selection when week changes
  React.useEffect(() => {
    setIsUserSelectedDay(false);
  }, [selectedWeekId]);

  React.useEffect(() => {
    if (!isHydrated || !week) return;
    if (initialWeek?.foodCourt) {
      setFoodCourt(initialWeek.foodCourt);
    }
  }, [isHydrated, week, initialWeek]);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (week && !isUserSelectedDay) {
      // Auto-update day/meal based on 'now'
      const ptr = findCurrentOrUpcomingMeal(week, now);
      setDateKey(ptr?.dateKey ?? Object.keys(week.menu)[0]);
    }
  }, [isHydrated, week, now, isUserSelectedDay]);

  React.useEffect(() => {
    if (!isHydrated) return;
    try {
      const m = document.cookie.match(/(?:^|; )preferredFoodCourt=([^;]+)/);
      const fromCookie = m ? decodeURIComponent(m[1]) : null;
      if (fromCookie) {
        setFoodCourt((prev) => (prev === fromCookie ? prev : fromCookie));
      }
    } catch {
      // noop
    }
    // Read cookie once after hydration to avoid repeated parsing work.
  }, [isHydrated]);

  const availableFoodCourts = React.useMemo(() => {
    if (!weeksInfo?.weeks) return [];
    const courts = new Set(weeksInfo.weeks.map((w) => w.foodCourt));
    return Array.from(courts).sort();
  }, [weeksInfo?.weeks]);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (!foodCourt && availableFoodCourts.length > 0 && !initialWeek?.foodCourt) {
      setFoodCourt(availableFoodCourts[0]);
    }
  }, [isHydrated, foodCourt, availableFoodCourts, initialWeek]);

  // Filter weeks for the selected food court and always pick the latest
  const latestWeekId = React.useMemo(() => {
    if (!weeksInfo?.weeks) return null;
    const forCourt = weeksInfo.weeks
      .filter((w) => w.foodCourt === foodCourt)
      .sort((a, b) => b.weekMonday.localeCompare(a.weekMonday));
    return forCourt[0]?.weekMonday ?? null;
  }, [weeksInfo?.weeks, foodCourt]);

  // Auto-select latest week
  React.useEffect(() => {
    if (!isHydrated) return;
    if (latestWeekId && latestWeekId !== selectedWeekId) {
      setSelectedWeekId(latestWeekId);
    }
  }, [isHydrated, latestWeekId, selectedWeekId]);

  React.useEffect(() => {
    if (!foodCourt) return;
    try {
      document.cookie = `preferredFoodCourt=${encodeURIComponent(foodCourt)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch { }
  }, [foodCourt]);

  React.useEffect(() => {
    if (!isHydrated || !foodCourt) return;
    const base = "The Indian Kitchen";
    document.title = `${foodCourt} Menu — ${base}`;
  }, [foodCourt, isHydrated]);

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
            {foodCourt.replace(/Food Court (\d+)/, "Food Court $1")}: Menu
          </h1>
          <p className="text-muted-foreground">{week.week}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {foodCourtOptions.length > 1 && (
            <InlineSelect
              label="Mess"
              value={foodCourt}
              options={foodCourtOptions}
              onChange={(v) => setFoodCourt(String(v))}
              className="text-sm"
            />
          )}
          <InlineSelect
            label="Day"
            value={resolvedDateKey}
            options={dayOptions}
            onChange={(v) => {
              setIsUserSelectedDay(true);
              setDateKey(String(v));
            }}
            className="text-sm"
          />
        </div>
        <DietaryFilter value={dietaryFilter} onChange={handleDietaryFilterChange} />
      </header>

      <MealCarousel ref={carouselRef} meals={meals} highlightKey={highlightKey} isPrimaryUpcoming={isPrimaryUpcoming} isLive={isLive} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/week/${fullWeekId}/full`} title="View full week menu">
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

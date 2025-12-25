"use client";

import * as React from "react";
import type { MealKey, WeekMenu } from "@/lib/types";
import { findCurrentOrUpcomingMeal, pickHighlightMealForDay } from "@/lib/date";
import { InlineSelect } from "@/components/InlineSelect";
import { MealCarousel } from "@/components/MealCarousel";
import { useWeeksInfo, useWeekMenu } from "@/hooks/useMenuData";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Grid3X3, Loader2 } from "lucide-react";

export type WeekId = string;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MenuViewerSkeletonProps {}

function MenuViewerSkeleton({}: MenuViewerSkeletonProps) {
  return (
    <div className="space-y-4">
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </header>
      <div className="space-y-4">
        <div className="flex gap-4 overflow-x-auto py-2 px-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-w-[92%] sm:min-w-[55%] md:min-w-[48%] lg:min-w-[36%] h-48 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
  // router removed - no longer needed for client-side only routing
  const { data: weeksInfo, isLoading: isWeeksLoading, error: weeksError } = useWeeksInfo();
  const [selectedWeekId, setSelectedWeekId] = React.useState<WeekId | null>(initialWeekId ?? null);
  const [year, setYear] = React.useState<string>(
    initialWeekId ? initialWeekId.slice(0, 4) : new Date().getFullYear().toString()
  );
  const [foodCourt, setFoodCourt] = React.useState<string>(initialWeek?.foodCourt ?? "");
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [dateKey, setDateKey] = React.useState<string | null>(null);

  const weekMenuQuery = useWeekMenu(selectedWeekId);
  const week = weekMenuQuery.data ?? initialWeek ?? null;

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (initialWeekId && !selectedWeekId) {
      setSelectedWeekId(initialWeekId);
    }
  }, [isHydrated, initialWeekId, selectedWeekId]);

  React.useEffect(() => {
    if (!isHydrated || !week) return;
    if (initialWeek?.foodCourt) {
      setFoodCourt(initialWeek.foodCourt);
    }
  }, [isHydrated, week, initialWeek]);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (week) {
      const ptr = findCurrentOrUpcomingMeal(week);
      setDateKey(ptr?.dateKey ?? Object.keys(week.menu)[0]);
    }
  }, [isHydrated, week]);

  React.useEffect(() => {
    if (!isHydrated) return;
    try {
      const m = document.cookie.match(/(?:^|; )preferredFoodCourt=([^;]+)/);
      const fromCookie = m ? decodeURIComponent(m[1]) : null;
      if (fromCookie && fromCookie !== foodCourt) {
        setFoodCourt(fromCookie);
      }
    } catch {
      // noop
    }
  }, [foodCourt, isHydrated]);

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

  const filteredWeeks = React.useMemo(() => {
    if (!weeksInfo?.weeks) return [];
    return weeksInfo.weeks.filter((w) => w.foodCourt === foodCourt);
  }, [weeksInfo?.weeks, foodCourt]);

  const availableYears = React.useMemo(() => {
    if (!filteredWeeks.length) return [];
    const years = new Set(filteredWeeks.map((w) => w.weekMonday.slice(0, 4)));
    return Array.from(years).sort().reverse();
  }, [filteredWeeks]);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (!availableYears.includes(year)) {
      setYear(availableYears[0] ?? new Date().getFullYear().toString());
    }
  }, [isHydrated, availableYears, year]);

  const weeksForYear = React.useMemo(() => {
    if (!filteredWeeks.length) return [];
    return filteredWeeks
      .filter((w) => w.weekMonday.startsWith(`${year}-`))
      .sort((a, b) => b.weekMonday.localeCompare(a.weekMonday));
  }, [filteredWeeks, year]);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (weeksForYear.length > 0 && !weeksForYear.find((w) => w.weekMonday === selectedWeekId)) {
      const latest = weeksForYear[0];
      if (latest) setSelectedWeekId(latest.weekMonday);
    }
  }, [isHydrated, weeksForYear, selectedWeekId]);

  React.useEffect(() => {
    if (!foodCourt) return;
    try {
      document.cookie = `preferredFoodCourt=${encodeURIComponent(foodCourt)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  }, [foodCourt]);

  React.useEffect(() => {
    if (!isHydrated || !foodCourt) return;
    const base = "The Indian Kitchen";
    document.title = `${foodCourt} Menu — ${base}`;
  }, [foodCourt, isHydrated]);

  const handleRefresh = React.useCallback(async () => {
    await weekMenuQuery.refetch();
  }, [weekMenuQuery]);

  const yearOptions = availableYears.map((y) => ({ label: y, value: y }));
  const foodCourtOptions = availableFoodCourts.map((fc) => ({ label: fc, value: fc }));
  const weekOptions = weeksForYear.map((weekSummary) => {
    return { label: weekSummary.week, value: weekSummary.weekMonday };
  });

  const dayOptions = week
    ? Object.keys(week.menu)
        .sort()
        .map((k) => ({ label: `${week.menu[k].day} • ${k}`, value: k }))
    : [];

  if (isWeeksLoading) {
    return <MenuViewerSkeleton />;
  }

  if (weeksError) {
    return <ErrorState message="Failed to load weeks info" />;
  }

  if (!weeksInfo) {
    if (weeksInfo === undefined) {
      return <MenuViewerSkeleton />;
    }
    return <ErrorState message="No weeks available" />;
  }

  if (!week) {
    return <LoadingState />;
  }

  const pointer = findCurrentOrUpcomingMeal(week);
  const effectiveDateKey = dateKey ?? pointer?.dateKey ?? Object.keys(week.menu)[0];
  const day = week.menu[effectiveDateKey];

  const order: MealKey[] = ["breakfast", "lunch", "snacks", "dinner"];
  const meals = order
    .filter((k) => day.meals[k])
    .map((k) => ({
      key: k,
      meal: day.meals[k]!,
      timeRange: `${day.meals[k]!.startTime} – ${day.meals[k]!.endTime} IST`,
      title: k[0].toUpperCase() + k.slice(1),
    }));

  const picked = pickHighlightMealForDay(week, effectiveDateKey);
  const highlightKey = (picked?.mealKey ?? (meals[0]?.key ?? "breakfast")) as MealKey;
  const isPrimaryUpcoming = Boolean(picked?.isPrimaryUpcoming);

  return (
    <div className="space-y-4">
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold">
              {foodCourt.replace(/Food Court (\d+)/, "Food Court $1")}: Menu
            </h1>
            <p className="text-muted-foreground">{week.week}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              label="Year"
              value={year}
              options={yearOptions}
              onChange={(v) => setYear(String(v))}
              className="text-sm"
            />
            <InlineSelect
              label="Week"
              value={selectedWeekId ?? ""}
              options={weekOptions}
              onChange={(v) => setSelectedWeekId(String(v))}
              className="text-sm"
            />
            <InlineSelect
              label="Day"
              value={effectiveDateKey}
              options={dayOptions}
              onChange={(v) => setDateKey(String(v))}
              className="text-sm"
            />
          </div>
        </div>
      </header>

      <MealCarousel meals={meals} highlightKey={highlightKey} isPrimaryUpcoming={isPrimaryUpcoming} />

      <div className="flex flex-col sm:flex-row items-center gap-2 mt-6">
        <Button asChild variant="outline">
          <Link href={`/week/${selectedWeekId}/full`} title="View full week menu">
            <Grid3X3 className="h-4 w-4 mr-2" />
            View Full Week Menu
          </Link>
        </Button>

        <Button
          onClick={handleRefresh}
          disabled={weekMenuQuery.isFetching}
          variant="ghost"
          size="sm"
          className="text-xs"
          title="Refresh data"
        >
          {weekMenuQuery.isFetching ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh Data"
          )}
        </Button>
      </div>
    </div>
  );
}

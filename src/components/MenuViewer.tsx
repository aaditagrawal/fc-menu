"use client";

import * as React from "react";
import type { MealKey, WeekMenu } from "@/lib/types";
import { findCurrentOrUpcomingMeal, pickHighlightMealForDay } from "@/lib/date";
import { InlineSelect } from "@/components/InlineSelect";
import { MealCarousel } from "@/components/MealCarousel";
import { getWeekMenuClient, type WeekId, fetchWeeksInfo, getAllYearsFromList, refreshDataIfNeeded } from "@/data/weeks/client";
import type { WeekMeta } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Grid3X3 } from "lucide-react";

export function MenuViewer({
  initialWeekId,
  initialWeek,
  routingMode = "home",
}: {
  initialWeekId: WeekId;
  initialWeek: WeekMenu;
  routingMode?: "home" | "week";
}) {
  const router = useRouter();
  const [allWeekIds, setAllWeekIds] = React.useState<WeekId[]>([initialWeekId]);
  const [weeksMeta, setWeeksMeta] = React.useState<WeekMeta[]>([]);
  const [weekId, setWeekId] = React.useState<WeekId>(initialWeekId);
  const [week, setWeek] = React.useState<WeekMenu>(initialWeek);
  const initialYear = React.useMemo(() => initialWeekId.slice(0, 4), [initialWeekId]);
  const [year, setYear] = React.useState<string>(initialYear);
  const [foodCourt, setFoodCourt] = React.useState<string>(initialWeek.foodCourt);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  // Sync state when server-provided props change (e.g., navigating between week routes)
  React.useEffect(() => {
    setWeekId(initialWeekId);
    setWeek(initialWeek);
    setYear(initialWeekId.slice(0, 4));
    setFoodCourt(initialWeek.foodCourt);
    const ptr = findCurrentOrUpcomingMeal(initialWeek);
    setDateKey(ptr?.dateKey ?? Object.keys(initialWeek.menu)[0]);
  }, [initialWeekId, initialWeek]);

  // Read preferred foodCourt from cookie on client-side only
  React.useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|; )preferredFoodCourt=([^;]+)/);
      const fromCookie = m ? decodeURIComponent(m[1]) : null;
      if (fromCookie && fromCookie !== foodCourt) {
        setFoodCourt(fromCookie);
      }
    } catch {
      // noop
    }
  }, []);
  // Fetch available week ids on mount
  React.useEffect(() => {
    fetchWeeksInfo().then(({ weekIds, meta }) => {
      setAllWeekIds(weekIds);
      setWeeksMeta(meta);
    }).catch(() => {});
  }, []);

  const [dateKey, setDateKey] = React.useState<string>(Object.keys(initialWeek.menu)[0]);

  // Set current/upcoming meal dateKey on client-side only
  React.useEffect(() => {
    const ptr = findCurrentOrUpcomingMeal(week);
    const currentDateKey = ptr?.dateKey ?? Object.keys(week.menu)[0];
    if (currentDateKey !== dateKey) {
      setDateKey(currentDateKey);
    }
  }, [week, dateKey]);

  // When year changes, adjust week list for the selected mess and pick the latest
  React.useEffect(() => {
    const yearWeeksForMess = weeksMeta
      .filter((m) => m.foodCourt === foodCourt && m.id.startsWith(`${year}-`))
      .map((m) => m.id)
      .sort();
    if (yearWeeksForMess.length === 0) return;
    if (!yearWeeksForMess.includes(weekId)) {
      const latestForYear = yearWeeksForMess[yearWeeksForMess.length - 1] as WeekId;
      if (latestForYear) setWeekId(latestForYear);
    }
  }, [year, weeksMeta, foodCourt, weekId]);

  // When weekId changes, either route (week mode) or load locally (home mode)
  React.useEffect(() => {
    if (weekId === initialWeekId) return;
    if (routingMode === "week") {
      router.push(`/week/${weekId}`);
      return;
    }
    getWeekMenuClient(weekId).then((w) => {
      setWeek(w);
      const ptr = findCurrentOrUpcomingMeal(w);
      setDateKey(ptr?.dateKey ?? Object.keys(w.menu)[0]);
      setFoodCourt(w.foodCourt);
    });
  }, [weekId, initialWeekId, router, routingMode]);

  // Handle smart refresh
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const wasRefreshed = await refreshDataIfNeeded(week);

      if (wasRefreshed) {
        // If data was refreshed, reload the page to get the latest data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [week]);

  // Ensure dateKey is valid for current week
  React.useEffect(() => {
    if (!week.menu[dateKey]) {
      const keys = Object.keys(week.menu).sort();
      setDateKey(keys[0]);
    }
  }, [week, dateKey]);

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

  const yearOptions = getAllYearsFromList(allWeekIds).map((y) => ({ label: y, value: y }));
  const weekOptions = React.useMemo(() => {
    const ids = weeksMeta
      .filter((m) => m.foodCourt === foodCourt && m.id.startsWith(`${year}-`))
      .map((m) => m.id);
    const uniqueSorted = Array.from(new Set(ids)).sort();
    return uniqueSorted.map((id) => ({ label: id, value: id }));
  }, [weeksMeta, foodCourt, year]);
  const dayOptions = Object.keys(week.menu)
    .sort()
    .map((k) => ({ label: `${week.menu[k].day} • ${k}`, value: k }));
  const messOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of weeksMeta) set.add(m.foodCourt);
    const list = Array.from(set);
    list.sort();
    return list.map((name) => ({ label: name, value: name }));
  }, [weeksMeta]);

  // Handle mess changes: pick the latest week for the chosen mess, same year if possible
  React.useEffect(() => {
    if (!foodCourt) return;
    // persist in cookie
    try {
      document.cookie = `preferredFoodCourt=${encodeURIComponent(foodCourt)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
    const candidates = weeksMeta.filter((m) => m.foodCourt === foodCourt);
    if (candidates.length === 0) return;
    const candidateIds = candidates.map((m) => m.id);
    const sameYearIds = candidateIds.filter((id) => id.startsWith(`${year}-`)).sort();
    const pick = (sameYearIds[sameYearIds.length - 1] ?? candidateIds.sort()[candidateIds.length - 1]) as WeekId;
    if (pick && pick !== weekId) setWeekId(pick);
  }, [foodCourt, weeksMeta, year, weekId]);

  // Update page title client-side when mess changes
  React.useEffect(() => {
    if (!foodCourt) return;
    const base = "The Indian Kitchen";
    document.title = `${foodCourt} Menu — ${base}`;
  }, [foodCourt]);

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <div className="text-2xl sm:text-3xl font-semibold">
          <InlineSelect
            label="Mess"
            value={foodCourt}
            options={messOptions}
            onChange={(v) => setFoodCourt(String(v))}
            menuClassName="text-sm"
          />
        </div>
        <p className="text-muted-foreground mt-1">{week.week}</p>
      </header>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <InlineSelect
          label="Year"
          value={year}
          options={yearOptions}
          onChange={(v) => setYear(String(v))}
        />
        <span className="text-muted-foreground">/</span>
        <InlineSelect
          label="Week"
          value={weekId}
          options={weekOptions}
          onChange={(v) => setWeekId(v as WeekId)}
        />
        <span className="text-muted-foreground">/</span>
        <InlineSelect
          label="Day"
          value={effectiveDateKey}
          options={dayOptions}
          onChange={(v) => setDateKey(String(v))}
        />
      </div>

      <MealCarousel meals={meals} highlightKey={highlightKey} isPrimaryUpcoming={isPrimaryUpcoming} />

      <div className="flex items-center justify-center gap-2 mt-6">
        <Button asChild variant="outline">
          <Link href={`/week/${weekId}/full`} title="View full week menu">
            <Grid3X3 className="h-4 w-4 mr-2" />
            View Full Week Menu
          </Link>
        </Button>

        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="ghost"
          size="sm"
          className="text-xs"
          title="Clear cache and refresh data if no upcoming meal is available"
        >
          {isRefreshing ? 'Refreshing...' : 'Reload Data'}
        </Button>
      </div>
    </div>
  );
}



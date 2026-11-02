"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
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
import {
  type DietaryFilter as DietaryFilterType,
  getFilterState,
  setFilterState,
  filterMeal,
} from "@/lib/filters";
import { QUERY_PERSIST_STORAGE_KEY } from "@/lib/queryPersistence";
import { useMountEffect } from "@/hooks/useMountEffect";
import { toast } from "sonner";
import { StaleWeekNotice } from "@/components/StaleWeekNotice";
import { ErrorState } from "@/components/ErrorState";
import { JainFallbackNotice } from "@/components/JainFallbackNotice";
import { hasMenuDays, isEmptyWeekResult } from "@/lib/menuWeek";
import { HardResetButton } from "@/components/HardResetButton";
import {
  invalidateStaticManifestCache,
  normalizeWeekIdToStartDate,
  selectEffectiveWeek,
} from "@/lib/staticMenuBundle";
import { sxc } from "@/lib/utils";

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "3rem",
  },
  loadingSpinner: {
    height: "2rem",
    width: "2rem",
    color: "var(--muted-foreground)",
    animationName: spin,
    animationDuration: "1s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  // The old `space-y-4` container: flex column + gap renders identically for
  // these block children. Child margins below are adjusted for the gap.
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: "1rem",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.75rem",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.375rem",
  },
  title: {
    fontSize: {
      default: "26px",
      "@media (min-width: 640px)": "32px",
    },
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  selectsRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "1rem",
    rowGap: "0.5rem",
  },
  textSm: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  // Old spacing: `mt-6` collapsed with the previous sibling's `space-y-4`
  // bottom margin to 1.5rem; the parent gap provides 1rem, so 0.5rem remains.
  actionsRow: {
    display: "flex",
    flexDirection: {
      default: "column",
      "@media (min-width: 640px)": "row",
    },
    alignItems: {
      default: null,
      "@media (min-width: 640px)": "center",
    },
    justifyContent: "space-between",
    rowGap: "0.75rem",
    columnGap: "0.75rem",
    marginTop: "0.5rem",
  },
  actionsGroup: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: "0.5rem",
    columnGap: "0.5rem",
  },
  buttonIcon: {
    height: "1rem",
    width: "1rem",
    marginRight: "0.5rem",
  },
  buttonSpinner: {
    height: "1rem",
    width: "1rem",
    marginRight: "0.5rem",
    animationName: spin,
    animationDuration: "1s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  desktopNav: {
    display: {
      default: "none",
      "@media (min-width: 640px)": "flex",
    },
    alignItems: "center",
    rowGap: "0.25rem",
    columnGap: "0.25rem",
  },
  navButton: {
    height: "2rem",
    width: "2rem",
  },
  navIcon: {
    height: "1rem",
    width: "1rem",
  },
  mutedText: {
    color: "var(--muted-foreground)",
  },
});

export type WeekId = string;

const MENU_QUERY_ROOT_KEYS = new Set(["weekMenu", "weeksInfo"]);
const MEAL_ORDER: MealKey[] = ["breakfast", "lunch", "snacks", "dinner"];

// Same spinner FullWeekView shows — loading must never be a blank screen.
function LoadingState() {
  return (
    <div {...stylex.props(styles.loadingWrap)}>
      <Loader2 {...sxc("animate-spin", styles.loadingSpinner)} />
    </div>
  );
}

function getPreferredFoodCourtFromCookie() {
  if (!("document" in globalThis)) {
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
    document.cookie = `preferredFoodCourt=${encodeURIComponent(foodCourt)}; path=/; max-age=${60 * 60 * 24 * 365}; Secure; SameSite=Lax`;
  } catch {}
}

function isMenuQuery(query: { queryKey: readonly unknown[] }) {
  return MENU_QUERY_ROOT_KEYS.has(String(query.queryKey[0]));
}

async function clearPersistedMenuCaches() {
  if (!("window" in globalThis)) {
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
        .map((cacheName) => window.caches.delete(cacheName)),
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
  // The static HTML is built once and served to every visitor, so the first
  // render (SSR and hydration alike) must not read the clock: `now` stays null
  // until mount, and every consumer below treats null as "no clock yet" — first
  // day, first meal, nothing live, no stale-week notice.
  const [now, setNow] = React.useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshNonce, setRefreshNonce] = React.useState(0);

  const carouselRef = React.useRef<MealCarouselHandle>(null);
  const router = useRouter();

  const bakedStartDate = React.useMemo(
    () => (hasMenuDays(initialWeek) ? sortDateKeysAsc(Object.keys(initialWeek.menu))[0] : null),
    [initialWeek],
  );
  // Seeding the query with the baked week only makes sense when it is the very
  // week being asked for; any other week would be cached under the wrong key.
  const bakedInitialData =
    hasMenuDays(initialWeek) && normalizeWeekIdToStartDate(selectedWeekId) === bakedStartDate
      ? initialWeek
      : undefined;

  const menuType: MenuType = dietaryFilter === "jain" ? "jain" : "normal";
  const weekMenuQuery = useWeekMenu(
    selectedWeekId,
    menuType,
    menuType === "normal" ? bakedInitialData : undefined,
  );

  // An empty week means either a backend blip (both menu endpoints answer 200
  // with `{ menu: {} }` when their own lookup fails) or a week with no Jain
  // upload. For Jain, the regular week is a useful fallback; for everyone else
  // the baked bundle below is. Either way an empty week is never rendered.
  const jainWeekIsEmpty = menuType === "jain" && isEmptyWeekResult(weekMenuQuery);
  const normalFallbackQuery = useWeekMenu(
    jainWeekIsEmpty ? selectedWeekId : null,
    "normal",
    jainWeekIsEmpty ? bakedInitialData : undefined,
  );

  const activeWeekQuery = jainWeekIsEmpty ? normalFallbackQuery : weekMenuQuery;
  const effectiveMenuType: MenuType = jainWeekIsEmpty ? "normal" : menuType;
  // The regular menu carries egg and meat, which is the last thing to hand
  // someone who asked for Jain. Fall back to it vegetarian-only.
  const effectiveDietaryFilter: DietaryFilterType = jainWeekIsEmpty ? "veg-only" : dietaryFilter;
  const bakedWeek = effectiveMenuType === "normal" && hasMenuDays(initialWeek) ? initialWeek : null;
  // hasMenuDays also screens out empty weeks restored from a persisted cache
  // written before those payloads were rejected.
  const week = (hasMenuDays(activeWeekQuery.data) ? activeWeekQuery.data : null) ?? bakedWeek;
  const queryClient = useQueryClient();

  // Mount: read persisted state + start clock
  useMountEffect(() => {
    const saved = getFilterState();
    const preferredFoodCourt = getPreferredFoodCourtFromCookie();

    setDietaryFilter(saved.dietary);
    if (preferredFoodCourt && !initialWeek?.foodCourt) {
      setFoodCourt((current) => current || preferredFoodCourt);
    }

    const tick = () => setNow(getISTNow());
    let interval: number | null = null;
    const startClock = () => {
      if (interval === null) interval = window.setInterval(tick, 60 * 1000);
    };
    const stopClock = () => {
      if (interval !== null) window.clearInterval(interval);
      interval = null;
    };
    // A hidden tab has nobody to show the minute to; pausing saves a full
    // re-render per minute, and catching up on return keeps highlights honest.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopClock();
        return;
      }
      tick();
      startClock();
    };

    tick();
    if (!document.hidden) startClock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopClock();
    };
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
    if (!weeks || !resolvedFoodCourt || now === null) return selectedWeekId;
    const forCourt = weeks.filter((w) => w.foodCourt === resolvedFoodCourt);
    return selectEffectiveWeek(forCourt, formatDateKey(now))?.startDate ?? selectedWeekId;
  }, [initialWeekId, selectedWeekId, weeks, resolvedFoodCourt, now]);

  if (resolvedWeekId && resolvedWeekId !== selectedWeekId) {
    setSelectedWeekId(resolvedWeekId);
  }

  const sortedDateKeys = React.useMemo(
    () => (week ? sortDateKeysAsc(Object.keys(week.menu)) : []),
    [week],
  );

  const pointer = React.useMemo(
    () => (week && now !== null ? findCurrentOrUpcomingMeal(week, now) : null),
    [week, now],
  );

  // User selection if it's for this week, else the clock's day, else the first day.
  const resolvedDateKey = React.useMemo(() => {
    if (!week) return null;
    if (isUserSelectedDay && userDateKey && week.menu[userDateKey]) return userDateKey;
    if (pointer?.dateKey && week.menu[pointer.dateKey]) return pointer.dateKey;
    return sortedDateKeys[0] ?? null;
  }, [isUserSelectedDay, userDateKey, week, pointer, sortedDateKeys]);

  const day = week && resolvedDateKey ? week.menu[resolvedDateKey] : undefined;

  // filterMeal returns fresh identities, so without this every clock tick
  // would re-render the memoized meal cards.
  const meals = React.useMemo(() => {
    if (!day?.meals) return [];
    return MEAL_ORDER.flatMap((key) => {
      const source = day.meals[key];
      if (!source) return [];
      const meal = filterMeal(source, effectiveDietaryFilter);
      if (meal.items.length === 0) return [];
      return [
        {
          key,
          meal,
          timeRange: `${source.startTime} – ${source.endTime} IST`,
          title: key[0].toUpperCase() + key.slice(1),
        },
      ];
    });
  }, [day, effectiveDietaryFilter]);

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
      invalidateStaticManifestCache();
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

  const handleDayChange = React.useCallback(
    (v: string) => {
      setUserDateKey(v);
      setUserDateWeekId(selectedWeekId);
    },
    [selectedWeekId],
  );

  const foodCourtOptions = React.useMemo(
    () => availableFoodCourts.map((fc) => ({ label: fc, value: fc })),
    [availableFoodCourts],
  );

  const dayOptions = React.useMemo(
    () =>
      week ? sortedDateKeys.map((k) => ({ label: `${week.menu[k].day} • ${k}`, value: k })) : [],
    [week, sortedDateKeys],
  );

  if (weeksError && !bakedWeek) {
    return <ErrorState message="Failed to load menu data" />;
  }

  if (!weeksInfo && !bakedWeek) {
    if (weeksInfo === undefined) {
      return <LoadingState />;
    }
    return <ErrorState message="No menu available" />;
  }

  if (!week) {
    if (
      isWeeksLoading ||
      activeWeekQuery.isLoading ||
      (resolvedWeekId !== null && resolvedWeekId !== selectedWeekId)
    ) {
      return <LoadingState />;
    }
    // An empty week is a different situation from a failed request, and saying
    // so stops people retrying against a menu that simply isn't up yet.
    if (isEmptyWeekResult(activeWeekQuery)) {
      return (
        <ErrorState
          message="This week's menu hasn't been published yet"
          hint="It usually goes up at the start of the week. If you think it should be here, Reset App Data clears this site's saved data and reloads from scratch."
        />
      );
    }
    return <ErrorState message="Couldn't load the menu" />;
  }

  // Compute the full week ID (e.g. "2026-02-02_to_2026-02-08") matching generateStaticParams format
  const displayedWeekMondayKey = sortedDateKeys[0] ?? "";
  const showStaleWeekNotice =
    now !== null &&
    (initialWeekId == null || initialWeekId === "") &&
    displayedWeekMondayKey !== "" &&
    displayedWeekMondayKey < getMondayDateKeyContainingIST(now);
  const fullWeekId = `${sortedDateKeys[0]}_to_${sortedDateKeys[sortedDateKeys.length - 1]}`;

  if (!resolvedDateKey) {
    return <ErrorState message="No menu days available" />;
  }

  if (!day) {
    return <ErrorState message="No menu data for selected day" />;
  }

  if (!day.meals) {
    return <ErrorState message="No meals data for selected day" />;
  }

  const picked = now !== null ? pickHighlightMealForDay(week, resolvedDateKey, now) : null;
  const highlightKey = picked?.mealKey ?? meals[0]?.key ?? "breakfast";
  const isPrimaryUpcoming = Boolean(picked?.isPrimaryUpcoming);
  const isLive = Boolean(picked?.isLive);

  const isRefreshButtonBusy = isRefreshing || activeWeekQuery.isFetching;

  return (
    <div {...sxc("content-loaded", styles.root)}>
      {jainWeekIsEmpty && (
        <JainFallbackNotice onShowRegular={() => handleDietaryFilterChange("all")} />
      )}
      {showStaleWeekNotice && <StaleWeekNotice weekLabel={week.week} />}
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.titleBlock)}>
          <h1 {...stylex.props(styles.title)}>{resolvedFoodCourt}: Menu</h1>
          <div {...stylex.props(styles.selectsRow)}>
            {foodCourtOptions.length > 1 && (
              <InlineSelect
                label="Mess"
                value={resolvedFoodCourt}
                options={foodCourtOptions}
                onChange={(v) => handleFoodCourtChange(String(v))}
                style={styles.textSm}
              />
            )}
            <InlineSelect
              label="Day"
              value={resolvedDateKey}
              options={dayOptions}
              onChange={(v) => handleDayChange(String(v))}
              style={styles.textSm}
            />
          </div>
        </div>
        <DietaryFilter value={dietaryFilter} onChange={handleDietaryFilterChange} />
      </header>

      <MealCarousel
        key={`${resolvedWeekId}:${resolvedDateKey}:${effectiveMenuType}:${refreshNonce}`}
        ref={carouselRef}
        meals={meals}
        highlightKey={highlightKey}
        isPrimaryUpcoming={isPrimaryUpcoming}
        isLive={isLive}
      />

      <div {...stylex.props(styles.actionsRow)}>
        <div {...stylex.props(styles.actionsGroup)}>
          <Button asChild variant="outline">
            <Link href={`/week/full?id=${fullWeekId}`} title="View full week menu">
              <Grid3X3 {...stylex.props(styles.buttonIcon)} />
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
                <Loader2 {...sxc("animate-spin", styles.buttonSpinner)} />
                Refreshing...
              </>
            ) : (
              "Refresh Data"
            )}
          </Button>
        </div>

        {/* Desktop-only carousel navigation - far right */}
        <div {...stylex.props(styles.desktopNav)}>
          <Button
            variant="ghost"
            size="icon"
            style={styles.navButton}
            onClick={() => carouselRef.current?.goPrev()}
            aria-label="Previous meal"
          >
            <ChevronLeft {...stylex.props(styles.navIcon)} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            style={styles.navButton}
            onClick={() => carouselRef.current?.goNext()}
            aria-label="Next meal"
          >
            <ChevronRight {...stylex.props(styles.navIcon)} />
          </Button>
        </div>
      </div>

      {/* Kept apart from the routine actions above: this one wipes everything.
          Old `mt-2` collapsed into the 1rem space-y margin, now the parent gap. */}
      <div>
        <HardResetButton size="sm" style={styles.mutedText} />
      </div>
    </div>
  );
}

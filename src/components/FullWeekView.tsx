"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import Link from "next/link";
import { ComprehensiveWeekView } from "@/components/ComprehensiveWeekView";
import { useWeekMenu } from "@/hooks/useMenuData";
import type { MenuType } from "@/hooks/useMenuData";
import type { WeekId } from "@/components/MenuViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DietaryFilter } from "@/components/DietaryFilter";
import {
  type DietaryFilter as DietaryFilterType,
  getFilterState,
  setFilterState,
  filterWeekMenu,
} from "@/lib/filters";
import { useMountEffect } from "@/hooks/useMountEffect";
import { ErrorState } from "@/components/ErrorState";
import { JainFallbackNotice } from "@/components/JainFallbackNotice";
import { hasMenuDays, isEmptyWeekResult } from "@/lib/menuWeek";

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
  // Former `space-y-2` container: flex column + gap is identical for these
  // block children.
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.5rem",
  },
  headerRow: {
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
    rowGap: "1rem",
    columnGap: "1rem",
  },
  title: {
    fontSize: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    lineHeight: {
      default: "calc(2 / 1.5)",
      "@media (min-width: 640px)": "calc(2.25 / 1.875)",
    },
    fontWeight: 600,
  },
  subtitle: {
    color: "var(--muted-foreground)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    rowGap: "0.75rem",
    columnGap: "0.75rem",
    alignSelf: {
      default: "flex-start",
      "@media (min-width: 640px)": "auto",
    },
  },
  buttonIcon: {
    height: "1rem",
    width: "1rem",
    marginRight: "0.5rem",
  },
});

export function FullWeekView({ weekId }: { weekId: WeekId }) {
  const [dietaryFilter, setDietaryFilter] = React.useState<DietaryFilterType>("all");

  useMountEffect(() => {
    const saved = getFilterState();
    setDietaryFilter(saved.dietary);
  });

  const handleFilterChange = React.useCallback((filter: DietaryFilterType) => {
    setDietaryFilter(filter);
    setFilterState({ dietary: filter });
  }, []);

  const menuType: MenuType = dietaryFilter === "jain" ? "jain" : "normal";
  const weekMenuQuery = useWeekMenu(weekId, menuType);

  // Weeks without a Jain menu — and any week the API blanks out on failure —
  // come back as a 200 with an empty menu. See MenuViewer for the same guard.
  const jainWeekIsEmpty = menuType === "jain" && isEmptyWeekResult(weekMenuQuery);
  const normalFallbackQuery = useWeekMenu(jainWeekIsEmpty ? weekId : null, "normal");

  const activeQuery = jainWeekIsEmpty ? normalFallbackQuery : weekMenuQuery;
  const { isLoading } = activeQuery;
  // The regular menu carries egg and meat, which is the last thing to hand
  // someone who asked for Jain. Fall back to it vegetarian-only.
  const effectiveDietaryFilter: DietaryFilterType = jainWeekIsEmpty ? "veg-only" : dietaryFilter;
  const weekData = hasMenuDays(activeQuery.data) ? activeQuery.data : null;
  const week = React.useMemo(
    () => (weekData ? filterWeekMenu(weekData, effectiveDietaryFilter) : null),
    [weekData, effectiveDietaryFilter],
  );

  if (isLoading) {
    return (
      <div {...stylex.props(styles.loadingWrap)}>
        <Loader2 {...stylex.props(styles.loadingSpinner)} />
      </div>
    );
  }

  if (!week) {
    if (isEmptyWeekResult(activeQuery)) {
      return (
        <ErrorState
          message="This week's menu hasn't been published yet"
          hint="It usually goes up at the start of the week. If you think it should be here, Reset App Data clears this site's saved data and reloads from scratch."
        />
      );
    }
    return <ErrorState message="Couldn't load the week menu" />;
  }

  return (
    <div {...stylex.props(styles.root)}>
      {jainWeekIsEmpty && <JainFallbackNotice onShowRegular={() => handleFilterChange("all")} />}
      <div {...stylex.props(styles.headerRow)}>
        <div>
          <h1 {...stylex.props(styles.title)}>Full Week Menu</h1>
          <p {...stylex.props(styles.subtitle)}>
            {week.week} • {week.foodCourt}
          </p>
        </div>
        <div {...stylex.props(styles.headerActions)}>
          <DietaryFilter value={dietaryFilter} onChange={handleFilterChange} />
          <Button asChild variant="outline">
            <Link href="/" title="Back to daily view">
              <ArrowLeft {...stylex.props(styles.buttonIcon)} />
              Daily View
            </Link>
          </Button>
        </div>
      </div>
      <ComprehensiveWeekView week={week} />
    </div>
  );
}

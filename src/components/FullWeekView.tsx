"use client";

import * as React from "react";
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    <div className="space-y-2">
      {jainWeekIsEmpty && <JainFallbackNotice onShowRegular={() => handleFilterChange("all")} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Full Week Menu</h1>
          <p className="text-muted-foreground">
            {week.week} • {week.foodCourt}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <DietaryFilter value={dietaryFilter} onChange={handleFilterChange} />
          <Button asChild variant="outline">
            <Link href="/" title="Back to daily view">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Daily View
            </Link>
          </Button>
        </div>
      </div>
      <ComprehensiveWeekView week={week} />
    </div>
  );
}

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
import { type DietaryFilter as DietaryFilterType, getFilterState, setFilterState, filterWeekMenu } from "@/lib/filters";

export function FullWeekView({ weekId }: { weekId: WeekId }) {
  const [dietaryFilter, setDietaryFilter] = React.useState<DietaryFilterType>('all');

  React.useEffect(() => {
    const saved = getFilterState();
    setDietaryFilter(saved.dietary);
  }, []);

  const handleFilterChange = React.useCallback((filter: DietaryFilterType) => {
    setDietaryFilter(filter);
    setFilterState({ dietary: filter });
  }, []);

  const menuType: MenuType = dietaryFilter === 'jain' ? 'jain' : 'normal';
  const { data: weekData, isLoading, error } = useWeekMenu(weekId, menuType);
  const week = React.useMemo(
    () => (weekData ? filterWeekMenu(weekData, dietaryFilter) : null),
    [weekData, dietaryFilter]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !week) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-red-500 text-sm">Failed to load week menu</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Full Week Menu</h1>
          <p className="text-muted-foreground">{week.week} • {week.foodCourt}</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <DietaryFilter value={dietaryFilter} onChange={handleFilterChange} />
          <Button asChild variant="outline">
            <Link href={`/week/${weekId}`} title="Back to daily view">
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

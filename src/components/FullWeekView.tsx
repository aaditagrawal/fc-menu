"use client";

import * as React from "react";
import Link from "next/link";
import { ComprehensiveWeekView } from "@/components/ComprehensiveWeekView";
import { useWeekMenu } from "@/hooks/useMenuData";
import type { WeekId } from "@/components/MenuViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export function FullWeekView({ weekId }: { weekId: WeekId }) {
  const { data: week, isLoading, error } = useWeekMenu(weekId);

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
        <Button asChild variant="outline" className="self-start sm:self-auto">
          <Link href={`/week/${weekId}`} title="Back to daily view">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Daily View
          </Link>
        </Button>
      </div>
      <ComprehensiveWeekView week={week} />
    </div>
  );
}

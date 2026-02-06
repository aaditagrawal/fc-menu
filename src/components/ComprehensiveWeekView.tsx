"use client";

import * as React from "react";
import type { WeekMenu, MealKey, DayMenu, Meal } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, UtensilsCrossed, Cookie, Moon } from "lucide-react";
import { filterMenuItems } from "@/lib/exceptions";

interface ComprehensiveWeekViewProps {
  week: WeekMenu;
}

const mealOrder: MealKey[] = ["breakfast", "lunch", "snacks", "dinner"];

const mealIcons = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  snacks: Cookie,
  dinner: Moon,
};

const mealTitles = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

type MobileViewMode = "detailed" | "compact";

export function ComprehensiveWeekView({ week }: ComprehensiveWeekViewProps) {
  // Sort days chronologically
  const sortedDays = React.useMemo(() => Object.keys(week.menu).sort(), [week.menu]);
  const dayCount = sortedDays.length;
  const [mobileViewMode, setMobileViewMode] = React.useState<MobileViewMode>("detailed");

  return (
    <div className="space-y-8">
      {/* Mobile/Tablet View - Days stacked vertically */}
      <div className="block lg:hidden space-y-6">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          <Button
            type="button"
            size="sm"
            variant={mobileViewMode === "detailed" ? "default" : "ghost"}
            onClick={() => setMobileViewMode("detailed")}
            className="h-8 px-3 text-xs"
          >
            Detailed
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mobileViewMode === "compact" ? "default" : "ghost"}
            onClick={() => setMobileViewMode("compact")}
            className="h-8 px-3 text-xs"
          >
            Compact Grid
          </Button>
        </div>

        {mobileViewMode === "detailed" ? (
          sortedDays.map((dateKey) => {
            const day = week.menu[dateKey];
            return (
              <DaySection key={dateKey} day={day} dateKey={dateKey} />
            );
          })
        ) : (
          <MobileCompactWeekGrid week={week} sortedDays={sortedDays} />
        )}
      </div>

      {/* Desktop View - Transposed grid: Meals as rows, Days as columns */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-container">
          <div
            className="grid gap-3 min-w-max pb-4 items-start scroll-grid"
            style={{
              gridTemplateColumns: `200px repeat(${dayCount}, minmax(280px, 1fr))`,
              scrollSnapType: 'x mandatory',
              scrollPadding: '1rem',
            }}
          >
            {/* Sticky Header row with days */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 col-span-full">
              <div className="grid gap-3 items-start px-4 py-3"
                   style={{
                     gridTemplateColumns: `200px repeat(${dayCount}, minmax(280px, 1fr))`,
                   }}>
                <div>
                  <h3 className="font-semibold text-lg">Meals</h3>
                </div>
                {sortedDays.map((dateKey) => {
                  const day = week.menu[dateKey];
                  return (
                    <div key={`header-${dateKey}`} className="text-center">
                      <h3 className="font-semibold">{day.day}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{dateKey}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            

            {/* Content rows */}
            <div className="grid gap-3 items-start col-span-full"
                 style={{
                   gridTemplateColumns: `200px repeat(${dayCount}, minmax(280px, 1fr))`,
                   paddingTop: '1rem'
                 }}>
              {/* Empty cell for meal type headers */}
              <div></div>
              {sortedDays.map((dateKey) => (
                <div key={`spacer-${dateKey}`} className="snap-start"
                     style={{ scrollSnapAlign: 'start' }}></div>
              ))}
            </div>

            {/* Meal rows */}
            {mealOrder.map((mealKey) => (
              <React.Fragment key={mealKey}>
                {/* Meal type header and content row */}
                <div className="grid gap-3 items-start border-t border-border/50 col-span-full"
                     style={{
                       gridTemplateColumns: `200px repeat(${dayCount}, minmax(280px, 1fr))`
                     }}>
                  {/* Meal type header */}
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                        {React.createElement(mealIcons[mealKey], {
                          className: "h-4 w-4 text-primary"
                        })}
                      </span>
                      <div>
                        <span className="font-medium">{mealTitles[mealKey]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meal content for each day */}
                  {sortedDays.map((dateKey) => {
                    const day = week.menu[dateKey];
                    const meal = day.meals[mealKey];

                    return (
                      <div key={`${mealKey}-${dateKey}`} className="p-3 snap-start"
                           style={{
                             scrollSnapAlign: 'start'
                           }}>
                        {meal ? (
                          <MealGridCard
                            meal={meal}
                            mealKey={mealKey}
                            timeRange={`${meal.startTime} – ${meal.endTime} IST`}
                          />
                        ) : (
                          <div className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center min-h-32">
                            <span className="text-sm text-muted-foreground">No meal</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileCompactWeekGrid({ week, sortedDays }: { week: WeekMenu; sortedDays: string[] }) {
  const getMealTimeLabel = React.useCallback((mealKey: MealKey): string => {
    const uniqueRanges = new Set<string>();

    for (const dateKey of sortedDays) {
      const meal = week.menu[dateKey]?.meals[mealKey];
      if (meal) {
        uniqueRanges.add(`${meal.startTime} - ${meal.endTime}`);
      }
    }

    if (uniqueRanges.size === 0) return "No timing";
    if (uniqueRanges.size === 1) return [...uniqueRanges][0];
    return "Times vary";
  }, [sortedDays, week.menu]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compact Week Grid</CardTitle>
        <p className="text-xs text-muted-foreground">
          Meals as rows, days as columns for quick scanning.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto scrollbar-hide">
          <div
            className="grid min-w-max gap-2"
            style={{ gridTemplateColumns: `72px repeat(${sortedDays.length}, minmax(116px, 1fr))` }}
          >
            <div className="sticky left-0 z-10 rounded-md bg-background/95 backdrop-blur-sm p-2 text-xs font-semibold text-muted-foreground">
              Meal
            </div>
            {sortedDays.map((dateKey) => {
              const day = week.menu[dateKey];
              return (
                <div key={`compact-header-${dateKey}`} className="rounded-md border border-border/60 bg-muted/30 p-2 text-center">
                  <p className="text-[11px] font-semibold leading-tight">{day.day.slice(0, 3)}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{dateKey.slice(5)}</p>
                </div>
              );
            })}

            {mealOrder.map((mealKey) => (
              <React.Fragment key={`compact-row-${mealKey}`}>
                <div className="sticky left-0 z-10 rounded-md bg-background/95 backdrop-blur-sm px-1.5 py-2">
                  <div className="flex items-center gap-1">
                  {React.createElement(mealIcons[mealKey], {
                    className: "h-3 w-3 text-primary shrink-0"
                  })}
                    <p className="text-[10px] font-medium leading-tight truncate">{mealTitles[mealKey]}</p>
                  </div>
                  <div className="min-w-0 mt-0.5">
                    <p className="text-[9px] text-muted-foreground leading-tight">{getMealTimeLabel(mealKey)}</p>
                  </div>
                </div>
                {sortedDays.map((dateKey) => {
                  const day = week.menu[dateKey];
                  const meal = day.meals[mealKey];
                  const filteredItems = meal ? filterMenuItems(meal.items) : [];

                  return (
                    <div key={`compact-cell-${mealKey}-${dateKey}`} className="rounded-md border border-border/60 bg-card p-2">
                      {meal ? (
                        <div className="space-y-1">
                          {filteredItems.length > 0 ? (
                            <div className="space-y-1">
                              {filteredItems.map((item, idx) => (
                                <p
                                  key={`${mealKey}-${dateKey}-${idx}`}
                                  className="text-[10px] leading-tight text-foreground/90"
                                >
                                  {typeof item === "string" ? item : item.name}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground leading-tight">No items</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">No meal</p>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DaySection({ day, dateKey }: { day: DayMenu; dateKey: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{day.day}</span>
          <span className="text-sm font-normal text-muted-foreground">{dateKey}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mealOrder.map((mealKey) => {
            const meal = day.meals[mealKey];
            if (!meal) return null;

            return (
              <MealCard
                key={mealKey}
                title={mealTitles[mealKey]}
                timeRange={`${meal.startTime} – ${meal.endTime} IST`}
                meal={meal}
                mealKey={mealKey}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const MealGridCard = React.memo(function MealGridCard({
  meal,
  mealKey,
  timeRange,
}: {
  meal: Meal;
  mealKey: MealKey;
  timeRange: string;
}) {
  const Icon = mealIcons[mealKey];
  const filteredItems = React.useMemo(() => filterMenuItems(meal.items), [meal.items]);

  return (
    <Card className="hover:shadow-md transition-shadow smooth-transition">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1">
            <Icon className="h-3 w-3 text-primary" />
            <span className="font-medium">{mealTitles[mealKey]}</span>
          </span>
          <span className="text-xs text-muted-foreground font-normal">{timeRange}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <div
                key={idx}
                className="text-xs rounded-md bg-muted/50 px-2 py-1 leading-tight border border-border/20"
              >
                {typeof item === 'string' ? item : item.name}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic py-2">
              No items available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

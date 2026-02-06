"use client";

import * as React from "react";
import type { Meal, MealKey, MenuItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Coffee, UtensilsCrossed, Cookie, Moon } from "lucide-react";
import { filterMenuItems } from "@/lib/exceptions";
import { isNonVeg, getSpecialType } from "@/lib/filters";

function getItemName(item: MenuItem | string): string {
  return typeof item === "string" ? item : item.name;
}

function getItemClasses(item: MenuItem | string): string {
  const special = getSpecialType(item);
  const nonVeg = isNonVeg(item);

  if (special === "non-veg" || (nonVeg && !special)) {
    return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-100";
  }
  if (special === "veg") {
    return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50 text-green-900 dark:text-green-100";
  }
  if (special === "other") {
    return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100";
  }

  return "bg-muted border-border/30";
}

function MealItems({
  items,
  withBackdrop,
}: {
  items: Array<MenuItem | string>;
  withBackdrop?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item, idx) => {
        const special = getSpecialType(item);
        return (
          <div
            key={idx}
            className={cn(
              "rounded-md border px-3 py-2 text-sm break-words",
              withBackdrop && "backdrop-blur-sm",
              getItemClasses(item)
            )}
          >
            {getItemName(item)}
            {special && (
              <span className="ml-1 text-[10px] font-medium opacity-75">
                {special === "veg" && "(Veg Spl)"}
                {special === "non-veg" && "(NV Spl)"}
                {special === "other" && "(Special)"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MealCardBase({
  title,
  timeRange,
  meal,
  mealKey,
  highlight,
  primaryUpcoming,
  isLive,
  tilt,
}: {
  title: string;
  timeRange: string;
  meal: Meal;
  mealKey: MealKey;
  highlight?: boolean;
  primaryUpcoming?: boolean;
  isLive?: boolean;
  tilt?: { x: number; y: number };
}) {
  const Icon = mealKey === "breakfast" ? Coffee : mealKey === "lunch" ? UtensilsCrossed : mealKey === "snacks" ? Cookie : Moon;
  const filteredItems = React.useMemo(() => filterMenuItems(meal.items), [meal.items]);

  const glow =
    highlight && tilt
      ? {
          transform: `translateY(${tilt.x * -2}px) rotateX(${tilt.x * 1.8}deg) rotateY(${tilt.y * 1.8}deg)`,
        }
      : undefined;

  const gradient = React.useMemo(() => {
    if (!highlight) return undefined;
    if (primaryUpcoming && isLive) {
      return "linear-gradient(135deg, hsl(50 95% 70% / 0.85), hsl(330 95% 70% / 0.85))";
    }
    if (primaryUpcoming && !isLive) {
      return "linear-gradient(135deg, black, rgba(255, 255, 255, 0.85))";
    }
    return undefined;
  }, [highlight, primaryUpcoming, isLive]);

  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15", gradient && "backdrop-blur-sm")}>
            <Icon className="h-5 w-5 text-primary dark:text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{timeRange}</p>
          </div>
        </div>
      </div>
      <MealItems items={filteredItems} withBackdrop={Boolean(gradient)} />
    </>
  );

  if (!gradient) {
    return (
      <Card className={cn("smooth-transition bg-card border", highlight ? "border-transparent" : "border-border/50")}>
        <div className="relative p-6">{content}</div>
      </Card>
    );
  }

  return (
    <div className="rounded-2xl p-[6px] relative smooth-transition" style={{ background: gradient, ...glow }}>
      <div className="rounded-[14px] bg-card h-full w-full">
        <Card className="bg-transparent border-0 shadow-none">
          <div className="relative p-6">{content}</div>
        </Card>
      </div>
    </div>
  );
}

export const MealCard = React.memo(MealCardBase);

"use client";

import * as React from "react";
import type { Meal, MealKey, MenuItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Coffee, UtensilsCrossed, Cookie, Moon } from "lucide-react";
import { filterMenuItems } from "@/lib/exceptions";
import { isNonVeg, getSpecialType } from "@/lib/filters";

/**
 * Renders menu item text that auto-scales to fit within its container.
 * Long names (e.g. "Chinese Accompaniments") shrink to avoid wrapping.
 */
function ItemText({ name, suffix }: { name: string; suffix?: React.ReactNode }) {
  const TEXT_THRESHOLD = 16;
  const needsScaling = name.length > TEXT_THRESHOLD;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 max-w-full",
        needsScaling && "text-[0.8em] leading-snug"
      )}
    >
      <span className="truncate min-w-0" title={name}>{name}</span>
      {suffix}
    </span>
  );
}

/**
 * Get the display name for a menu item (handles both V1 strings and V2 objects).
 */
function getItemName(item: MenuItem | string): string {
  return typeof item === 'string' ? item : item.name;
}

/**
 * Get CSS classes for a menu item based on its tags.
 * Handles both V1 (string) and V2 (MenuItem) formats gracefully.
 */
function getItemClasses(item: MenuItem | string): string {
  const special = getSpecialType(item);
  const nonVeg = isNonVeg(item);

  if (special === 'non-veg' || (nonVeg && !special)) {
    return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-100";
  }
  if (special === 'veg') {
    return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50 text-green-900 dark:text-green-100";
  }
  if (special === 'other') {
    return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100";
  }

  return "bg-muted border-border/30";
}

export function MealCard({
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
  const glow = highlight
    ? {
      transform: tilt ? `translateY(${tilt.x * -2}px) rotateX(${tilt.x * 1.8}deg) rotateY(${tilt.y * 1.8}deg)` : undefined,
    }
    : undefined;

  const card = (
    <Card className={cn(
      "smooth-transition hardware-accelerated bg-card border",
      highlight ? "border-transparent" : "border-border/50"
    )}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}>
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Icon className="h-5 w-5 text-primary dark:text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{timeRange}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filterMenuItems(meal.items).map((item, idx) => {
            const special = getSpecialType(item);
            return (
              <div key={idx} className={cn("rounded-md border px-3 py-2 text-sm overflow-hidden", getItemClasses(item))}>
                <ItemText
                  name={getItemName(item)}
                  suffix={special ? (
                    <span className="shrink-0 text-[10px] font-medium opacity-75 whitespace-nowrap">
                      {special === 'veg' && '(Veg Spl)'}
                      {special === 'non-veg' && '(NV Spl)'}
                      {special === 'other' && '(Special)'}
                    </span>
                  ) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );

  if (!highlight) return card;
  
  const gradient = (() => {
    if (primaryUpcoming && isLive) {
      return "linear-gradient(135deg, hsl(50 95% 70% / 0.85), hsl(330 95% 70% / 0.85))";
    }
    if (primaryUpcoming && !isLive) {
      return "linear-gradient(135deg, black, rgba(255, 255, 255, 0.85))";
    }
    return undefined;
  })();
  
  if (!gradient) return card;
  return (
    <div
      className="rounded-2xl p-[6px] relative smooth-transition hardware-accelerated"
      style={{
        background: gradient,
        ...glow,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)'
      }}
    >
      <div className="rounded-[14px] bg-card h-full w-full">
        <Card className="bg-transparent border-0 shadow-none hardware-accelerated">
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-primary dark:text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-sm text-muted-foreground">{timeRange}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filterMenuItems(meal.items).map((item, idx) => {
                const special = getSpecialType(item);
                return (
                  <div key={idx} className={cn("rounded-md border backdrop-blur-sm px-3 py-2 text-sm overflow-hidden", getItemClasses(item))}>
                    <ItemText
                      name={getItemName(item)}
                      suffix={special ? (
                        <span className="shrink-0 text-[10px] font-medium opacity-75 whitespace-nowrap">
                          {special === 'veg' && '(Veg Spl)'}
                          {special === 'non-veg' && '(NV Spl)'}
                          {special === 'other' && '(Special)'}
                        </span>
                      ) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}



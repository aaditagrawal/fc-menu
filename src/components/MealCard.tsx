"use client";

import * as React from "react";
import type { Meal, MealKey } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Coffee, UtensilsCrossed, Cookie, Moon } from "lucide-react";
import { filterMenuItems } from "@/lib/exceptions";

export function MealCard({
  title,
  timeRange,
  meal,
  mealKey,
  highlight,
  primaryUpcoming,
  tilt,
}: {
  title: string;
  timeRange: string;
  meal: Meal;
  mealKey: MealKey;
  highlight?: boolean;
  primaryUpcoming?: boolean;
  tilt?: { x: number; y: number };
}) {
  const Icon = mealKey === "breakfast" ? Coffee : mealKey === "lunch" ? UtensilsCrossed : mealKey === "snacks" ? Cookie : Moon;
  const hue = 220 + (tilt?.y ?? 0) * 40;
  const glow = highlight
    ? {
        transform: tilt ? `translateY(${tilt.x * -2}px) rotateX(${tilt.x * 1.8}deg) rotateY(${tilt.y * 1.8}deg)` : undefined,
      }
    : undefined;

  const card = (
    <Card className={cn(
      "transition-transform backdrop-blur-md bg-card/80 border",
      highlight ? "border-transparent" : "border-border/50"
    )}> 
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
          {filterMenuItems(meal.items).map((item, idx) => (
            <div key={idx} className="rounded-md bg-muted/60 backdrop-blur-sm px-3 py-2 text-sm">
              {item}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  if (!highlight) return card;
  return (
    <div
      className="rounded-2xl p-[6px] relative"
      style={{
        background: primaryUpcoming
          ? "linear-gradient(135deg, hsl(50 95% 70% / 0.85), hsl(330 95% 70% / 0.85))"
          : `linear-gradient(135deg, hsl(${hue} 80% 70% / 0.7), hsl(${(hue + 120) % 360} 80% 70% / 0.7))`,
        ...glow,
      }}
    >
      <div className="rounded-[14px] bg-card backdrop-blur-md h-full w-full">
        <Card className="bg-transparent border-0 shadow-none">
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
              {filterMenuItems(meal.items).map((item, idx) => (
                <div key={idx} className="rounded-md bg-muted/60 backdrop-blur-sm px-3 py-2 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}



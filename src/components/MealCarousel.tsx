"use client";

import * as React from "react";
import type { Meal, MealKey } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MealCarousel({
  meals,
  highlightKey,
  isPrimaryUpcoming,
}: {
  meals: Array<{ key: MealKey; meal: Meal; timeRange: string; title: string }>;
  highlightKey: MealKey;
  isPrimaryUpcoming: boolean;
}) {
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const [tilt, setTilt] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [centerIndex, setCenterIndex] = React.useState<number>(() =>
    Math.max(0, meals.findIndex((m) => m.key === highlightKey))
  );

  // Keep centered item in sync with highlighted meal
  React.useEffect(() => {
    const idx = meals.findIndex((m) => m.key === highlightKey);
    if (idx >= 0) setCenterIndex(idx);
  }, [highlightKey, meals]);

  // Scroll the focused item into view
  React.useEffect(() => {
    const el = itemRefs.current[centerIndex];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [centerIndex]);

  React.useEffect(() => {
    function handler(e: DeviceOrientationEvent) {
      const x = (e.beta ?? 0) / 45; // -45..45
      const y = (e.gamma ?? 0) / 45; // -45..45
      setTilt({ x, y });
    }
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  const goPrev = () => setCenterIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCenterIndex((i) => Math.min(meals.length - 1, i + 1));

  return (
    <div className="relative overflow-visible">
      {/* Arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-3">
        <button
          type="button"
          aria-label="Previous"
          onClick={goPrev}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/90 backdrop-blur hover:bg-muted"
          disabled={centerIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={goNext}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/90 backdrop-blur hover:bg-muted"
          disabled={centerIndex === meals.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Track */}
      <div className="flex gap-4 overflow-x-auto py-2 px-3 sm:px-0 snap-x snap-mandatory overflow-visible scrollbar-hide">
        {meals.map(({ key, meal, timeRange, title }, idx) => {
          const isActive = key === highlightKey;
          return (
            <div
              key={key}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className={cn(
                "min-w-[92%] sm:min-w-[55%] md:min-w-[48%] lg:min-w-[36%] snap-center transition overflow-visible px-1",
                isActive ? "opacity-100 scale-100" : "opacity-60 scale-[0.98]"
              )}
            >
              <MealCard
                title={title}
                timeRange={timeRange}
                meal={meal}
                mealKey={key}
                highlight={isActive}
                primaryUpcoming={isActive && isPrimaryUpcoming}
                tilt={tilt}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}



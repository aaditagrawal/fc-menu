"use client";

import * as React from "react";
import type { Meal, MealKey } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { cn } from "@/lib/utils";
import { useMountEffect } from "@/hooks/useMountEffect";

export interface MealCarouselHandle {
  goPrev: () => void;
  goNext: () => void;
}

export const MealCarousel = React.forwardRef<
  MealCarouselHandle,
  {
    meals: Array<{ key: MealKey; meal: Meal; timeRange: string; title: string }>;
    highlightKey: MealKey;
    isPrimaryUpcoming: boolean;
    isLive: boolean;
  }
>(function MealCarousel({ meals, highlightKey, isPrimaryUpcoming, isLive }, ref) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const highlightIndex = React.useMemo(
    () => Math.max(0, meals.findIndex((m) => m.key === highlightKey)),
    [meals, highlightKey]
  );

  const scrollToHighlight = React.useCallback(() => {
    const container = containerRef.current;
    const el = itemRefs.current[highlightIndex];
    if (!container || !el) return;

    const containerWidth = container.clientWidth;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const scrollX = elLeft - (containerWidth - elWidth) / 2;

    container.scrollTo({ left: scrollX, behavior: "instant" });
  }, [highlightIndex]);

  React.useLayoutEffect(() => {
    scrollToHighlight();
  }, [scrollToHighlight]);

  useMountEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(scrollToHighlight, 100);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  });

  const goPrev = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  }, []);

  const goNext = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  React.useImperativeHandle(ref, () => ({ goPrev, goNext }), [goPrev, goNext]);

  useMountEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="relative overflow-visible">
      <div
        ref={containerRef}
        tabIndex={0}
        className="flex gap-4 overflow-x-auto py-4 px-3 sm:px-0 snap-x snap-mandatory scrollbar-hide rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          touchAction: "pan-x pan-y",
          overscrollBehaviorX: "contain",
        }}
      >
        {meals.map(({ key, meal, timeRange, title }, idx) => {
          const isHighlighted = key === highlightKey;
          return (
            <div
              key={key}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className={cn(
                "carousel-card snap-center w-[85%] sm:w-[60%] md:w-[50%] lg:w-[38%] flex-shrink-0 px-1 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                isHighlighted
                  ? "opacity-100 scale-100"
                  : "opacity-60 scale-[0.97] motion-reduce:scale-100"
              )}
            >
              <MealCard
                title={title}
                timeRange={timeRange}
                meal={meal}
                mealKey={key}
                highlight={isHighlighted}
                primaryUpcoming={isPrimaryUpcoming && isHighlighted}
                isLive={isLive && isHighlighted}
                tiltEnabled={isHighlighted}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

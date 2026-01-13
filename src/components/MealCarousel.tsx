"use client";

import * as React from "react";
import type { Meal, MealKey } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { cn } from "@/lib/utils";

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
  const [tilt, setTilt] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const highlightIndex = React.useMemo(
    () => Math.max(0, meals.findIndex((m) => m.key === highlightKey)),
    [meals, highlightKey]
  );

  // Center on highlighted meal
  const scrollToHighlight = React.useCallback(() => {
    const container = containerRef.current;
    const el = itemRefs.current[highlightIndex];
    if (!container || !el) return;

    const containerWidth = container.clientWidth;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const scrollX = elLeft - (containerWidth - elWidth) / 2;

    container.scrollLeft = scrollX;
  }, [highlightIndex]);

  // Scroll to highlighted meal on mount
  React.useLayoutEffect(() => {
    scrollToHighlight();
  }, [scrollToHighlight]);

  // Re-center on resize to maintain proper position
  React.useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(scrollToHighlight, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [scrollToHighlight]);

  // Device orientation tilt effect
  React.useEffect(() => {
    function handler(e: DeviceOrientationEvent) {
      const x = (e.beta ?? 0) / 45;
      const y = (e.gamma ?? 0) / 45;
      setTilt({ x, y });
    }
    window.addEventListener("deviceorientation", handler, { passive: true });
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  // Smooth scroll by a percentage of container width
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

  // Expose navigation functions via ref
  React.useImperativeHandle(ref, () => ({ goPrev, goNext }), [goPrev, goNext]);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext]);

  return (
    <div className="relative overflow-visible">
      {/* Track - smooth continuous scrolling */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto py-2 px-3 sm:px-0 scroll-smooth scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
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
                "w-[85%] sm:w-[60%] md:w-[50%] lg:w-[38%] flex-shrink-0 px-1",
                isHighlighted ? "opacity-100" : "opacity-75"
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
                tilt={tilt}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

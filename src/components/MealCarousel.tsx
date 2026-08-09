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

let reducedMotionMql: MediaQueryList | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  reducedMotionMql ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return reducedMotionMql.matches;
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

  // Page by exactly one card so arrow keys don't fight mandatory scroll-snap.
  const getCardStep = React.useCallback(() => {
    const container = containerRef.current;
    const firstCard = itemRefs.current[0];
    if (!container || !firstCard) return container?.clientWidth ?? 0;
    const gap = parseFloat(getComputedStyle(container).columnGap);
    return firstCard.offsetWidth + (Number.isNaN(gap) ? 16 : gap);
  }, []);

  const goPrev = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollBy({
      left: -getCardStep(),
      behavior: prefersReducedMotion() ? "instant" : "smooth",
    });
  }, [getCardStep]);

  const goNext = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollBy({
      left: getCardStep(),
      behavior: prefersReducedMotion() ? "instant" : "smooth",
    });
  }, [getCardStep]);

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

  // Where scroll-driven animations are unsupported (Firefox), the carousel-focus
  // CSS animation never runs, so dim/scale must follow the centered card instead.
  const [viewTimelineSupported, setViewTimelineSupported] = React.useState(true);
  const [centeredIndex, setCenteredIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const supported =
      typeof CSS !== "undefined" &&
      CSS.supports("animation-timeline", "view(inline)");
    setViewTimelineSupported(supported);
    if (supported || typeof IntersectionObserver === "undefined") return;

    const cards = itemRefs.current.filter(
      (el): el is HTMLDivElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = cards.indexOf(entry.target as HTMLDivElement);
          if (index !== -1 && (best === null || entry.intersectionRatio > best.ratio)) {
            best = { index, ratio: entry.intersectionRatio };
          }
        }
        if (best) setCenteredIndex(best.index);
      },
      { root: container, threshold: 0.6 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [meals]);

  const focusedIndex = viewTimelineSupported
    ? highlightIndex
    : (centeredIndex ?? highlightIndex);

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
          const isFocused = idx === focusedIndex;
          return (
            <div
              key={key}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className={cn(
                "carousel-card snap-center w-[85%] sm:w-[60%] md:w-[50%] lg:w-[38%] flex-shrink-0 px-1 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                isFocused
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

"use client";

import * as React from "react";
import type { Meal, MealKey } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSmoothScroll } from "@/lib/scroll";

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
  const [activeIndex, setActiveIndex] = React.useState<number>(() =>
    Math.max(0, meals.findIndex((m) => m.key === highlightKey))
  );
  const isProgrammaticScroll = React.useRef(false);
  const scrollResetTimeout = React.useRef<number | null>(null);
  const scrollRaf = React.useRef<number | null>(null);
  const { containerRef, scrollToElement } = useSmoothScroll();

  // Keep centered item in sync with highlighted meal and center it in view
  React.useEffect(() => {
    const idx = meals.findIndex((m) => m.key === highlightKey);
    if (idx >= 0 && idx !== activeIndex) {
      isProgrammaticScroll.current = true;
      setActiveIndex(idx);
      requestAnimationFrame(() => {
        const el = itemRefs.current[idx];
        if (el) scrollToElement(el);
        if (scrollResetTimeout.current) window.clearTimeout(scrollResetTimeout.current);
        scrollResetTimeout.current = window.setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 320);
      });
    }
  }, [activeIndex, highlightKey, meals, scrollToElement]);

  // Center to the initial highlighted item on mount
  React.useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      isProgrammaticScroll.current = true;
      scrollToElement(el);
      scrollResetTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 320);
    }
    return () => {
      if (scrollResetTimeout.current) window.clearTimeout(scrollResetTimeout.current);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    function handler(e: DeviceOrientationEvent) {
      const x = (e.beta ?? 0) / 45; // -45..45
      const y = (e.gamma ?? 0) / 45; // -45..45
      setTilt({ x, y });
    }
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  const goPrev = () => {
    const next = Math.max(0, activeIndex - 1);
    if (next === activeIndex) return;
    isProgrammaticScroll.current = true;
    setActiveIndex(next);
    requestAnimationFrame(() => {
      const el = itemRefs.current[next];
      if (el) scrollToElement(el);
      if (scrollResetTimeout.current) window.clearTimeout(scrollResetTimeout.current);
      scrollResetTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 320);
    });
  };

  const goNext = () => {
    const next = Math.min(meals.length - 1, activeIndex + 1);
    if (next === activeIndex) return;
    isProgrammaticScroll.current = true;
    setActiveIndex(next);
    requestAnimationFrame(() => {
      const el = itemRefs.current[next];
      if (el) scrollToElement(el);
      if (scrollResetTimeout.current) window.clearTimeout(scrollResetTimeout.current);
      scrollResetTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 320);
    });
  };

  const handleScroll = React.useCallback(() => {
    if (isProgrammaticScroll.current) return;
    const container = containerRef.current;
    if (!container) return;
    const viewportCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = activeIndex;
    let closestDistance = Number.POSITIVE_INFINITY;

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(elCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = idx;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  }, [activeIndex, containerRef]);

  const handleScrollEvent = () => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(handleScroll);
  };

  return (
    <div className="relative overflow-visible">
      {/* Arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-3">
        <button
          type="button"
          aria-label="Previous"
          onClick={goPrev}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-background/80 backdrop-blur-md hover:bg-background/90 hover:border-white/30 transition-all duration-200"
          disabled={activeIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={goNext}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-background/80 backdrop-blur-md hover:bg-background/90 hover:border-white/30 transition-all duration-200"
          disabled={activeIndex === meals.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Track */}
      <div 
        ref={containerRef}
        onScroll={handleScrollEvent}
        className="flex gap-4 overflow-x-auto py-2 px-3 sm:px-0 snap-x snap-mandatory scrollbar-hide scroll-smooth scroll-momentum scroll-optimized" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          willChange: 'auto',
          transform: 'translateZ(0)',
          touchAction: 'panX'
        }}>
        {meals.map(({ key, meal, timeRange, title }, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={key}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className={cn(
                "min-w-[92%] sm:min-w-[55%] md:min-w-[48%] lg:min-w-[36%] snap-center smooth-transition hardware-accelerated px-1",
                isActive ? "opacity-100 scale-100" : "opacity-60 scale-[0.98]"
              )}
              style={{
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                transition: 'all 0.08s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <MealCard
                title={title}
                timeRange={timeRange}
                meal={meal}
                mealKey={key}
                highlight={isActive}
                primaryUpcoming={isActive && isPrimaryUpcoming && key === highlightKey}
                tilt={tilt}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}



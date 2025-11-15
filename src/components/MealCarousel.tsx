"use client";

import * as React from "react";
import type { Meal, MealKey } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSmoothScroll, useTouchScroll } from "@/lib/scroll";

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
  const { containerRef, scrollToElement, scrollVelocity } = useSmoothScroll();
  const { velocity: touchVelocity } = useTouchScroll();

  // Keep centered item in sync with highlighted meal
  React.useEffect(() => {
    const idx = meals.findIndex((m) => m.key === highlightKey);
    if (idx >= 0) setCenterIndex(idx);
  }, [highlightKey, meals]);

  // Scroll to element when centerIndex changes (from buttons or highlighting)
  React.useEffect(() => {
    const el = itemRefs.current[centerIndex];
    if (el && containerRef.current) {
      requestAnimationFrame(() => {
        scrollToElement(el);
      });
    }
  }, [centerIndex, scrollToElement]);

  // Ultra-responsive scroll with velocity tracking
  React.useEffect(() => {
    const currentVelocity = Math.max(scrollVelocity.current || 0, Math.abs(touchVelocity.current?.x || 0));
    
    if (currentVelocity > 0.1) {
      const el = itemRefs.current[centerIndex];
      if (el) {
        requestAnimationFrame(() => {
          scrollToElement(el);
        });
      }
    }
  }, [centerIndex, scrollToElement, scrollVelocity, touchVelocity]);

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
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-background/80 backdrop-blur-md hover:bg-background/90 hover:border-white/30 transition-all duration-200"
          disabled={centerIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={goNext}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-background/80 backdrop-blur-md hover:bg-background/90 hover:border-white/30 transition-all duration-200"
          disabled={centerIndex === meals.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Track */}
      <div 
        ref={containerRef}
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
          const isActive = key === highlightKey;
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



"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import type { Meal, MealKey } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { sxc } from "@/lib/utils";
import { useMountEffect } from "@/hooks/useMountEffect";

const styles = stylex.create({
  root: {
    position: "relative",
    overflow: "visible",
  },
  scroller: {
    display: "flex",
    rowGap: "1rem",
    columnGap: "1rem",
    overflowX: "auto",
    paddingBlock: "1rem",
    paddingInline: {
      default: "0.75rem",
      "@media (min-width: 640px)": "0",
    },
    scrollSnapType: "x mandatory",
    borderRadius: "1rem",
    outlineStyle: {
      default: null,
      ":focus-visible": "none",
    },
    boxShadow: {
      default: null,
      ":focus-visible":
        "0 0 0 2px var(--background), 0 0 0 4px color-mix(in oklab, var(--ring) 40%, transparent)",
    },
  },
  // Highlight scale/opacity are declared here, but the transition itself is
  // owned by the `carousel-card` global class cascade (globals.css), which
  // swaps to a scroll-driven animation where `animation-timeline: view()` is
  // supported.
  item: {
    scrollSnapAlign: "center",
    width: {
      default: "85%",
      "@media (min-width: 640px)": "60%",
      "@media (min-width: 768px)": "50%",
      "@media (min-width: 1024px)": "38%",
    },
    flexShrink: 0,
    paddingInline: "0.25rem",
  },
  itemHighlighted: {
    opacity: 1,
    scale: "1",
  },
  itemDimmed: {
    opacity: 0.6,
    // Tailwind v4 emits scale-* as the standalone `scale` property,
    // so it must be listed explicitly — `transform` won't animate it.
    scale: {
      default: "0.97",
      "@media (prefers-reduced-motion: reduce)": "1",
    },
  },
  scrim: {
    pointerEvents: "none",
    position: "absolute",
    insetBlock: 0,
    width: {
      default: "1.5rem",
      "@media (min-width: 640px)": "3rem",
    },
  },
  scrimLeft: {
    left: 0,
    backgroundImage: "linear-gradient(to right in oklab, var(--background), transparent)",
  },
  scrimRight: {
    right: 0,
    backgroundImage: "linear-gradient(to left in oklab, var(--background), transparent)",
  },
});

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
    () =>
      Math.max(
        0,
        meals.findIndex((m) => m.key === highlightKey),
      ),
    [meals, highlightKey],
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

  // iOS-style rubber band when navigating past either end: the rail nudges
  // outward and springs back with one damped overshoot. WAAPI on the scroller
  // (transform only) so it runs on the compositor; the edge scrims are
  // siblings, so they stay put while the content shifts under them.
  const bounceAnimation = React.useRef<Animation | null>(null);
  const bounceEdge = React.useCallback((direction: "start" | "end") => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const shift = direction === "start" ? 16 : -16;
    bounceAnimation.current?.cancel();
    bounceAnimation.current = container.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(${shift}px)`, offset: 0.3 },
        { transform: `translateX(${shift * -0.25}px)`, offset: 0.7 },
        { transform: "translateX(0)" },
      ],
      { duration: 340, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }, []);

  const goPrev = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollLeft <= 1) {
      bounceEdge("start");
      return;
    }
    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  }, [bounceEdge]);

  const goNext = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (container.scrollLeft >= maxScroll - 1) {
      bounceEdge("end");
      return;
    }
    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, [bounceEdge]);

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
    <div {...stylex.props(styles.root)}>
      <div
        ref={containerRef}
        tabIndex={0}
        {...sxc("scrollbar-hide", styles.scroller)}
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
              {...sxc(
                "carousel-card",
                styles.item,
                isHighlighted ? styles.itemHighlighted : styles.itemDimmed,
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
      {/* Edge fades are static overlay scrims, not a mask-image on the
          scroller: masking a scroll container can knock it off composited
          scrolling (notably in Safari), while these layers never repaint. */}
      <div aria-hidden {...stylex.props(styles.scrim, styles.scrimLeft)} />
      <div aria-hidden {...stylex.props(styles.scrim, styles.scrimRight)} />
    </div>
  );
});

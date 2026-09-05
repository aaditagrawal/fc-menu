"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import type { Meal, MealKey, MenuItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { sxc } from "@/lib/utils";
import { Coffee, UtensilsCrossed, Cookie, Moon } from "lucide-react";
import { filterMenuItems } from "@/lib/exceptions";
import { isNonVeg, getSpecialType } from "@/lib/filters";

const styles = stylex.create({
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(1, minmax(0, 1fr))",
      "@media (min-width: 640px)": "repeat(2, minmax(0, 1fr))",
    },
    rowGap: "0.5rem",
    columnGap: "0.5rem",
  },
  item: {
    borderRadius: "calc(var(--radius) - 2px)",
    borderWidth: "1px",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    overflowWrap: "break-word",
  },
  itemBackdrop: {
    WebkitBackdropFilter: "blur(8px)",
    backdropFilter: "blur(8px)",
  },
  // The badge-* custom properties flip with the `.dark` class (globals.css),
  // replacing the old `dark:` utility variants.
  badgeRed: {
    backgroundColor: "var(--badge-red-bg)",
    borderColor: "var(--badge-red-border)",
    color: "var(--badge-red-text)",
  },
  badgeGreen: {
    backgroundColor: "var(--badge-green-bg)",
    borderColor: "var(--badge-green-border)",
    color: "var(--badge-green-text)",
  },
  badgeBlue: {
    backgroundColor: "var(--badge-blue-bg)",
    borderColor: "var(--badge-blue-border)",
    color: "var(--badge-blue-text)",
  },
  badgeNeutral: {
    backgroundColor: "var(--muted)",
    borderColor: "color-mix(in oklab, var(--border) 30%, transparent)",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    rowGap: "0.75rem",
    columnGap: "0.75rem",
  },
  iconCircle: {
    display: "inline-flex",
    height: "2.25rem",
    width: "2.25rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    backgroundColor: "color-mix(in oklab, var(--primary) 10%, transparent)",
    boxShadow: "0 0 0 1px color-mix(in oklab, var(--primary) 10%, transparent)",
  },
  iconCircleOnGradient: {
    WebkitBackdropFilter: "blur(8px)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 0 0 1px color-mix(in oklab, #fff 20%, transparent)",
  },
  icon: {
    height: "18px",
    width: "18px",
    // --meal-type-icon: var(--primary) in light, var(--foreground) in dark.
    color: "var(--meal-type-icon)",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.125rem",
  },
  title: {
    fontWeight: 600,
    fontSize: "17px",
    letterSpacing: "-0.01em",
    lineHeight: 1,
  },
  time: {
    fontSize: "13px",
    color: "var(--muted-foreground)",
    lineHeight: 1,
  },
  // Replicates the Card base (ui/card.tsx) — this shell stays a plain div so
  // the `smooth-transition` / `elevated-card` global classes (which carry a
  // `.dark` shadow variant) can be applied as class strings.
  cardShell: {
    borderRadius: "1rem",
    borderWidth: "1px",
    backgroundColor: "var(--card)",
    color: "var(--card-foreground)",
  },
  cardShellHighlight: {
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
  },
  cardShellIdle: {
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
    boxShadow: "none",
  },
  cardPad: {
    position: "relative",
    paddingBlock: "1.5rem",
    paddingInline: "1.5rem",
  },
  gradientShell: {
    borderRadius: "1rem",
    paddingBlock: "1.5px",
    paddingInline: "1.5px",
    position: "relative",
  },
  gradientBg: (image: string) => ({
    backgroundImage: image,
  }),
  gradientInner: {
    borderRadius: "calc(1rem - 1.5px)",
    backgroundColor: "var(--card)",
    height: "100%",
    width: "100%",
  },
  innerCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    boxShadow: "none",
    borderRadius: "inherit",
  },
});

function getItemStyle(item: MenuItem) {
  const special = getSpecialType(item);
  const nonVeg = isNonVeg(item);

  if (special === "non-veg" || (nonVeg && !special)) {
    return styles.badgeRed;
  }
  if (special === "veg") {
    return styles.badgeGreen;
  }
  if (special === "other") {
    return styles.badgeBlue;
  }

  return styles.badgeNeutral;
}

function MealItems({ items, withBackdrop }: { items: MenuItem[]; withBackdrop?: boolean }) {
  return (
    <div {...stylex.props(styles.itemsGrid)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          {...stylex.props(styles.item, withBackdrop && styles.itemBackdrop, getItemStyle(item))}
        >
          {item.name}
        </div>
      ))}
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
  tiltEnabled,
}: {
  title: string;
  timeRange: string;
  meal: Meal;
  mealKey: MealKey;
  highlight?: boolean;
  primaryUpcoming?: boolean;
  isLive?: boolean;
  tiltEnabled?: boolean;
}) {
  const Icon =
    mealKey === "breakfast"
      ? Coffee
      : mealKey === "lunch"
        ? UtensilsCrossed
        : mealKey === "snacks"
          ? Cookie
          : Moon;
  const filteredItems = React.useMemo(() => filterMenuItems(meal.items), [meal.items]);
  const tiltRef = React.useRef<HTMLDivElement>(null);

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
  const hasGradient = Boolean(gradient);

  // Tilt writes straight to the element inside rAF — routing it through React
  // state re-renders the whole card tree on every orientation tick.
  React.useEffect(() => {
    const el = tiltRef.current;
    if (!tiltEnabled || !el) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number | null = null;
    function handler(e: DeviceOrientationEvent) {
      if (raf !== null) return;
      const x = Math.max(-1, Math.min(1, (e.beta ?? 0) / 45));
      const y = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 45));
      raf = requestAnimationFrame(() => {
        raf = null;
        if (tiltRef.current) {
          tiltRef.current.style.transform = `translate3d(0, ${x * -2}px, 0) rotateX(${x * 1.8}deg) rotateY(${y * 1.8}deg)`;
        }
      });
    }

    window.addEventListener("deviceorientation", handler, { passive: true });
    return () => {
      window.removeEventListener("deviceorientation", handler);
      if (raf !== null) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [tiltEnabled, hasGradient]);

  const content = (
    <>
      <div {...stylex.props(styles.headerRow)}>
        <div {...stylex.props(styles.headerLeft)}>
          <div {...stylex.props(styles.iconCircle, hasGradient && styles.iconCircleOnGradient)}>
            <Icon {...stylex.props(styles.icon)} strokeWidth={1.75} />
          </div>
          <div {...stylex.props(styles.titleBlock)}>
            <h3 {...stylex.props(styles.title)}>{title}</h3>
            <p {...sxc("tabular-nums", styles.time)}>{timeRange}</p>
          </div>
        </div>
      </div>
      <MealItems items={filteredItems} withBackdrop={Boolean(gradient)} />
    </>
  );

  if (!gradient) {
    return (
      <div
        {...sxc(
          highlight ? "smooth-transition elevated-card" : "smooth-transition",
          styles.cardShell,
          highlight ? styles.cardShellHighlight : styles.cardShellIdle,
        )}
      >
        <div {...stylex.props(styles.cardPad)}>{content}</div>
      </div>
    );
  }

  return (
    <div
      ref={tiltRef}
      {...sxc("smooth-transition elevated-card", styles.gradientShell, styles.gradientBg(gradient))}
    >
      <div {...stylex.props(styles.gradientInner)}>
        <Card style={styles.innerCard}>
          <div {...stylex.props(styles.cardPad)}>{content}</div>
        </Card>
      </div>
    </div>
  );
}

export const MealCard = React.memo(MealCardBase);

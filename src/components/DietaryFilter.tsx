"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { easing } from "@/lib/tokens.stylex";
import type { DietaryFilter as DietaryFilterType } from "@/lib/filters";

const styles = stylex.create({
  wrap: {
    display: "flex",
    alignItems: "center",
    columnGap: "0.5rem",
  },
  pillGroup: {
    display: "flex",
    alignItems: "center",
    columnGap: "0.125rem",
    paddingInline: "0.125rem",
    paddingBlock: "0.125rem",
    borderRadius: "9999px",
    backgroundColor: "color-mix(in oklab, var(--muted) 60%, transparent)",
  },
  pill: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    columnGap: "0.375rem",
    height: "1.75rem",
    paddingInline: "0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 500,
    transitionProperty: {
      default: "background-color,color,box-shadow,scale",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionDuration: "150ms",
    transitionTimingFunction: easing.spring,
    scale: {
      default: null,
      ":active": {
        default: "0.96",
        "@media (prefers-reduced-motion: reduce)": "1",
      },
    },
    outlineStyle: {
      default: null,
      ":focus-visible": "none",
    },
  },
  pillActive: {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    boxShadow: {
      default: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      ":focus-visible":
        "0 0 0 2px var(--ring), 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    },
  },
  pillInactive: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": "var(--foreground)",
    },
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 2px var(--ring)",
    },
  },
  jainToggle: {
    display: "flex",
    alignItems: "center",
    columnGap: "0.375rem",
    borderRadius: "9999px",
    outlineStyle: {
      default: null,
      ":focus-visible": "none",
    },
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 2px var(--ring)",
    },
    // Replaces the old `group-active:` utilities: StyleX has no ancestor
    // selectors, so the press stretch is driven by an inherited custom
    // property the knob reads through `scale`.
    "--jain-knob-scale-x": {
      default: "1",
      ":active": {
        default: "1.25",
        "@media (prefers-reduced-motion: reduce)": "1",
      },
    },
  },
  jainLabel: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 500,
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
  },
  jainLabelOn: {
    color: "var(--warn-accent)",
  },
  jainLabelOff: {
    color: "var(--muted-foreground)",
  },
  track: {
    position: "relative",
    width: "2rem",
    height: "18px",
    borderRadius: "9999px",
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
  },
  trackOn: {
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
  trackOff: {
    backgroundColor: "color-mix(in oklab, var(--muted-foreground) 30%, transparent)",
  },
  knob: {
    position: "absolute",
    top: "2px",
    height: "14px",
    width: "14px",
    borderRadius: "9999px",
    backgroundColor: "#fff",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    transitionProperty: "transform,translate,scale,rotate",
    transitionDuration: "200ms",
    transitionTimingFunction: easing.spring,
    scale: "var(--jain-knob-scale-x) 1",
  },
  knobOn: {
    translate: "16px",
    transformOrigin: "right",
  },
  knobOff: {
    translate: "2px",
    transformOrigin: "left",
  },
});

interface DietaryFilterProps {
  value: DietaryFilterType;
  onChange: (value: DietaryFilterType) => void;
  style?: stylex.StyleXStyles;
}

/** FSSAI-style veg/non-veg indicator (square border with circle inside) */
function FoodTypeIcon({ type, size = 12 }: { type: "veg" | "non-veg"; size?: number }) {
  const color = type === "veg" ? "#16a34a" : "#dc2626";
  const r = size * 0.22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={1.5}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
      />
      <circle cx={size / 2} cy={size / 2} r={r} fill={color} />
    </svg>
  );
}

const MAIN_FILTERS: { value: DietaryFilterType; label: string; icon?: "veg" | "non-veg" }[] = [
  { value: "all", label: "All" },
  { value: "veg-only", label: "Veg", icon: "veg" },
  { value: "non-veg-only", label: "Non-Veg", icon: "non-veg" },
];

export function DietaryFilter({ value, onChange, style }: DietaryFilterProps) {
  const isJain = value === "jain";
  const mainValue = isJain ? null : value;

  return (
    <div {...stylex.props(styles.wrap, style)}>
      {/* Main veg/non-veg filter pills */}
      <div {...stylex.props(styles.pillGroup)}>
        {MAIN_FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            {...stylex.props(
              styles.pill,
              mainValue === option.value ? styles.pillActive : styles.pillInactive,
            )}
          >
            {option.icon && <FoodTypeIcon type={option.icon} />}
            {option.label}
          </button>
        ))}
      </div>

      {/* Jain toggle — Swiggy-style switch since it's a different menu */}
      <button
        role="switch"
        aria-checked={isJain}
        onClick={() => onChange(isJain ? "all" : "jain")}
        {...stylex.props(styles.jainToggle)}
      >
        <span
          {...stylex.props(styles.jainLabel, isJain ? styles.jainLabelOn : styles.jainLabelOff)}
        >
          Jain
        </span>
        <div {...stylex.props(styles.track, isJain ? styles.trackOn : styles.trackOff)}>
          {/* iOS switch detail: the knob stretches inward from its anchored
              side while pressed, then springs to the other side on release. */}
          <div {...stylex.props(styles.knob, isJain ? styles.knobOn : styles.knobOff)} />
        </div>
      </button>
    </div>
  );
}

export default DietaryFilter;

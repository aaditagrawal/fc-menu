"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DietaryFilter as DietaryFilterType } from "@/lib/filters";

interface DietaryFilterProps {
  value: DietaryFilterType;
  onChange: (value: DietaryFilterType) => void;
  className?: string;
}

/** FSSAI-style veg/non-veg indicator (square border with circle inside) */
function FoodTypeIcon({ type, size = 12 }: { type: "veg" | "non-veg"; size?: number }) {
  const color = type === "veg" ? "#16a34a" : "#dc2626";
  const r = size * 0.22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect
        x={1} y={1}
        width={size - 2} height={size - 2}
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

export function DietaryFilter({ value, onChange, className }: DietaryFilterProps) {
  const isJain = value === "jain";
  const mainValue = isJain ? null : value;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Main veg/non-veg filter pills */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-muted/60">
        {MAIN_FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative h-7 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mainValue === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
        className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
      >
        <span className={cn(
          "text-xs font-medium transition-colors",
          isJain ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
        )}>
          Jain
        </span>
        <div className={cn(
          "relative w-8 h-[18px] rounded-full transition-colors",
          isJain ? "bg-amber-500" : "bg-muted-foreground/30"
        )}>
          <div className={cn(
            "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform",
            isJain ? "translate-x-[16px]" : "translate-x-[2px]"
          )} />
        </div>
      </button>
    </div>
  );
}

export default DietaryFilter;

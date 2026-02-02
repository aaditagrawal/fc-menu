"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DietaryFilter as DietaryFilterType } from "@/lib/filters";

interface DietaryFilterProps {
  value: DietaryFilterType;
  onChange: (value: DietaryFilterType) => void;
  className?: string;
}

const FILTER_OPTIONS: { value: DietaryFilterType; label: string; emoji?: string }[] = [
  { value: "all", label: "All" },
  { value: "veg-only", label: "Veg", emoji: "leaf" },
  { value: "non-veg-only", label: "Non-Veg" },
  { value: "jain", label: "Jain" },
];

export function DietaryFilter({ value, onChange, className }: DietaryFilterProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-muted/50", className)}>
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-all",
            value === option.value && "shadow-sm",
            option.value === "veg-only" && value === option.value && "bg-green-600 hover:bg-green-700",
            option.value === "non-veg-only" && value === option.value && "bg-red-600 hover:bg-red-700",
            option.value === "jain" && value === option.value && "bg-amber-600 hover:bg-amber-700"
          )}
        >
          {option.value === "veg-only" && (
            <svg
              className="w-3 h-3 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          )}
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export default DietaryFilter;

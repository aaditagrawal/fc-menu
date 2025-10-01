"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function InlineSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
  menuClassName,
}: {
  label?: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
  className?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        className={cn(
          "underline decoration-dotted underline-offset-4 text-foreground/90 hover:text-foreground",
          "px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-ring"
        )}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label ? `${label}: ` : null}
        <span className="font-medium">{selected?.label ?? String(value)}</span>
      </button>
      {open ? (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] rounded-md border bg-popover p-1 shadow-md",
            menuClassName
          )}
        >
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              role="option"
              aria-selected={opt.value === value}
              className={cn(
                "block w-full text-left px-3 py-2 rounded-md",
                opt.value === value ? "bg-muted" : "hover:bg-muted"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}



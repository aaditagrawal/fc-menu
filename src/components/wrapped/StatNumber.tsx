"use client";

import { useLayoutEffect, useRef } from "react";
import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";

const styles = stylex.create({
  mono: {
    fontFamily: "var(--font-mono)",
  },
});

// A fixed locale: the final value is server-rendered, and a runtime-locale
// toLocaleString() would format differently on the server and client.
const numberFormat = new Intl.NumberFormat("en-US");

interface StatNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  /** wrapped.css classes only (e.g. "accent-rose") */
  className?: string;
  style?: stylex.StyleXStyles;
  duration?: number;
}

export function StatNumber({
  value,
  suffix,
  prefix,
  className,
  style,
  duration = 800,
}: StatNumberProps) {
  const ref = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  // React always renders the final value (correct without JS, for SSR and for
  // assistive tech). The count-up overrides the text imperatively, so it costs
  // one text write per frame instead of a React render per frame, and every
  // exit path restores the text React rendered.
  useLayoutEffect(() => {
    const el = ref.current;
    const numberEl = numberRef.current;
    if (!el || !numberEl) return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const finalText = numberFormat.format(value);
    let rafId: number | null = null;
    let shown = 0;
    numberEl.textContent = numberFormat.format(shown);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const startTime = performance.now();
        const animate = (currentTime: number) => {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          // Easing function: easeOutExpo
          const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const next = Math.floor(value * easeProgress);
          if (next !== shown) {
            shown = next;
            numberEl.textContent = numberFormat.format(next);
          }
          rafId = progress < 1 ? requestAnimationFrame(animate) : null;
        };
        rafId = requestAnimationFrame(animate);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      numberEl.textContent = finalText;
    };
  }, [value, duration]);

  return (
    <div
      ref={ref}
      {...sxc(["stat-number", className].filter(Boolean).join(" "), styles.mono, style)}
    >
      {prefix}
      <span ref={numberRef}>{numberFormat.format(value)}</span>
      {suffix}
    </div>
  );
}

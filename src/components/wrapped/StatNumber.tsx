"use client";

import { useEffect, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";

const styles = stylex.create({
  mono: {
    fontFamily: "var(--font-mono)",
  },
});

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
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateValue();
          }
        });
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnimated]);

  const animateValue = () => {
    const startTime = performance.now();
    const startValue = 0;
    const endValue = value;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div
      ref={ref}
      {...sxc(["stat-number", className].filter(Boolean).join(" "), styles.mono, style)}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </div>
  );
}

"use client";

import { useRef } from "react";
import type * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { useMountEffect } from "@/hooks/useMountEffect";

interface SlideProps {
  children: React.ReactNode;
  className?: string;
  style?: stylex.StyleXStyles;
  pattern?: "dots" | "none";
}

export function Slide({ children, className, style, pattern = "none" }: SlideProps) {
  const ref = useRef<HTMLElement>(null);

  // Latched `is-visible` gates the entrance CSS in wrapped.css: entrances play
  // once, the first time the slide scrolls in, and never replay on scroll-back.
  useMountEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        el.classList.add("is-visible");
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  });

  return (
    <section
      ref={ref}
      {...sxc(
        ["wrapped-slide", pattern === "dots" && "pattern-dots", className]
          .filter(Boolean)
          .join(" "),
        style,
      )}
    >
      {children}
    </section>
  );
}

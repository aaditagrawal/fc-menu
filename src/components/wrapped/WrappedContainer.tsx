"use client";

import { useLayoutEffect, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { useMountEffect } from "@/hooks/useMountEffect";

const styles = stylex.create({
  // Was `hidden sm:flex`. Note: like the original Tailwind utilities, this
  // loses to the unlayered `.nav-dots { display: flex }` rule in wrapped.css.
  navDisplay: {
    display: {
      default: "none",
      "@media (min-width: 640px)": "flex",
    },
  },
});

interface WrappedContainerProps {
  children: React.ReactNode;
  slideCount: number;
}

function getSlides(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll(":scope > .wrapped-slide"));
}

function scrollToSlide(container: HTMLElement, index: number) {
  const slides = getSlides(container);
  const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
  slide?.scrollIntoView({
    block: "start",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
}

export function WrappedContainer({ children, slideCount }: WrappedContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const activeSlideRef = useRef(0);

  // Enables the CSS that holds slide entrances until each slide is observed.
  // A layout effect, so the gate lands in the hydration frame rather than a
  // frame later; and only when IntersectionObserver exists, so nothing can
  // stay hidden.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !("IntersectionObserver" in window)) return;
    container.classList.add("wrapped-anim");
    return () => container.classList.remove("wrapped-anim");
  }, []);

  // Active slide = whichever slide crosses the container's horizontal center
  // line. Unlike scrollTop / clientHeight math, this can't drift with 100vh vs
  // 100dvh or with slides that overflow taller than the viewport.
  useMountEffect(() => {
    const container = containerRef.current;
    if (!container || !("IntersectionObserver" in window)) return;

    const slides = getSlides(container);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = slides.indexOf(entry.target);
          if (index === -1) continue;
          activeSlideRef.current = index;
          setActiveSlide(index);
        }
      },
      { root: container, rootMargin: "-49.5% 0px -49.5% 0px" },
    );
    for (const slide of slides) observer.observe(slide);
    return () => observer.disconnect();
  });

  useMountEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        scrollToSlide(container, activeSlideRef.current + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToSlide(container, activeSlideRef.current - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      <div
        ref={containerRef}
        className="wrapped-container"
        data-hint-paused={activeSlide > 0 ? "" : undefined}
      >
        {children}
      </div>

      {/* Navigation dots */}
      <div {...sxc("nav-dots", styles.navDisplay)}>
        {Array.from({ length: slideCount }).map((_, i) => (
          <button
            key={i}
            className={`nav-dot ${i === activeSlide ? "active" : ""}`}
            onClick={() => {
              if (containerRef.current) scrollToSlide(containerRef.current, i);
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </>
  );
}

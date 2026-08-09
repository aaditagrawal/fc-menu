"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface WrappedContainerProps {
    children: React.ReactNode;
    slideCount: number;
}

let reducedMotionMql: MediaQueryList | null = null;

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;
    reducedMotionMql ??= window.matchMedia("(prefers-reduced-motion: reduce)");
    return reducedMotionMql.matches;
}

export function WrappedContainer({ children, slideCount }: WrappedContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const activeSlideRef = useRef(0);
    const slideCountRef = useRef(slideCount);
    slideCountRef.current = slideCount;

    // Gate class enables the CSS that hides slides until observed. Added in
    // useLayoutEffect so there is no flash of visible-then-hidden on load;
    // without IntersectionObserver the gate never applies and content stays visible.
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container || typeof IntersectionObserver === "undefined") return;
        container.classList.add("wrapped-anim");
        return () => container.classList.remove("wrapped-anim");
    }, []);

    // Active-slide detection via observation rather than scroll math, so
    // overflow-tall slides and dvh sizing can't drift the nav dots.
    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof IntersectionObserver === "undefined") return;

        const slides = Array.from(container.querySelectorAll(".wrapped-slide"));
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const index = slides.indexOf(entry.target as Element);
                    if (index !== -1) {
                        activeSlideRef.current = index;
                        setActiveSlide(index);
                    }
                }
            },
            { root: container, threshold: 0.5 }
        );
        slides.forEach((slide) => observer.observe(slide));
        return () => observer.disconnect();
    }, [slideCount]);

    const scrollToSlide = useCallback((index: number) => {
        const container = containerRef.current;
        if (!container) return;
        const slide = container.querySelectorAll(".wrapped-slide")[index];
        slide?.scrollIntoView({
            behavior: prefersReducedMotion() ? "instant" : "smooth",
            block: "start",
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown" || e.key === " ") {
                e.preventDefault();
                scrollToSlide(Math.min(activeSlideRef.current + 1, slideCountRef.current - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                scrollToSlide(Math.max(activeSlideRef.current - 1, 0));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [scrollToSlide]);

    return (
        <>
            <div ref={containerRef} className="wrapped-container">
                {children}
            </div>

            {/* Navigation dots */}
            <div className="nav-dots hidden sm:flex">
                {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                        key={i}
                        className={`nav-dot ${i === activeSlide ? "active" : ""}`}
                        onClick={() => scrollToSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface WrappedContainerProps {
    children: React.ReactNode;
    slideCount: number;
}

export function WrappedContainer({ children, slideCount }: WrappedContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const slideHeight = container.clientHeight;
            const newActiveSlide = Math.round(scrollTop / slideHeight);
            setActiveSlide(newActiveSlide);
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const container = containerRef.current;
            if (!container) return;

            if (e.key === "ArrowDown" || e.key === " ") {
                e.preventDefault();
                const nextSlide = Math.min(activeSlide + 1, slideCount - 1);
                container.scrollTo({
                    top: nextSlide * container.clientHeight,
                    behavior: "smooth",
                });
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const prevSlide = Math.max(activeSlide - 1, 0);
                container.scrollTo({
                    top: prevSlide * container.clientHeight,
                    behavior: "smooth",
                });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeSlide, slideCount]);

    const scrollToSlide = (index: number) => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({
            top: index * container.clientHeight,
            behavior: "smooth",
        });
    };

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

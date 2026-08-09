"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatNumberProps {
    value: number;
    suffix?: string;
    prefix?: string;
    className?: string;
    duration?: number;
}

export function StatNumber({
    value,
    suffix,
    prefix,
    className,
    duration = 800,
}: StatNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (hasAnimated) return;
        const el = ref.current;
        if (!el) return;

        let rafId: number | null = null;

        const animateValue = () => {
            setHasAnimated(true);

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                setDisplayValue(value);
                return;
            }

            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function: easeOutExpo
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                setDisplayValue(Math.floor(value * easeProgress));

                if (progress < 1) {
                    rafId = requestAnimationFrame(animate);
                }
            };

            rafId = requestAnimationFrame(animate);
        };

        if (typeof IntersectionObserver === "undefined") {
            animateValue();
            return () => {
                if (rafId !== null) cancelAnimationFrame(rafId);
            };
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        observer.disconnect();
                        animateValue();
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(el);

        return () => {
            observer.disconnect();
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, [hasAnimated, value, duration]);

    return (
        <div ref={ref} className={cn("stat-number font-mono", className)}>
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
        </div>
    );
}

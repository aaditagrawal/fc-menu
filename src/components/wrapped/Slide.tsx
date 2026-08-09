"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SlideProps {
    children: React.ReactNode;
    className?: string;
    pattern?: "dots" | "none";
}

export function Slide({ children, className, pattern = "none" }: SlideProps) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Latched: entrances play once and never replay on scroll-back.
        if (typeof IntersectionObserver === "undefined") {
            el.classList.add("is-visible");
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        el.classList.add("is-visible");
                        observer.disconnect();
                    }
                }
            },
            { threshold: 0.25 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={ref}
            className={cn(
                "wrapped-slide",
                pattern === "dots" && "pattern-dots",
                className
            )}
        >
            {children}
        </section>
    );
}

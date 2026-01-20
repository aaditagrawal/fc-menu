import { cn } from "@/lib/utils";

interface SlideProps {
    children: React.ReactNode;
    className?: string;
    pattern?: "dots" | "none";
}

export function Slide({ children, className, pattern = "none" }: SlideProps) {
    return (
        <section
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

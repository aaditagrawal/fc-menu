import { cn } from "@/lib/utils";
import type { DishVariation } from "@/lib/wrapped/types";

interface DishCloudProps {
    variations: DishVariation[];
    maxCount?: number;
    accentColor?: "rose" | "yellow";
}

export function DishCloud({
    variations,
    maxCount = 15,
    accentColor = "rose",
}: DishCloudProps) {
    const displayed = variations.slice(0, maxCount);
    const maxFreq = Math.max(...displayed.map((v) => v.count));

    const getSizeClass = (count: number): string => {
        const ratio = count / maxFreq;
        if (ratio > 0.8) return "dish-tag-lg";
        if (ratio < 0.3) return "dish-tag-sm";
        return "";
    };

    const getTagStyle = (index: number): { bgClass: string; textClass: string } => {
        if (index === 0) {
            // Top item gets accent background with white text for contrast
            return {
                bgClass: accentColor === "rose" ? "bg-rose" : "bg-yellow",
                textClass: "text-white dark:text-black font-semibold",
            };
        }
        return {
            bgClass: "bg-muted",
            textClass: "",
        };
    };

    return (
        <div className="dish-cloud">
            {displayed.map((variation, index) => {
                const { bgClass, textClass } = getTagStyle(index);
                return (
                    <span
                        key={variation.name}
                        className={cn(
                            "dish-tag border border-border/30",
                            getSizeClass(variation.count),
                            bgClass,
                            textClass
                        )}
                        style={{
                            animationDelay: `${index * 50}ms`,
                        }}
                    >
                        {variation.name}
                        {variation.count > 1 && (
                            <span className={cn(
                                "ml-1 text-xs",
                                index === 0 ? "opacity-80" : "opacity-60"
                            )}>
                                ×{variation.count}
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

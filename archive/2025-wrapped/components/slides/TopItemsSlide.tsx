import { Slide } from "../Slide";
import type { DishVariation } from "@/lib/wrapped/types";

interface TopItemsSlideProps {
    title: string;
    emoji: string;
    items: DishVariation[];
    mealType: "breakfast" | "dinner" | "overall";
}

export function TopItemsSlide({
    title,
    emoji,
    items,
    mealType,
}: TopItemsSlideProps) {
    const accentClass = mealType === "breakfast" ? "accent-yellow" : "accent-rose";

    return (
        <Slide pattern="dots">
            <div className="text-center space-y-8 max-w-xl mx-auto">
                <div className="text-5xl animate-scale-in">{emoji}</div>

                <h2 className="text-2xl sm:text-3xl font-bold animate-slide-up delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    {title}
                </h2>

                <div className="space-y-4 mt-8">
                    {items.slice(0, 5).map((item, index) => (
                        <div
                            key={item.name}
                            className="flex items-center gap-4 animate-slide-up"
                            style={{
                                opacity: 0,
                                animationFillMode: 'forwards',
                                animationDelay: `${200 + index * 100}ms`,
                            }}
                        >
                            <div className={`text-3xl font-mono font-bold ${index === 0 ? accentClass : 'text-muted-foreground'}`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 text-left">
                                <div className={`stat-card ${index === 0 ? 'border-rose border-2' : ''}`}>
                                    <div className="flex justify-between items-center">
                                        <span className={`font-medium ${index === 0 ? accentClass : ''}`}>
                                            {item.name}
                                        </span>
                                        <span className="font-mono text-muted-foreground">
                                            {item.count}×
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {items[0] && (
                    <p className="text-sm text-muted-foreground mt-4 animate-fade-in delay-800" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        You probably had <span className={`font-medium ${accentClass}`}>{items[0].name}</span> on most days!
                    </p>
                )}
            </div>
        </Slide>
    );
}

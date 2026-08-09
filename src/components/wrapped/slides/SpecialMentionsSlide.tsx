import { Slide } from "../Slide";
import { DishCloud } from "../DishCloud";
import type { DishVariation } from "@/lib/wrapped/types";

interface SpecialMentionsSlideProps {
    items: DishVariation[];
    title: string;
    emoji: string;
    tagline: string;
}

export function SpecialMentionsSlide({
    items,
    title,
    emoji,
    tagline,
}: SpecialMentionsSlideProps) {
    if (items.length === 0) return null;

    return (
        <Slide>
            <div className="text-center space-y-8 max-w-xl mx-auto">
                <div className="text-5xl animate-scale-in">{emoji}</div>

                <h2 className="text-2xl sm:text-3xl font-bold animate-slide-up stagger-1">
                    {title}
                </h2>

                <p className="text-muted-foreground animate-slide-up stagger-2">
                    {tagline}
                </p>

                <div className="mt-8 animate-fade-in stagger-4">
                    <DishCloud variations={items} maxCount={12} accentColor="yellow" />
                </div>

                {items[0] && (
                    <p className="text-sm text-muted-foreground mt-6 animate-fade-in stagger-6">
                        Top pick: <span className="font-medium text-foreground">{items[0].name}</span>
                    </p>
                )}
            </div>
        </Slide>
    );
}

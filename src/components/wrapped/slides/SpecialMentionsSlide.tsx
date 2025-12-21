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

                <h2 className="text-2xl sm:text-3xl font-bold animate-slide-up delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    {title}
                </h2>

                <p className="text-muted-foreground animate-slide-up delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    {tagline}
                </p>

                <div className="mt-8 animate-fade-in delay-400" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    <DishCloud variations={items} maxCount={12} accentColor="yellow" />
                </div>

                {items[0] && (
                    <p className="text-sm text-muted-foreground mt-6 animate-fade-in delay-600" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        Top pick: <span className="font-medium text-foreground">{items[0].name}</span>
                    </p>
                )}
            </div>
        </Slide>
    );
}

import { Slide } from "../Slide";
import { StatNumber } from "../StatNumber";
import { DishCloud } from "../DishCloud";
import type { DishCategory } from "@/lib/wrapped/types";

interface CategorySlideProps {
    category: DishCategory;
    tagline: string;
    subTagline?: string;
}

export function CategorySlide({
    category,
    tagline,
    subTagline,
}: CategorySlideProps) {
    const variationCount = category.variations.length;

    return (
        <Slide>
            <div className="text-center space-y-8 max-w-2xl mx-auto">
                <div className="text-6xl animate-scale-in">{category.emoji}</div>

                <p className="text-lg text-muted-foreground animate-slide-up delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    {tagline}
                </p>

                <div className="flex items-baseline justify-center gap-2">
                    <StatNumber value={category.totalCount} className="accent-rose" />
                    <span className="text-2xl text-muted-foreground">times</span>
                </div>

                {variationCount > 1 && (
                    <p className="text-xl animate-slide-up delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        ...but with <span className="font-mono font-bold accent-yellow">{variationCount}</span> different names
                    </p>
                )}

                {subTagline && (
                    <p className="text-muted-foreground text-sm animate-fade-in delay-400" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        {subTagline}
                    </p>
                )}

                <div className="mt-8 animate-fade-in delay-500" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    <DishCloud variations={category.variations} accentColor="rose" />
                </div>

                {category.variations[0] && (
                    <p className="text-sm text-muted-foreground mt-6 animate-fade-in delay-700" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        Most popular: <span className="font-medium text-foreground">{category.variations[0].name}</span> ({category.variations[0].count}×)
                    </p>
                )}
            </div>
        </Slide>
    );
}

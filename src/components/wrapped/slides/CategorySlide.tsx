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

                <p className="text-lg text-muted-foreground animate-slide-up stagger-1">
                    {tagline}
                </p>

                <div className="flex items-baseline justify-center gap-2">
                    <StatNumber value={category.totalCount} className="accent-rose" />
                    <span className="text-2xl text-muted-foreground">times</span>
                </div>

                {variationCount > 1 && (
                    <p className="text-xl animate-slide-up stagger-3">
                        ...but with <span className="font-mono font-bold accent-yellow">{variationCount}</span> different names
                    </p>
                )}

                {subTagline && (
                    <p className="text-muted-foreground text-sm animate-fade-in stagger-4">
                        {subTagline}
                    </p>
                )}

                <div className="mt-8 animate-fade-in stagger-5">
                    <DishCloud variations={category.variations} accentColor="rose" />
                </div>

                {category.variations[0] && (
                    <p className="text-sm text-muted-foreground mt-6 animate-fade-in stagger-7">
                        Most popular: <span className="font-medium text-foreground">{category.variations[0].name}</span> ({category.variations[0].count}×)
                    </p>
                )}
            </div>
        </Slide>
    );
}

"use client";

import {
    WrappedContainer,
    IntroSlide,
    TotalMealsSlide,
    CategorySlide,
    TopItemsSlide,
    DayPatternsSlide,
    StapleAlertSlide,
    SummarySlide,
    SpecialMentionsSlide,
} from "@/components/wrapped";
import type { WrappedStats } from "@/lib/wrapped/types";

interface WrappedClientProps {
    stats: WrappedStats;
}

export function WrappedClient({ stats }: WrappedClientProps) {
    // Calculate total slide count based on what we're showing
    const hasSweets = stats.sweetTreats.length > 0;
    const hasSnacks = stats.snackHighlights.length > 0;
    // Base slides: Intro, Meals, MVP, Paneer, Chicken, Dal, Breakfast, Dinner, Days, Summary = 10 slides
    const slideCount = 10 + (hasSweets ? 1 : 0) + (hasSnacks ? 1 : 0);

    return (
        <WrappedContainer slideCount={slideCount}>
            {/* Slide 1: Intro */}
            <IntroSlide dateRange={stats.dateRange} />

            {/* Slide 2: Total Meals - uses static values internally */}
            <TotalMealsSlide />

            {/* Slide 3: The Real MVP - Most repeated staple */}
            <StapleAlertSlide mostRepeated={stats.mostRepeated} />

            {/* Slide 4: Paneer Variations */}
            <CategorySlide
                category={stats.categories.paneer}
                tagline="Paneer was served"
                subTagline="The cottage cheese conspiracy continues..."
            />

            {/* Slide 5: Chicken Variations */}
            <CategorySlide
                category={stats.categories.chicken}
                tagline="Chicken was served"
                subTagline="From Butter to Tandoori, we've seen it all"
            />

            {/* Slide 6: Dal Variations */}
            <CategorySlide
                category={stats.categories.dal}
                tagline="Dal & Lentils appeared"
                subTagline="Protein packed, name creative"
            />

            {/* Slide 7: Top Breakfast Items */}
            <TopItemsSlide
                title="Breakfast Champions"
                emoji="🌅"
                items={stats.topBreakfastItems}
                mealType="breakfast"
            />

            {/* Slide 8: Top Dinner Items */}
            <TopItemsSlide
                title="Dinner Favorites"
                emoji="🌙"
                items={stats.topDinnerItems}
                mealType="dinner"
            />

            {/* Slide 9: Sweet Treats (if available) */}
            {hasSweets && (
                <SpecialMentionsSlide
                    title="Sweet Endings"
                    emoji="🍮"
                    items={stats.sweetTreats}
                    tagline="The desserts that made it to the menu"
                />
            )}

            {/* Slide 10: Snack Highlights (if available) */}
            {hasSnacks && (
                <SpecialMentionsSlide
                    title="Snack Attack"
                    emoji="🍟"
                    items={stats.snackHighlights}
                    tagline="The best bites between meals"
                />
            )}

            {/* Slide 11: Day Signatures */}
            <DayPatternsSlide patterns={stats.dayPatterns} />

            {/* Slide 12: Summary */}
            <SummarySlide />
        </WrappedContainer>
    );
}

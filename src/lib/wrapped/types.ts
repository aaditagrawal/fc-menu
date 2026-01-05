import type {} from "@/lib/types";

export interface DishVariation {
    name: string;
    count: number;
}

export interface DishCategory {
    name: string;
    keywords: string[];
    emoji: string;
    variations: DishVariation[];
    totalCount: number;
}

export interface MealStats {
    breakfast: number;
    lunch: number;
    snacks: number;
    dinner: number;
}

export interface DayPattern {
    dayName: string;
    signature: string[];
    frequency: Record<string, number>;
}

export interface FunFact {
    type: "longest" | "shortest" | "weird" | "repeated" | "creative";
    title: string;
    value: string;
    count?: number;
}

export interface WrappedStats {
    totalWeeks: number;
    totalDays: number;
    totalMeals: number;
    mealCounts: MealStats;
    allItems: string[];
    categories: {
        paneer: DishCategory;
        chicken: DishCategory;
        fish: DishCategory;
        dal: DishCategory;
        rice: DishCategory;
        bread: DishCategory;
    };
    topBreakfastItems: DishVariation[];
    topDinnerItems: DishVariation[];
    topOverallItems: DishVariation[];
    dayPatterns: DayPattern[];
    funFacts: FunFact[];
    mostRepeated: DishVariation;
    sweetTreats: DishVariation[];
    snackHighlights: DishVariation[];
    dateRange: {
        start: string;
        end: string;
    };
}

export interface HistoryWeek {
    week: string;
    foodCourt: string;
    startDate: string;
    endDate: string;
    numDays: number;
    weekMonday: string;
    lastModified: string;
}

export interface HistoryListResponse {
    weeks: HistoryWeek[];
}

export interface SlideProps {
    stats: WrappedStats;
    isActive?: boolean;
}

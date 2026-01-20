import { Slide } from "../Slide";
import { StatNumber } from "../StatNumber";

// Static values as requested - data is fixed for this wrapped
const STATIC_MEAL_COUNTS = {
    breakfast: 104,
    lunch: 104,
    snacks: 104,
    dinner: 104,
};
const STATIC_TOTAL_MEALS = 416;
const STATIC_TOTAL_DAYS = 104;

export function TotalMealsSlide() {
    return (
        <Slide pattern="dots">
            <div className="text-center space-y-8">
                <p className="text-lg text-muted-foreground animate-slide-up">
                    We tracked
                </p>

                <StatNumber value={STATIC_TOTAL_MEALS} className="accent-rose" />

                <p className="text-2xl sm:text-3xl font-medium animate-slide-up delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    meal services
                </p>

                <p className="text-muted-foreground animate-slide-up delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    across <span className="font-mono font-bold">{STATIC_TOTAL_DAYS}</span> days
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border/30 max-w-xl mx-auto">
                    <div className="stat-card animate-slide-up delay-400" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        <div className="text-2xl font-mono font-bold">{STATIC_MEAL_COUNTS.breakfast}</div>
                        <div className="text-sm text-muted-foreground">Breakfasts</div>
                    </div>
                    <div className="stat-card animate-slide-up delay-500" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        <div className="text-2xl font-mono font-bold">{STATIC_MEAL_COUNTS.lunch}</div>
                        <div className="text-sm text-muted-foreground">Lunches</div>
                    </div>
                    <div className="stat-card animate-slide-up delay-600" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        <div className="text-2xl font-mono font-bold">{STATIC_MEAL_COUNTS.snacks}</div>
                        <div className="text-sm text-muted-foreground">Snacks</div>
                    </div>
                    <div className="stat-card animate-slide-up delay-700" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        <div className="text-2xl font-mono font-bold">{STATIC_MEAL_COUNTS.dinner}</div>
                        <div className="text-sm text-muted-foreground">Dinners</div>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground italic mt-4 animate-fade-in delay-800" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    That&apos;s a lot of rice 🍚
                </p>
            </div>
        </Slide>
    );
}

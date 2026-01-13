import { Slide } from "../Slide";
import type { DayPattern } from "@/lib/wrapped/types";

interface DayPatternsSlideProps {
    patterns: DayPattern[];
}

const DAY_EMOJIS: Record<string, string> = {
    Monday: "📅",
    Tuesday: "🌮",
    Wednesday: "🐫",
    Thursday: "🍕",
    Friday: "🎉",
    Saturday: "🌟",
    Sunday: "☀️",
};

export function DayPatternsSlide({ patterns }: DayPatternsSlideProps) {
    return (
        <Slide>
            <div className="text-center space-y-8 max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold animate-slide-up">
                    Day Signatures
                </h2>

                <p className="text-muted-foreground animate-slide-up delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    Dishes that stood out each day
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    {patterns.slice(0, 6).map((pattern, index) => (
                        <div
                            key={pattern.dayName}
                            className="stat-card flex flex-col items-center text-center animate-slide-up"
                            style={{
                                opacity: 0,
                                animationFillMode: 'forwards',
                                animationDelay: `${200 + index * 100}ms`,
                            }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <span className="text-xl">{DAY_EMOJIS[pattern.dayName] || "📆"}</span>
                                <span className="font-semibold">{pattern.dayName}</span>
                            </div>
                            <div className="space-y-1 w-full">
                                {pattern.signature.length > 0 ? (
                                    pattern.signature.slice(0, 2).map((dish, i) => (
                                        <div
                                            key={dish}
                                            className={`text-sm ${i === 0 ? 'accent-rose font-medium' : 'text-muted-foreground'}`}
                                        >
                                            {dish}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">
                                        Mostly staples
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4 animate-fade-in delay-800" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    Excluding daily staples like rice, roti, and curd
                </p>
            </div>
        </Slide>
    );
}

import { Slide } from "../Slide";
import { StatNumber } from "../StatNumber";
import type { DishVariation } from "@/lib/wrapped/types";

interface StapleAlertSlideProps {
    mostRepeated: DishVariation;
}

export function StapleAlertSlide({ mostRepeated }: StapleAlertSlideProps) {
    return (
        <Slide pattern="dots">
            <div className="text-center space-y-8 max-w-xl mx-auto">
                <div className="text-6xl animate-scale-in">🍚</div>

                <h2 className="text-2xl sm:text-3xl font-bold animate-slide-up stagger-1">
                    The Real MVP
                </h2>

                <p className="text-muted-foreground animate-slide-up stagger-2">
                    Every hero needs a sidekick...
                    <br />
                    or in this case, a main character
                </p>

                <div className="stat-card border-2 border-rose py-8 animate-scale-in stagger-3">
                    <p className="text-2xl sm:text-3xl font-bold accent-rose mb-4">
                        {mostRepeated.name}
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                        <StatNumber value={mostRepeated.count} className="text-4xl" />
                        <span className="text-lg text-muted-foreground">appearances</span>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mt-4 animate-fade-in stagger-6">
                    The unsung hero of every meal 🫡
                </p>
            </div>
        </Slide>
    );
}

import { ChevronDown } from "lucide-react";
import { Slide } from "../Slide";

interface IntroSlideProps {
    dateRange: { start: string; end: string };
}

export function IntroSlide({ dateRange }: IntroSlideProps) {
    const year = dateRange.end.split("-")[0] || "2025";

    return (
        <Slide className="relative">
            <div className="text-center space-y-6 animate-scale-in">
                <div className="text-5xl sm:text-7xl font-bold tracking-tight">
                    <span className="accent-rose">FC2</span> Menu
                </div>
                <div className="text-4xl sm:text-6xl font-bold tracking-tight">
                    Wrapped
                </div>
                <div className="text-2xl sm:text-3xl font-mono accent-yellow">
                    {year}
                </div>
                <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto mt-8 animate-fade-in delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    A look back at what Food Court 2 served this semester
                </p>
                <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto animate-fade-in delay-500" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    Data from mid-August to December 2025
                    <br />
                    <span className="opacity-70">Since the launch of fc2.coolstuff.work</span>
                </p>
            </div>

            <div className="scroll-hint">
                <span className="text-sm text-muted-foreground">Scroll to explore</span>
                <ChevronDown className="w-5 h-5" />
            </div>
        </Slide>
    );
}

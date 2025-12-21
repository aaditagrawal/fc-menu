import Link from "next/link";
import { MoveLeft, Code2 } from "lucide-react";
import { Slide } from "../Slide";
import type { WrappedStats } from "@/lib/wrapped/types";

interface SummarySlideProps {
    stats: WrappedStats;
}

export function SummarySlide({ stats }: SummarySlideProps) {
    const year = "2025";

    return (
        <Slide pattern="dots">
            <div className="text-center space-y-12 max-w-xl mx-auto w-full px-4">
                <div className="text-5xl animate-scale-in">✨</div>

                <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-bold animate-slide-up delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        That&apos;s a Wrap!
                    </h2>
                </div>

                <div className="animate-slide-up delay-300 py-8" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    <p className="text-lg sm:text-2xl font-medium leading-relaxed max-w-md mx-auto">
                        Around <span className="accent-rose font-bold">4,000</span> people eat at<br />The Indian Kitchen every meal.<br /><br />
                        <span className="text-muted-foreground">That&apos;s a lot of food! 🍛</span>
                    </p>
                </div>

                <div className="pt-8 space-y-3 animate-fade-in delay-500 max-w-xs mx-auto" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    <Link
                        href="/"
                        className="group flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium hover:text-rose transition-colors"
                    >
                        <MoveLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </Link>

                    <a
                        href="https://blog.aadit.cc/posts/building-a-food-court-menu/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Code2 className="w-4 h-4" />
                        <span className="border-b border-transparent group-hover:border-foreground/20 transition-colors">
                            How was the FC2 menu website made
                        </span>
                    </a>
                </div>
            </div>
        </Slide>
    );
}

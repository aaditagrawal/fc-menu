import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";
import { DishCloud } from "../DishCloud";
import type { DishVariation } from "@/lib/wrapped/types";

const styles = stylex.create({
  // Was `text-center space-y-8 max-w-xl mx-auto`
  stack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "2rem",
    textAlign: "center",
    maxWidth: "36rem",
    marginInline: "auto",
  },
  emoji: {
    fontSize: "3rem",
    lineHeight: 1,
  },
  heading: {
    fontSize: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    lineHeight: {
      default: "calc(2 / 1.5)",
      "@media (min-width: 640px)": "calc(2.25 / 1.875)",
    },
    fontWeight: 700,
  },
  tagline: {
    color: "var(--muted-foreground)",
  },
  foot: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  topPick: {
    fontWeight: 500,
    color: "var(--foreground)",
  },
});

interface SpecialMentionsSlideProps {
  items: DishVariation[];
  title: string;
  emoji: string;
  tagline: string;
}

export function SpecialMentionsSlide({ items, title, emoji, tagline }: SpecialMentionsSlideProps) {
  if (items.length === 0) return null;

  return (
    <Slide>
      <div {...stylex.props(styles.stack)}>
        <div {...sxc("animate-scale-in", styles.emoji)}>{emoji}</div>

        <h2
          {...sxc("animate-slide-up delay-100", styles.heading)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {title}
        </h2>

        <p
          {...sxc("animate-slide-up delay-200", styles.tagline)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {tagline}
        </p>

        <div
          className="animate-fade-in delay-400"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <DishCloud variations={items} maxCount={12} accentColor="yellow" />
        </div>

        {items[0] && (
          <p
            {...sxc("animate-fade-in delay-600", styles.foot)}
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            Top pick: <span {...stylex.props(styles.topPick)}>{items[0].name}</span>
          </p>
        )}
      </div>
    </Slide>
  );
}

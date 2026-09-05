import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";
import { StatNumber } from "../StatNumber";
import { DishCloud } from "../DishCloud";
import type { DishCategory } from "@/lib/wrapped/types";

const styles = stylex.create({
  // Was `text-center space-y-8 max-w-2xl mx-auto`
  stack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "2rem",
    textAlign: "center",
    maxWidth: "42rem",
    marginInline: "auto",
  },
  emoji: {
    fontSize: "3.75rem",
    lineHeight: 1,
  },
  tagline: {
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    color: "var(--muted-foreground)",
  },
  row: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    columnGap: "0.5rem",
    rowGap: "0.5rem",
  },
  times: {
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
    color: "var(--muted-foreground)",
  },
  variation: {
    fontSize: "1.25rem",
    lineHeight: "calc(1.75 / 1.25)",
  },
  monoBold: {
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  sub: {
    color: "var(--muted-foreground)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  footnote: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  popular: {
    fontWeight: 500,
    color: "var(--foreground)",
  },
});

interface CategorySlideProps {
  category: DishCategory;
  tagline: string;
  subTagline?: string;
}

export function CategorySlide({ category, tagline, subTagline }: CategorySlideProps) {
  const variationCount = category.variations.length;

  return (
    <Slide>
      <div {...stylex.props(styles.stack)}>
        <div {...sxc("animate-scale-in", styles.emoji)}>{category.emoji}</div>

        <p
          {...sxc("animate-slide-up delay-100", styles.tagline)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {tagline}
        </p>

        <div {...stylex.props(styles.row)}>
          <StatNumber value={category.totalCount} className="accent-rose" />
          <span {...stylex.props(styles.times)}>times</span>
        </div>

        {variationCount > 1 && (
          <p
            {...sxc("animate-slide-up delay-300", styles.variation)}
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            ...but with <span {...sxc("accent-yellow", styles.monoBold)}>{variationCount}</span>{" "}
            different names
          </p>
        )}

        {subTagline && (
          <p
            {...sxc("animate-fade-in delay-400", styles.sub)}
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            {subTagline}
          </p>
        )}

        <div
          className="animate-fade-in delay-500"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <DishCloud variations={category.variations} accentColor="rose" />
        </div>

        {category.variations[0] && (
          <p
            {...sxc("animate-fade-in delay-700", styles.footnote)}
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            Most popular:{" "}
            <span {...stylex.props(styles.popular)}>{category.variations[0].name}</span> (
            {category.variations[0].count}×)
          </p>
        )}
      </div>
    </Slide>
  );
}

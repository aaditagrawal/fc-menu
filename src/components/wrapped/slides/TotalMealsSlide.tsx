import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";
import { StatNumber } from "../StatNumber";

const styles = stylex.create({
  // Was `text-center space-y-8`
  stack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "2rem",
    textAlign: "center",
  },
  intro: {
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    color: "var(--muted-foreground)",
  },
  services: {
    fontSize: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    lineHeight: {
      default: "calc(2 / 1.5)",
      "@media (min-width: 640px)": "calc(2.25 / 1.875)",
    },
    fontWeight: 500,
  },
  days: {
    color: "var(--muted-foreground)",
  },
  monoBold: {
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (min-width: 640px)": "repeat(4, minmax(0, 1fr))",
    },
    rowGap: "1rem",
    columnGap: "1rem",
    paddingTop: "2rem",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "color-mix(in oklab, var(--border) 30%, transparent)",
    maxWidth: "36rem",
    marginInline: "auto",
  },
  cardNum: {
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  cardLabel: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  foot: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
});

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
      <div {...stylex.props(styles.stack)}>
        <p {...sxc("animate-slide-up", styles.intro)}>We tracked</p>

        <StatNumber value={STATIC_TOTAL_MEALS} className="accent-rose" />

        <p
          {...sxc("animate-slide-up delay-200", styles.services)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          meal services
        </p>

        <p
          {...sxc("animate-slide-up delay-300", styles.days)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          across <span {...stylex.props(styles.monoBold)}>{STATIC_TOTAL_DAYS}</span> days
        </p>

        <div {...stylex.props(styles.grid)}>
          <div
            className="stat-card animate-slide-up delay-400"
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <div {...stylex.props(styles.cardNum)}>{STATIC_MEAL_COUNTS.breakfast}</div>
            <div {...stylex.props(styles.cardLabel)}>Breakfasts</div>
          </div>
          <div
            className="stat-card animate-slide-up delay-500"
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <div {...stylex.props(styles.cardNum)}>{STATIC_MEAL_COUNTS.lunch}</div>
            <div {...stylex.props(styles.cardLabel)}>Lunches</div>
          </div>
          <div
            className="stat-card animate-slide-up delay-600"
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <div {...stylex.props(styles.cardNum)}>{STATIC_MEAL_COUNTS.snacks}</div>
            <div {...stylex.props(styles.cardLabel)}>Snacks</div>
          </div>
          <div
            className="stat-card animate-slide-up delay-700"
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <div {...stylex.props(styles.cardNum)}>{STATIC_MEAL_COUNTS.dinner}</div>
            <div {...stylex.props(styles.cardLabel)}>Dinners</div>
          </div>
        </div>

        <p
          {...sxc("animate-fade-in delay-800", styles.foot)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          That&apos;s a lot of rice 🍚
        </p>
      </div>
    </Slide>
  );
}

import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";
import type { DayPattern } from "@/lib/wrapped/types";

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
  sub: {
    color: "var(--muted-foreground)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(1, minmax(0, 1fr))",
      "@media (min-width: 640px)": "repeat(2, minmax(0, 1fr))",
    },
    rowGap: "1rem",
    columnGap: "1rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  dayRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: "0.5rem",
    rowGap: "0.5rem",
    marginBottom: "0.75rem",
  },
  dayEmoji: {
    fontSize: "1.25rem",
    lineHeight: "calc(1.75 / 1.25)",
  },
  dayName: {
    fontWeight: 600,
  },
  // Was `space-y-1 w-full`
  list: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.25rem",
    width: "100%",
  },
  dish: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  medium: {
    fontWeight: 500,
  },
  mutedColor: {
    color: "var(--muted-foreground)",
  },
  staples: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
  foot: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
});

interface DayPatternsSlideProps {
  patterns: DayPattern[];
}

// A Map rather than an object: `dayName` arrives as a plain string from the
// stats file, and a Map looks up an arbitrary key without a cast.
const DAY_EMOJIS = new Map([
  ["Monday", "📅"],
  ["Tuesday", "🌮"],
  ["Wednesday", "🐫"],
  ["Thursday", "🍕"],
  ["Friday", "🎉"],
  ["Saturday", "🌟"],
  ["Sunday", "☀️"],
]);

export function DayPatternsSlide({ patterns }: DayPatternsSlideProps) {
  return (
    <Slide>
      <div {...stylex.props(styles.stack)}>
        <h2 {...sxc("animate-slide-up", styles.heading)}>Day Signatures</h2>

        <p
          {...sxc("animate-slide-up delay-100", styles.sub)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          Dishes that stood out each day
        </p>

        <div {...stylex.props(styles.grid)}>
          {patterns.slice(0, 6).map((pattern, index) => (
            <div
              key={pattern.dayName}
              {...sxc("stat-card animate-slide-up", styles.card)}
              style={{
                opacity: 0,
                animationFillMode: "forwards",
                animationDelay: `${200 + index * 100}ms`,
              }}
            >
              <div {...stylex.props(styles.dayRow)}>
                <span {...stylex.props(styles.dayEmoji)}>
                  {DAY_EMOJIS.get(pattern.dayName) ?? "📆"}
                </span>
                <span {...stylex.props(styles.dayName)}>{pattern.dayName}</span>
              </div>
              <div {...stylex.props(styles.list)}>
                {pattern.signature.length > 0 ? (
                  pattern.signature.slice(0, 2).map((dish, i) => (
                    <div
                      key={dish}
                      {...sxc(
                        i === 0 ? "accent-rose" : undefined,
                        styles.dish,
                        i === 0 ? styles.medium : styles.mutedColor,
                      )}
                    >
                      {dish}
                    </div>
                  ))
                ) : (
                  <div {...stylex.props(styles.staples)}>Mostly staples</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <p
          {...sxc("animate-fade-in delay-800", styles.foot)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          Excluding daily staples like rice, roti, and curd
        </p>
      </div>
    </Slide>
  );
}

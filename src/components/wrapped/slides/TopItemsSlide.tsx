import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";
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
  // Was `space-y-4`
  list: {
    display: "flex",
    flexDirection: "column",
    rowGap: "1rem",
  },
  row: {
    display: "flex",
    alignItems: "center",
    columnGap: "1rem",
    rowGap: "1rem",
  },
  rank: {
    fontSize: "1.875rem",
    lineHeight: "calc(2.25 / 1.875)",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  mutedColor: {
    color: "var(--muted-foreground)",
  },
  grow: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    textAlign: "left",
  },
  // Was `border-2`; like the original layered utility, it loses to the
  // unlayered `.stat-card { border: 1px ... }` in wrapped.css.
  border2: {
    borderWidth: "2px",
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medium: {
    fontWeight: 500,
  },
  count: {
    fontFamily: "var(--font-mono)",
    color: "var(--muted-foreground)",
  },
  foot: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
});

interface TopItemsSlideProps {
  title: string;
  emoji: string;
  items: DishVariation[];
  mealType: "breakfast" | "dinner" | "overall";
}

export function TopItemsSlide({ title, emoji, items, mealType }: TopItemsSlideProps) {
  const accentClass = mealType === "breakfast" ? "accent-yellow" : "accent-rose";

  return (
    <Slide pattern="dots">
      <div {...stylex.props(styles.stack)}>
        <div {...sxc("animate-scale-in", styles.emoji)}>{emoji}</div>

        <h2
          {...sxc("animate-slide-up delay-100", styles.heading)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          {title}
        </h2>

        <div {...stylex.props(styles.list)}>
          {items.slice(0, 5).map((item, index) => (
            <div
              key={item.name}
              {...sxc("animate-slide-up", styles.row)}
              style={{
                opacity: 0,
                animationFillMode: "forwards",
                animationDelay: `${200 + index * 100}ms`,
              }}
            >
              <div
                {...sxc(
                  index === 0 ? accentClass : undefined,
                  styles.rank,
                  index !== 0 && styles.mutedColor,
                )}
              >
                {index + 1}
              </div>
              <div {...stylex.props(styles.grow)}>
                <div
                  {...sxc(
                    index === 0 ? "stat-card border-rose" : "stat-card",
                    index === 0 && styles.border2,
                  )}
                >
                  <div {...stylex.props(styles.cardRow)}>
                    <span {...sxc(index === 0 ? accentClass : undefined, styles.medium)}>
                      {item.name}
                    </span>
                    <span {...stylex.props(styles.count)}>{item.count}×</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items[0] && (
          <p
            {...sxc("animate-fade-in delay-800", styles.foot)}
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            You probably had <span {...sxc(accentClass, styles.medium)}>{items[0].name}</span> on
            most days!
          </p>
        )}
      </div>
    </Slide>
  );
}

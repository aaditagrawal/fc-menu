import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";
import { StatNumber } from "../StatNumber";
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
    fontSize: "3.75rem",
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
  sub: {
    color: "var(--muted-foreground)",
  },
  // Was `border-2 py-8`. Like the original layered Tailwind utilities, these
  // lose to the unlayered `.stat-card { border: 1px ...; padding: 1.5rem }`.
  mvpCard: {
    borderWidth: "2px",
    paddingBlock: "2rem",
  },
  mvpName: {
    fontSize: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    lineHeight: {
      default: "calc(2 / 1.5)",
      "@media (min-width: 640px)": "calc(2.25 / 1.875)",
    },
    fontWeight: 700,
    marginBottom: "1rem",
  },
  row: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    columnGap: "0.5rem",
    rowGap: "0.5rem",
  },
  statSize: {
    fontSize: "2.25rem",
    lineHeight: "calc(2.5 / 2.25)",
  },
  appearances: {
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
    color: "var(--muted-foreground)",
  },
  foot: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
});

interface StapleAlertSlideProps {
  mostRepeated: DishVariation;
}

export function StapleAlertSlide({ mostRepeated }: StapleAlertSlideProps) {
  return (
    <Slide pattern="dots">
      <div {...stylex.props(styles.stack)}>
        <div {...sxc("animate-scale-in", styles.emoji)}>🍚</div>

        <h2
          {...sxc("animate-slide-up delay-100", styles.heading)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          The Real MVP
        </h2>

        <p
          {...sxc("animate-slide-up delay-200", styles.sub)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          Every hero needs a sidekick...
          <br />
          or in this case, a main character
        </p>

        <div
          {...sxc("stat-card border-rose animate-scale-in delay-300", styles.mvpCard)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p {...sxc("accent-rose", styles.mvpName)}>{mostRepeated.name}</p>
          <div {...stylex.props(styles.row)}>
            <StatNumber value={mostRepeated.count} style={styles.statSize} />
            <span {...stylex.props(styles.appearances)}>appearances</span>
          </div>
        </div>

        <p
          {...sxc("animate-fade-in delay-600", styles.foot)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          The unsung hero of every meal 🫡
        </p>
      </div>
    </Slide>
  );
}

import { ChevronDown } from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";

const styles = stylex.create({
  relative: {
    position: "relative",
  },
  // Was `text-center space-y-6`
  stack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "1.5rem",
    textAlign: "center",
  },
  titleMain: {
    fontSize: {
      default: "3rem",
      "@media (min-width: 640px)": "4.5rem",
    },
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: "-0.025em",
  },
  titleSub: {
    fontSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "3.75rem",
    },
    lineHeight: {
      default: "calc(2.5 / 2.25)",
      "@media (min-width: 640px)": "1",
    },
    fontWeight: 700,
    letterSpacing: "-0.025em",
  },
  year: {
    fontSize: {
      default: "1.5rem",
      "@media (min-width: 640px)": "1.875rem",
    },
    lineHeight: {
      default: "calc(2 / 1.5)",
      "@media (min-width: 640px)": "calc(2.25 / 1.875)",
    },
    fontFamily: "var(--font-mono)",
  },
  blurb: {
    color: "var(--muted-foreground)",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "1.125rem",
    },
    lineHeight: {
      default: "1.5",
      "@media (min-width: 640px)": "calc(1.75 / 1.125)",
    },
    maxWidth: "28rem",
    marginInline: "auto",
    // Was `mt-8` inside `space-y-6`: block margins collapsed to 2rem total;
    // with flex rowGap 1.5rem, 0.5rem of margin reproduces the same 2rem gap.
    marginTop: "0.5rem",
  },
  fineprint: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
    maxWidth: "24rem",
    marginInline: "auto",
  },
  dim: {
    opacity: 0.7,
  },
  hintText: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  hintIcon: {
    width: "1.25rem",
    height: "1.25rem",
  },
});

interface IntroSlideProps {
  dateRange: { start: string; end: string };
}

export function IntroSlide({ dateRange }: IntroSlideProps) {
  const year = dateRange.end.split("-")[0] || "2025";

  return (
    <Slide style={styles.relative}>
      <div {...sxc("animate-scale-in", styles.stack)}>
        <div {...stylex.props(styles.titleMain)}>
          <span className="accent-rose">FC2</span> Menu
        </div>
        <div {...stylex.props(styles.titleSub)}>Wrapped</div>
        <div {...sxc("accent-yellow", styles.year)}>{year}</div>
        <p
          {...sxc("animate-fade-in delay-300", styles.blurb)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          A look back at what Food Court 2 served this semester
        </p>
        <p
          {...sxc("animate-fade-in delay-500", styles.fineprint)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          Data from mid-August to December 2025
          <br />
          <span {...stylex.props(styles.dim)}>Since the launch of fc2.coolstuff.work</span>
        </p>
      </div>

      <div className="scroll-hint">
        <span {...stylex.props(styles.hintText)}>Scroll to explore</span>
        <ChevronDown {...stylex.props(styles.hintIcon)} />
      </div>
    </Slide>
  );
}

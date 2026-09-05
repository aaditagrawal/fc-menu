import Link from "next/link";
import { MoveLeft, Code2 } from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import { easing } from "@/lib/tokens.stylex";
import { sxc } from "@/lib/utils";
import { Slide } from "../Slide";

const TRANSITION_COLORS =
  "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke";

const styles = stylex.create({
  // Was `text-center space-y-12 max-w-xl mx-auto w-full px-4`
  stack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "3rem",
    textAlign: "center",
    maxWidth: "36rem",
    marginInline: "auto",
    width: "100%",
    paddingInline: "1rem",
  },
  emoji: {
    fontSize: "3rem",
    lineHeight: 1,
  },
  // Was `space-y-4`
  headingStack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "1rem",
  },
  heading: {
    fontSize: {
      default: "1.875rem",
      "@media (min-width: 640px)": "2.25rem",
    },
    lineHeight: {
      default: "calc(2.25 / 1.875)",
      "@media (min-width: 640px)": "calc(2.5 / 2.25)",
    },
    fontWeight: 700,
  },
  factBlock: {
    paddingBlock: "2rem",
  },
  fact: {
    fontSize: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1.5rem",
    },
    lineHeight: 1.625,
    fontWeight: 500,
    maxWidth: "28rem",
    marginInline: "auto",
  },
  bold: {
    fontWeight: 700,
  },
  mutedColor: {
    color: "var(--muted-foreground)",
  },
  // Was `pt-8 space-y-3 max-w-xs mx-auto`
  linkStack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.75rem",
    paddingTop: "2rem",
    maxWidth: "20rem",
    marginInline: "auto",
  },
  link: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: "0.5rem",
    rowGap: "0.5rem",
    width: "100%",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 500,
    transitionProperty: TRANSITION_COLORS,
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
    // Replaces `group` + `group-hover:-translate-x-1` on the icon.
    "--wrapped-back-shift": {
      default: "0rem",
      ":hover": {
        default: null,
        "@media (hover: hover)": "-0.25rem",
      },
    },
  },
  backIcon: {
    width: "1rem",
    height: "1rem",
    transitionProperty: "transform, translate, scale, rotate",
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
    translate: "var(--wrapped-back-shift) 0",
  },
  blogLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: "0.5rem",
    rowGap: "0.5rem",
    width: "100%",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: {
      default: "var(--muted-foreground)",
      // Plain `hover:` utilities were NOT media-gated in the baseline build
      // (only `group-hover:` was), so this stays an ungated :hover.
      ":hover": "var(--foreground)",
    },
    transitionProperty: TRANSITION_COLORS,
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
    // Replaces `group` + `group-hover:border-foreground/20` on the underline.
    "--wrapped-underline": {
      default: "transparent",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 20%, transparent)",
      },
    },
  },
  blogIcon: {
    width: "1rem",
    height: "1rem",
  },
  underline: {
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "var(--wrapped-underline)",
    transitionProperty: TRANSITION_COLORS,
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
  },
});

export function SummarySlide() {
  return (
    <Slide pattern="dots">
      <div {...stylex.props(styles.stack)}>
        <div {...sxc("animate-scale-in", styles.emoji)}>✨</div>

        <div {...stylex.props(styles.headingStack)}>
          <h2
            {...sxc("animate-slide-up delay-100", styles.heading)}
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            That&apos;s a Wrap!
          </h2>
        </div>

        <div
          {...sxc("animate-slide-up delay-300", styles.factBlock)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p {...stylex.props(styles.fact)}>
            Around <span {...sxc("accent-rose", styles.bold)}>4,000</span> people eat at
            <br />
            The Indian Kitchen every meal.
            <br />
            <br />
            <span {...stylex.props(styles.mutedColor)}>That&apos;s a lot of food! 🍛</span>
          </p>
        </div>

        <div
          {...sxc("animate-fade-in delay-500", styles.linkStack)}
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <Link href="/" {...stylex.props(styles.link)}>
            <MoveLeft {...stylex.props(styles.backIcon)} />
            Back to Home
          </Link>

          <a
            href="https://blog.aadit.cc/posts/building-a-food-court-menu/"
            target="_blank"
            rel="noopener noreferrer"
            {...stylex.props(styles.blogLink)}
          >
            <Code2 {...stylex.props(styles.blogIcon)} />
            <span {...stylex.props(styles.underline)}>How was the FC2 menu website made</span>
          </a>
        </div>
      </div>
    </Slide>
  );
}

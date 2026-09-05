"use client";

import * as stylex from "@stylexjs/stylex";
import { Salad } from "lucide-react";

const styles = stylex.create({
  section: {
    borderRadius: "calc(var(--radius) + 4px)",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, oklch(76.9% 0.188 70.08) 35%, transparent)",
    backgroundColor: "color-mix(in oklab, oklch(76.9% 0.188 70.08) 10%, transparent)",
    paddingInline: { default: "1rem", "@media (min-width: 640px)": "1.25rem" },
    paddingBlock: "0.75rem",
  },
  row: {
    display: "flex",
    alignItems: "flex-start",
    columnGap: "0.75rem",
  },
  icon: {
    marginTop: "0.125rem",
    height: "1.25rem",
    width: "1.25rem",
    flexShrink: 0,
    color: "var(--warn-accent)",
  },
  text: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    fontSize: "0.875rem",
    lineHeight: 1.625,
    color: "var(--muted-foreground)",
  },
  emphasis: {
    fontWeight: 500,
    color: "var(--foreground)",
  },
  link: {
    fontWeight: 500,
    color: {
      default: "var(--foreground)",
      ":hover": "var(--warn-accent)",
    },
    textDecorationLine: "underline",
    textUnderlineOffset: "2px",
  },
});

/**
 * Jain menus aren't uploaded every week. When one is missing the API answers
 * 200 with an empty menu, so the app shows the regular menu instead of a dead
 * end — this explains why the Jain toggle is on but the food isn't Jain.
 */
export function JainFallbackNotice({ onShowRegular }: { onShowRegular?: () => void }) {
  return (
    <section
      aria-live="polite"
      aria-label="Jain menu availability"
      {...stylex.props(styles.section)}
    >
      <div {...stylex.props(styles.row)}>
        <Salad {...stylex.props(styles.icon)} aria-hidden />
        <p {...stylex.props(styles.text)}>
          <span {...stylex.props(styles.emphasis)}>No Jain menu for this week yet.</span> Showing
          the regular menu with non-veg items hidden — it is not a Jain menu, so check before you
          eat.
          {onShowRegular && (
            <>
              {" "}
              <button type="button" onClick={onShowRegular} {...stylex.props(styles.link)}>
                Turn off the Jain filter
              </button>
              .
            </>
          )}
        </p>
      </div>
    </section>
  );
}

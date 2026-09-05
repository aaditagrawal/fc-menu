"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { CalendarClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const styles = stylex.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 4px)",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, oklch(76.9% 0.188 70.08) 35%, transparent)",
    backgroundImage:
      "linear-gradient(to bottom right in oklab, color-mix(in oklab, oklch(76.9% 0.188 70.08) 12%, transparent) 0%, var(--background) 50%, color-mix(in oklab, oklch(70.5% 0.213 47.604) 10%, transparent) 100%)",
    paddingInline: { default: "1rem", "@media (min-width: 640px)": "1.25rem" },
    paddingBlock: "1rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  glow: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse 80% 80% at 0% -20%,rgba(245,158,11,0.18),transparent)",
  },
  row: {
    position: "relative",
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
    display: "flex",
    flexDirection: "column",
    rowGap: "0.25rem",
  },
  heading: {
    fontSize: "0.875rem",
    fontWeight: 600,
    lineHeight: 1.375,
    color: "var(--foreground)",
  },
  desc: {
    fontSize: "0.875rem",
    lineHeight: 1.625,
    color: "var(--muted-foreground)",
  },
  weekLabel: {
    fontWeight: 500,
    color: "var(--foreground)",
  },
  dismiss: {
    height: "2rem",
    width: "2rem",
    flexShrink: 0,
    color: {
      default: "var(--muted-foreground)",
      ":hover": "var(--foreground)",
    },
  },
  dismissIcon: {
    height: "1rem",
    width: "1rem",
  },
});

export function StaleWeekNotice({ weekLabel }: { weekLabel: string }) {
  const [open, setOpen] = React.useState(true);
  const close = React.useCallback(() => setOpen(false), []);

  if (!open) {
    return null;
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-labelledby="stale-week-notice-heading"
      aria-describedby="stale-week-notice-desc"
      {...stylex.props(styles.container)}
    >
      <div {...stylex.props(styles.glow)} />
      <div {...stylex.props(styles.row)}>
        <CalendarClock {...stylex.props(styles.icon)} aria-hidden />
        <div {...stylex.props(styles.text)}>
          <h2 id="stale-week-notice-heading" {...stylex.props(styles.heading)}>
            This week&apos;s menu isn&apos;t posted yet
          </h2>
          <p id="stale-week-notice-desc" {...stylex.props(styles.desc)}>
            You&apos;re seeing <span {...stylex.props(styles.weekLabel)}>{weekLabel}</span>, the
            newest week that was uploaded. When this week&apos;s roster is published, it will show
            up here; use Refresh Data below if it has just gone live.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          style={styles.dismiss}
          onClick={close}
          aria-label="Dismiss notice"
        >
          <X {...stylex.props(styles.dismissIcon)} />
        </Button>
      </div>
    </div>
  );
}

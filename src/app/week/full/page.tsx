"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import * as stylex from "@stylexjs/stylex";

import { FullWeekView } from "@/components/FullWeekView";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  page: {
    paddingInline: {
      default: "1rem",
      "@media (min-width: 640px)": "1.5rem",
      "@media (min-width: 768px)": "2rem",
    },
    paddingBlock: "2rem",
  },
  inner: {
    marginInline: "auto",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    rowGap: "1.5rem",
  },
  banner: {
    borderRadius: "var(--radius)",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--muted) 30%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  bannerRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: "0.5rem",
    columnGap: "0.5rem",
  },
  bannerText: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: "0.25rem",
    columnGap: "0.25rem",
  },
  bannerTitle: {
    fontWeight: 600,
    color: "var(--foreground)",
  },
  bannerButton: {
    height: "1.75rem",
    paddingInline: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "3rem",
    rowGap: "1rem",
  },
  emptyStateText: {
    color: "var(--muted-foreground)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "3rem",
  },
  spinner: {
    height: "2rem",
    width: "2rem",
    animationName: spin,
    animationDuration: "1s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    color: "var(--muted-foreground)",
  },
});

function FullWeekContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div {...stylex.props(styles.emptyState)}>
        <div {...stylex.props(styles.emptyStateText)}>No week specified</div>
        <Button asChild variant="outline">
          <Link href="/">Go to Current Menu</Link>
        </Button>
      </div>
    );
  }

  return <FullWeekView weekId={id} />;
}

export default function FullWeekPage() {
  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.inner)}>
        <div {...stylex.props(styles.banner)}>
          <div {...stylex.props(styles.bannerRow)}>
            <div {...stylex.props(styles.bannerText)}>
              <span {...stylex.props(styles.bannerTitle)}>Full week view.</span>
              <span>Want today&apos;s view instead?</span>
            </div>
            <Button asChild variant="outline" style={styles.bannerButton}>
              <Link href="/" title="Go to current menu">
                Current Menu
              </Link>
            </Button>
          </div>
        </div>
        <Suspense
          fallback={
            <div {...stylex.props(styles.loading)}>
              <Loader2 {...stylex.props(styles.spinner)} />
            </div>
          }
        >
          <FullWeekContent />
        </Suspense>
      </div>
    </div>
  );
}

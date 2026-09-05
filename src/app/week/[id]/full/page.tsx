import Link from "next/link";
import * as stylex from "@stylexjs/stylex";

import { FullWeekView } from "@/components/FullWeekView";
import type { WeekId } from "@/components/MenuViewer";
import { Button } from "@/components/ui/button";

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
});

interface PageProps {
  params: Promise<{ id: WeekId }>;
}

export async function generateStaticParams() {
  const { getAllWeeks } = await import("@/data/weeks");
  const weeks = await getAllWeeks();
  return weeks.map((id) => ({ id }));
}

export default async function FullWeekPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.inner)}>
        <div {...stylex.props(styles.banner)}>
          <div {...stylex.props(styles.bannerRow)}>
            <div {...stylex.props(styles.bannerText)}>
              <span {...stylex.props(styles.bannerTitle)}>You&apos;re on a week page.</span>
              <span>Want today&apos;s view instead?</span>
            </div>
            <Button asChild variant="outline" style={styles.bannerButton}>
              <Link href="/" title="Go to current menu">
                Current Menu
              </Link>
            </Button>
          </div>
        </div>
        <FullWeekView weekId={id} />
      </div>
    </div>
  );
}

import Link from "next/link";
import * as stylex from "@stylexjs/stylex";

import { getAllWeeks } from "@/data/weeks";
import { Button } from "@/components/ui/button";
import { Grid3X3, Calendar } from "lucide-react";

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
    maxWidth: "48rem",
    display: "flex",
    flexDirection: "column",
    rowGap: "1.5rem",
  },
  heading: {
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
    fontWeight: 600,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.75rem",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: "0.75rem",
    paddingBlock: "0.75rem",
    borderRadius: "var(--radius)",
    borderWidth: "1px",
  },
  weekLink: {
    textDecorationLine: "underline",
    fontWeight: 500,
  },
  actions: {
    display: "flex",
    columnGap: "0.5rem",
    rowGap: "0.5rem",
  },
  icon: {
    height: "0.75rem",
    width: "0.75rem",
    marginRight: "0.25rem",
  },
});

export default async function WeeksPage() {
  const weeks = await getAllWeeks();
  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.inner)}>
        <h1 {...stylex.props(styles.heading)}>Past & Upcoming Weeks</h1>
        <ul {...stylex.props(styles.list)}>
          {weeks.map((id) => (
            <li key={id} {...stylex.props(styles.listItem)}>
              <div>
                <Link href={`/week/${id}`} {...stylex.props(styles.weekLink)}>
                  {id}
                </Link>
              </div>
              <div {...stylex.props(styles.actions)}>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/week/${id}`} title="View daily menu">
                    <Calendar {...stylex.props(styles.icon)} />
                    Daily
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/week/full?id=${id}`} title="View full week menu">
                    <Grid3X3 {...stylex.props(styles.icon)} />
                    Full
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

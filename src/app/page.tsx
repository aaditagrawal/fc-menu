import { preload } from "react-dom";
import * as stylex from "@stylexjs/stylex";

import { MenuViewer } from "@/components/MenuViewer";
import { getEffectiveWeekMenu } from "@/data/weeks";
import { sxc } from "@/lib/utils";
import { STATIC_MENU_MANIFEST_PATH } from "@/lib/staticMenuBundle";

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
    maxWidth: "56rem",
    display: "flex",
    flexDirection: "column",
    rowGap: "1.5rem",
  },
});

export const metadata = {
  title: {
    default: "Food Court Menus - The Indian Kitchen",
    template: "%s - The Indian Kitchen",
  },
  description: "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  preload(STATIC_MENU_MANIFEST_PATH, { as: "fetch", crossOrigin: "anonymous" });
  const initialWeek = await getEffectiveWeekMenu();

  return (
    <div {...sxc("scroll-optimized", styles.page)}>
      <div {...stylex.props(styles.inner)}>
        <MenuViewer initialWeekId={null} initialWeek={initialWeek} />
      </div>
    </div>
  );
}

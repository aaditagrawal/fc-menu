import { MenuViewer } from "@/components/MenuViewer";
import { getEffectiveWeekMenu } from "@/data/weeks";

export const metadata = {
  title: {
    default: "Food Court Menus - The Indian Kitchen",
    template: "%s - The Indian Kitchen",
  },
  description:
    "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const initialWeek = await getEffectiveWeekMenu();

  return (
    <div className="px-4 py-8 sm:px-6 md:px-8 scroll-optimized">
      <link
        rel="preload"
        href="/data/menu-bundle/manifest.json"
        as="fetch"
        crossOrigin="anonymous"
      />
      <div className="mx-auto max-w-4xl space-y-6">
        <MenuViewer initialWeekId={null} initialWeek={initialWeek} />
      </div>
    </div>
  );
}

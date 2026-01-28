import { MenuViewer } from "@/components/MenuViewer";

export const metadata = {
  title: {
    default: "Food Court Menus — The Indian Kitchen",
    template: "%s — The Indian Kitchen",
  },
  description:
    "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
};

// Enable ISR with 10 minute revalidation to reduce edge requests
export const revalidate = 600; // 10 minutes

export default function Home() {
  return (
    <div className="px-4 py-8 sm:px-6 md:px-8 scroll-optimized">
      <div className="mx-auto max-w-4xl space-y-6">
        <MenuViewer initialWeekId={null} />
      </div>
    </div>
  );
}

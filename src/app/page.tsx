import { MenuViewer } from "@/components/MenuViewer";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: {
    default: "Food Court Menus — The Indian Kitchen",
    template: "%s — The Indian Kitchen",
  },
  description:
    "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
};

export default function Home() {
  return (
    <div className="px-4 py-8 sm:px-6 md:px-8 scroll-optimized">
      <div className="mx-auto max-w-4xl space-y-6">
        <div
          className="group rounded-xl p-[2px] transition-all hover:shadow-lg hover:shadow-amber-500/10"
          style={{
            background: "linear-gradient(90deg, #f59e0b, #ea580c, #f59e0b)",
          }}
        >
          <Link
            href="/wrapped"
            className="block rounded-[10px] bg-background px-4 py-[7px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">FC2 Menu Wrapped</h2>
              </div>
              <span className="text-sm font-medium text-amber-500 group-hover:text-orange-500 transition-colors">
                View →
              </span>
            </div>
          </Link>
        </div>

        <MenuViewer initialWeekId={null} />
      </div>
    </div>
  );
}

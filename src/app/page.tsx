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
            className="block rounded-[10px] bg-background px-6 py-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">FC2 Menu Wrapped</h2>
                  <p className="text-sm text-muted-foreground">Aug - Dec 2025</p>
                </div>
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

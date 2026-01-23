import { MenuViewer } from "@/components/MenuViewer";
import { CalendarPlus } from "lucide-react";

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

// Google Calendar event URL for Food Carnival
const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("The Indian Kitchen Food Carnival 4.0")}&dates=20250128T113000Z/20250128T163000Z&details=${encodeURIComponent("Join us for The Indian Kitchen Food Carnival 4.0!")}&location=${encodeURIComponent("Amphitheatre, MIT FC2")}`;

export default function Home() {
  return (
    <div className="px-4 py-8 sm:px-6 md:px-8 scroll-optimized">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Event Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-neutral-400 to-neutral-600 p-[3px]">
          <div className="rounded-[14px] bg-card px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-foreground">
                  The Indian Kitchen Food Carnival 4.0
                </h2>
                <p className="text-sm text-muted-foreground">
                  Jan 28 &bull; 5 PM to 10 PM &bull; Amphitheatre, MIT FC2
                </p>
              </div>
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <CalendarPlus className="h-3 w-3" />
                Add to Calendar
              </a>
            </div>
          </div>
        </div>

        <MenuViewer initialWeekId={null} />
      </div>
    </div>
  );
}

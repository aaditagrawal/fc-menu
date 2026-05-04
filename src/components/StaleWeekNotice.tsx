"use client";

import * as React from "react";
import { CalendarClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className="relative overflow-hidden rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 via-background to-orange-500/10 px-4 py-4 shadow-sm sm:px-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_-20%,rgba(245,158,11,0.18),transparent)]" />
      <div className="relative flex items-start gap-3">
        <CalendarClock
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            id="stale-week-notice-heading"
            className="text-sm font-semibold leading-snug text-foreground"
          >
            This week&apos;s menu isn&apos;t posted yet
          </h2>
          <p
            id="stale-week-notice-desc"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            You&apos;re seeing{" "}
            <span className="font-medium text-foreground">{weekLabel}</span>,
            the newest week that was uploaded. When this week&apos;s roster is
            published, it will show up here; use Refresh Data below if it has
            just gone live.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={close}
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

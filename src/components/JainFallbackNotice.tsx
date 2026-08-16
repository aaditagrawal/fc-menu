"use client";

import { Salad } from "lucide-react";

/**
 * Jain menus aren't uploaded every week. When one is missing the API answers
 * 200 with an empty menu, so the app shows the regular menu instead of a dead
 * end — this explains why the Jain toggle is on but the food isn't Jain.
 */
export function JainFallbackNotice({ onShowRegular }: { onShowRegular?: () => void }) {
  return (
    <section
      aria-live="polite"
      aria-label="Jain menu availability"
      className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 sm:px-5"
    >
      <div className="flex items-start gap-3">
        <Salad
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            No Jain menu for this week yet.
          </span>{" "}
          Showing the regular menu with non-veg items hidden — it is not a Jain
          menu, so check before you eat.
          {onShowRegular && (
            <>
              {" "}
              <button
                type="button"
                onClick={onShowRegular}
                className="font-medium text-foreground underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-400"
              >
                Turn off the Jain filter
              </button>
              .
            </>
          )}
        </p>
      </div>
    </section>
  );
}

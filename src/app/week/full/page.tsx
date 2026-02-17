"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FullWeekView } from "@/components/FullWeekView";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function FullWeekContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-muted-foreground text-sm">No week specified</div>
        <Button asChild variant="outline">
          <Link href="/">Go to Current Menu</Link>
        </Button>
      </div>
    );
  }

  return <FullWeekView weekId={id} />;
}

export default function FullWeekPage() {
  return (
    <div className="px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-full space-y-6">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-semibold text-foreground">Full week view.</span>
              <span>Want today&apos;s view instead?</span>
            </div>
            <Button asChild variant="outline" className="h-7 px-2 text-xs">
              <Link href="/" title="Go to current menu">
                Current Menu
              </Link>
            </Button>
          </div>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
          <FullWeekContent />
        </Suspense>
      </div>
    </div>
  );
}

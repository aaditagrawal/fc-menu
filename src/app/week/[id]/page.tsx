import Link from "next/link";

import { MenuViewer, type WeekId } from "@/components/MenuViewer";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: WeekId }>;
}

export async function generateStaticParams() {
  return [];
}

export default async function WeekPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-semibold text-foreground">You&apos;re on a week page.</span>
              <span>Want today&apos;s view instead?</span>
            </div>
            <Button asChild variant="outline" className="h-7 px-2 text-xs">
              <Link href="/" title="Go to current menu">
                Current Menu
              </Link>
            </Button>
          </div>
        </div>
        <MenuViewer initialWeekId={id} />
      </div>
    </div>
  );
}

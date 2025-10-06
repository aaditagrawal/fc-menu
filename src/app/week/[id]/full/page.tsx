import Link from "next/link";
import { getWeekMenu } from "@/data/weeks";
import { ComprehensiveWeekView } from "@/components/ComprehensiveWeekView";
import type { WeekId } from "@/data/weeks/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: WeekId }>;
}

// Regenerate full week pages every 10 minutes in background
export const revalidate = 600; // 10 minutes - allows faster updates when new data is published

export default async function FullWeekPage({ params }: PageProps) {
  const { id } = await params;
  const week = await getWeekMenu(id);

  return (
    <div className="px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-full space-y-6">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Full Week Menu</h1>
              <p className="text-muted-foreground">{week.week} • {week.foodCourt}</p>
            </div>
            <Button asChild variant="outline" className="self-start sm:self-auto">
              <Link href={`/week/${id}`} title="Back to daily view">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Daily View
              </Link>
            </Button>
          </div>
        </div>
        <ComprehensiveWeekView week={week} />
      </div>
    </div>
  );
}

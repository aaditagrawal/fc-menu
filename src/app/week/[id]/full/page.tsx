import { FullWeekView } from "@/components/FullWeekView";
import type { WeekId } from "@/components/MenuViewer";

interface PageProps {
  params: Promise<{ id: WeekId }>;
}

export async function generateStaticParams() {
  return [];
}

export default async function FullWeekPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-full space-y-6">
        <FullWeekView weekId={id} />
      </div>
    </div>
  );
}

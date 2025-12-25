import { MenuViewer, type WeekId } from "@/components/MenuViewer";

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
        <MenuViewer initialWeekId={id} />
      </div>
    </div>
  );
}

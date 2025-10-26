import { getLatestWeekId, getWeekMenu } from "@/data/weeks";
import { MenuViewer } from "@/components/MenuViewer";

// Regenerate page every 7 days in the background (ISR)
export const revalidate = 600; // 10 minutes - allows faster updates when new data is published

export default async function Home() {
  const weekId = await getLatestWeekId();
  const week = await getWeekMenu(weekId);
  return (
    <div className="px-4 py-8 sm:px-6 md:px-8 scroll-optimized">
      <div className="mx-auto max-w-4xl space-y-6">
        <MenuViewer initialWeekId={weekId} initialWeek={week} routingMode="home" />
      </div>
    </div>
  );
}

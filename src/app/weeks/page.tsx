import Link from "next/link";
import { getAllWeeks } from "@/data/weeks";
import { Button } from "@/components/ui/button";
import { Grid3X3, Calendar } from "lucide-react";

export default async function WeeksPage() {
  const weeks = await getAllWeeks();
  return (
    <div className="px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Past & Upcoming Weeks</h1>
        <ul className="space-y-3">
          {weeks.map((id) => (
            <li key={id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Link href={`/week/${id}`} className="underline font-medium">{id}</Link>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/week/${id}`} title="View daily menu">
                    <Calendar className="h-3 w-3 mr-1" />
                    Daily
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/week/${id}/full`} title="View full week menu">
                    <Grid3X3 className="h-3 w-3 mr-1" />
                    Full
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}



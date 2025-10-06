import { NextResponse } from "next/server";
import { getAllWeeks, getWeeksMeta } from "@/data/weeks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const forceFresh = url.searchParams.get('fresh') === 'true';
  
  const weekIds = await getAllWeeks();
  const meta = await getWeeksMeta();

  // Add cache headers for client-side caching
  const response = NextResponse.json({ weekIds, meta });
  
  if (forceFresh) {
    // No cache when fresh data is requested
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else {
    // Reduced cache: 10 minutes to ensure new weekly data appears faster
    response.headers.set('Cache-Control', 'public, s-maxage=600, max-age=300');
    response.headers.set('CDN-Cache-Control', 'max-age=600');
  }

  return response;
}



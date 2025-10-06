import { NextResponse } from "next/server";
import { getAllWeeks, getWeekMenu } from "@/data/weeks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const id = decodeURIComponent(segments[segments.length - 1] || "");
  const forceFresh = url.searchParams.get('fresh') === 'true';
  
  const all = await getAllWeeks();
  if (!all.includes(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const menu = await getWeekMenu(id);

    // Add cache headers for client-side caching
    const response = NextResponse.json(menu);
    
    if (forceFresh) {
      // No cache when fresh data is requested
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else {
      // Reduced cache: 10 minutes to ensure new weekly data appears faster
      response.headers.set('Cache-Control', 'public, s-maxage=600, max-age=300');
      response.headers.set('CDN-Cache-Control', 'max-age=600');
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}



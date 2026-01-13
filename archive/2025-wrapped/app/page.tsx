import { WrappedClient } from "./WrappedClient";
import wrappedStats from "./stats.json";
import type { WrappedStats } from "@/lib/wrapped/types";

export const metadata = {
    title: "FC2 Menu Wrapped",
    description: "A look back at what Food Court 2 served this semester - Spotify Wrapped style!",
};

export default function WrappedPage() {
    // Use pre-generated static stats with weak casting to avoid strict type checking on the details
    const stats = wrappedStats as unknown as WrappedStats;

    return <WrappedClient stats={stats} />;
}

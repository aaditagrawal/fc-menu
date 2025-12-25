"use client";

import { useOfflineStatus } from "@/hooks/useMenuData";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const isOffline = useOfflineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowBackOnline(true);
    } else if (showBackOnline && !isOffline) {
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, showBackOnline]);

  if (!isOffline && !showBackOnline) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
        isOffline ? "bg-amber-500 text-white" : "bg-green-500 text-white"
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline. Showing cached data.</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online! Data synced.</span>
        </>
      )}
    </div>
  );
}

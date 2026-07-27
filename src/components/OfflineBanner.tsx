"use client";

import { useOfflineStatus } from "@/hooks/useMenuData";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useOfflineBannerVisibility(isOffline: boolean) {
  const wasOffline = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      setVisible(true);
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  return visible;
}

export function OfflineBanner() {
  const isOffline = useOfflineStatus();
  const visible = useOfflineBannerVisibility(isOffline);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-[transform,opacity] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100 duration-300"
          : "translate-y-[calc(100%+1.5rem)] opacity-0 duration-200 pointer-events-none"
      } ${isOffline ? "bg-amber-500 text-white" : "bg-green-500 text-white"}`}
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

"use client";

import { useOfflineStatus } from "@/hooks/useMenuData";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";

export function OfflineBanner() {
  const isOffline = useOfflineStatus();
  const wasOffline = useRef(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hideBanner = useCallback(() => {
    if (bannerRef.current) {
      bannerRef.current.hidden = true;
    }
  }, []);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      if (bannerRef.current) {
        bannerRef.current.hidden = false;
      }
      clearTimeout(timerRef.current);
    } else if (wasOffline.current) {
      wasOffline.current = false;
      if (bannerRef.current) {
        bannerRef.current.hidden = false;
      }
      timerRef.current = setTimeout(hideBanner, 3000);
      return () => clearTimeout(timerRef.current);
    }
  }, [isOffline, hideBanner]);

  return (
    <div
      ref={bannerRef}
      hidden
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

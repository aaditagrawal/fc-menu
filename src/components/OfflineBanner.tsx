"use client";

import * as stylex from "@stylexjs/stylex";
import { useOfflineStatus } from "@/hooks/useMenuData";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { easing } from "@/lib/tokens.stylex";

const styles = stylex.create({
  banner: {
    position: "fixed",
    bottom: "1rem",
    left: "1rem",
    right: "1rem",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: "0.5rem",
    rowGap: "0.5rem",
    borderRadius: "var(--radius)",
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 500,
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    // Matches the old Tailwind `transition-[transform,opacity]`: the `translate`
    // property is intentionally NOT in the list, so the slide position snaps
    // while only the opacity animates.
    transitionProperty: {
      default: "transform, opacity",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: easing.spring,
  },
  visible: {
    translate: "0px 0px",
    opacity: 1,
    transitionDuration: "300ms",
  },
  hidden: {
    translate: "0px calc(100% + 1.5rem)",
    opacity: 0,
    transitionDuration: "200ms",
    pointerEvents: "none",
  },
  offline: {
    backgroundColor: "oklch(76.9% 0.188 70.08)",
    color: "#fff",
  },
  online: {
    backgroundColor: "oklch(72.3% 0.219 149.579)",
    color: "#fff",
  },
  icon: {
    height: "1rem",
    width: "1rem",
  },
});

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
      {...stylex.props(
        styles.banner,
        visible ? styles.visible : styles.hidden,
        isOffline ? styles.offline : styles.online,
      )}
    >
      {isOffline ? (
        <>
          <WifiOff {...stylex.props(styles.icon)} />
          <span>You&apos;re offline. Showing cached data.</span>
        </>
      ) : (
        <>
          <Wifi {...stylex.props(styles.icon)} />
          <span>Back online! Data synced.</span>
        </>
      )}
    </div>
  );
}

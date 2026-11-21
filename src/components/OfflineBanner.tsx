"use client";

import * as stylex from "@stylexjs/stylex";
import { useOfflineStatus } from "@/hooks/useMenuData";
import { WifiOff, Wifi } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
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

function createOfflineBannerStore() {
  let visible = false;
  let wasOffline = false;
  let hideAt = 0;
  return {
    getSnapshot: () => visible,
    getServerSnapshot: () => false,
    subscribe(onChange: () => void) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const update = () => {
        clearTimeout(timer);
        if (!navigator.onLine) {
          wasOffline = true;
          hideAt = 0;
          visible = true;
        } else {
          if (wasOffline) {
            wasOffline = false;
            hideAt = Date.now() + 3000;
          }
          visible = hideAt > Date.now();
          if (visible) {
            timer = setTimeout(() => {
              visible = false;
              onChange();
            }, hideAt - Date.now());
          }
        }
        onChange();
      };
      window.addEventListener("online", update);
      window.addEventListener("offline", update);
      update();
      return () => {
        clearTimeout(timer);
        window.removeEventListener("online", update);
        window.removeEventListener("offline", update);
      };
    },
  };
}

function useOfflineBannerVisibility() {
  const [store] = useState(createOfflineBannerStore);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function OfflineBanner() {
  const isOffline = useOfflineStatus();
  const visible = useOfflineBannerVisibility();

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

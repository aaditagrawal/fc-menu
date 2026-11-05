"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import * as stylex from "@stylexjs/stylex";
import { CircleCheck, CircleX, X } from "lucide-react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { notificationStore, type Notification } from "@/lib/notifications";

const styles = stylex.create({
  region: {
    position: "fixed",
    top: { default: "24px", "@media (max-width: 600px)": "16px" },
    insetInlineStart: "50%",
    transform: "translateX(-50%)",
    width: { default: "356px", "@media (max-width: 600px)": "calc(100vw - 32px)" },
    zIndex: 999999999,
    pointerEvents: "none",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    outlineStyle: { default: "none", ":focus": "solid" },
    outlineWidth: "2px",
    outlineOffset: "4px",
    outlineColor: "var(--ring)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    margin: 0,
    padding: 0,
    listStyleType: "none",
  },
  toast: {
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "16px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    fontSize: "13px",
    fontWeight: 500,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
    touchAction: "pan-x",
  },
  icon: { width: "16px", height: "16px", flexShrink: 0 },
  message: { flexGrow: 1 },
  dismiss: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    color: "inherit",
    backgroundColor: { default: "transparent", ":hover": "var(--accent)" },
    outlineOffset: "2px",
  },
});

const emptyNotifications: readonly Notification[] = [];
const getServerSnapshot = () => emptyNotifications;

export function Toaster() {
  const notifications = useSyncExternalStore(
    notificationStore.subscribe,
    notificationStore.getSnapshot,
    getServerSnapshot,
  );
  const region = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const pointerStart = useRef<number | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const visibleNotifications = notifications.slice(-3).reverse();
  const focusedNotification =
    focusedId === null
      ? undefined
      : notifications.find((notification) => notification.id === focusedId);
  // Keep a focused control mounted when a newer refresh result arrives.
  if (focusedNotification && !visibleNotifications.includes(focusedNotification)) {
    visibleNotifications[visibleNotifications.length - 1] = focusedNotification;
  }

  const restoreFocus = () => {
    if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
  };
  const dismiss = (id: number) => {
    if (region.current?.contains(document.activeElement)) restoreFocus();
    notificationStore.dismiss(id);
  };
  const resetPointer = () => {
    pointerStart.current = null;
    notificationStore.pause("pointer", false);
  };

  useMountEffect(() => {
    const onVisibility = () => notificationStore.pause("hidden", document.hidden);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.code === "KeyT" && notificationStore.getSnapshot().length) {
        event.preventDefault();
        region.current?.focus();
      }
      if (event.key === "Escape" && region.current?.contains(document.activeElement)) {
        event.preventDefault();
        if (previousFocus.current?.isConnected)
          previousFocus.current.focus({ preventScroll: true });
      }
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("keydown", onKeyDown);
      for (const reason of ["hidden", "hover", "focus", "pointer"])
        notificationStore.pause(reason, false);
    };
  });

  return (
    <section
      {...stylex.props(styles.region)}
      ref={region}
      aria-label="Notifications, Alt+T"
      tabIndex={-1}
      onMouseEnter={() => notificationStore.pause("hover", true)}
      onMouseLeave={() => notificationStore.pause("hover", false)}
      onFocus={(event) => {
        if (event.target === event.currentTarget) setFocusedId(null);
        if (!event.currentTarget.contains(event.relatedTarget)) {
          previousFocus.current =
            event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
        }
        notificationStore.pause("focus", true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedId(null);
          notificationStore.pause("focus", false);
        }
      }}
    >
      <ol
        {...stylex.props(styles.list)}
        aria-live="polite"
        aria-relevant="additions"
        aria-atomic="false"
      >
        {visibleNotifications.map((notification) => (
          <li
            key={notification.id}
            {...stylex.props(styles.toast)}
            onFocus={() => setFocusedId(notification.id)}
            onPointerDown={(event) => {
              if (event.target instanceof Element && event.target.closest("button")) return;
              pointerStart.current = event.clientY;
              event.currentTarget.setPointerCapture(event.pointerId);
              notificationStore.pause("pointer", true);
            }}
            onPointerUp={(event) => {
              if (pointerStart.current !== null && event.clientY - pointerStart.current < -40)
                dismiss(notification.id);
              resetPointer();
            }}
            onPointerCancel={resetPointer}
            onLostPointerCapture={resetPointer}
          >
            {notification.kind === "success" && (
              <CircleCheck aria-hidden="true" {...stylex.props(styles.icon)} />
            )}
            {notification.kind === "error" && (
              <CircleX aria-hidden="true" {...stylex.props(styles.icon)} />
            )}
            <span {...stylex.props(styles.message)}>{notification.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              {...stylex.props(styles.dismiss)}
              onClick={() => dismiss(notification.id)}
            >
              <X aria-hidden="true" {...stylex.props(styles.icon)} />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

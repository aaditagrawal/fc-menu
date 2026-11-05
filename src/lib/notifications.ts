export type NotificationKind = "message" | "success" | "error";
export interface Notification {
  id: number;
  message: string;
  kind: NotificationKind;
}
export interface NotificationOptions {
  duration?: number;
}

const scheduleTimeout = (callback: () => void, delay: number) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
};

export function createNotificationStore(now = Date.now, schedule = scheduleTimeout) {
  let nextId = 0;
  let notifications: readonly Notification[] = [];
  const listeners = new Set<() => void>();
  const pauses = new Set<string>();
  const timers = new Map<number, { remaining: number; started: number; cancel?: () => void }>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  const stop = () => {
    for (const timer of timers.values()) {
      if (!timer.cancel) continue;
      timer.cancel();
      timer.cancel = undefined;
      timer.remaining = Math.max(0, timer.remaining - (now() - timer.started));
    }
  };
  const start = () => {
    if (!listeners.size || pauses.size) return;
    for (const notification of notifications) {
      const timer = timers.get(notification.id);
      if (!timer || timer.cancel || timer.remaining === Infinity) continue;
      timer.started = now();
      timer.cancel = schedule(() => dismiss(notification.id), timer.remaining);
    }
  };
  const dismiss = (id: number) => {
    timers.get(id)?.cancel?.();
    timers.delete(id);
    notifications = notifications.filter((notification) => notification.id !== id);
    start();
    emit();
  };
  const push = (message: string, kind: NotificationKind, options?: NotificationOptions) => {
    const id = ++nextId;
    const duration = options?.duration ?? 4000;
    timers.set(id, { remaining: duration > 0 ? duration : 4000, started: 0 });
    notifications = [...notifications, { id, message, kind }];
    start();
    emit();
    return id;
  };
  return {
    push,
    dismiss,
    getSnapshot: () => notifications,
    pause(reason: string, paused: boolean) {
      stop();
      if (paused) pauses.add(reason);
      else pauses.delete(reason);
      start();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      start();
      return () => {
        listeners.delete(listener);
        if (!listeners.size) stop();
      };
    },
  };
}

export const notificationStore = createNotificationStore();
export const toast = Object.assign(
  (message: string, options?: NotificationOptions) =>
    notificationStore.push(message, "message", options),
  {
    success: (message: string) => notificationStore.push(message, "success"),
    error: (message: string) => notificationStore.push(message, "error"),
    dismiss: notificationStore.dismiss,
  },
);

"use client";

import { useMountEffect } from "@/hooks/useMountEffect";

export function ServiceWorker() {
  useMountEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  });

  return null;
}

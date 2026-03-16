"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function MenuNotification() {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;

    const timer = setTimeout(() => {
      toast(
        "The menu is now contributed by the Indian Kitchen and is up to date with what they provide.",
        { duration: 1500 },
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

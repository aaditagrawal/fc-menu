"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Toaster } from "@/components/ui/sonner";
import { OfflineBanner } from "@/components/OfflineBanner";

export function AppChrome() {
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      <Toaster />
      <OfflineBanner />
    </>
  );
}

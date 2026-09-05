"use client";

import * as stylex from "@stylexjs/stylex";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Toaster } from "@/components/ui/sonner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useMountEffect } from "@/hooks/useMountEffect";
import { RESET_PARAM } from "@/lib/hardReset";

/**
 * The reset param exists only to keep the recovery reload out of the HTTP
 * cache. Once the fresh document is up it has done its job, so drop it before
 * the user can copy or share the URL.
 */
const styles = stylex.create({
  themeSwitcher: {
    position: "fixed",
    top: "1rem",
    right: "1rem",
    zIndex: 50,
  },
});

function useStripResetParam() {
  useMountEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(RESET_PARAM)) return;

    url.searchParams.delete(RESET_PARAM);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  });
}

export function AppChrome() {
  useStripResetParam();

  return (
    <>
      <div {...stylex.props(styles.themeSwitcher)}>
        <ThemeSwitcher />
      </div>
      <Toaster />
      <OfflineBanner />
    </>
  );
}

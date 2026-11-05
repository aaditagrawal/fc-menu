"use client";

import { useSyncExternalStore } from "react";
import { createThemeStore, type Theme } from "@/lib/theme";

let store: ReturnType<typeof createThemeStore> | undefined;
const getStore = () => (store ??= createThemeStore(window));
const subscribe = (listener: () => void) => getStore().subscribe(listener);
const getSnapshot = () => getStore().getSnapshot();
const getServerSnapshot = () => undefined;
const setTheme = (theme: Theme) => getStore().setTheme(theme);

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { theme, setTheme };
}

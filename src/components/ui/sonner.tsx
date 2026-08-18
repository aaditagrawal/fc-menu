"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

// next-themes reports whatever string is in storage, including a theme this app
// no longer defines. Sonner only understands these three, so anything else
// falls back to "system" rather than being handed over unchecked.
function toToasterTheme(theme: string): ToasterProps["theme"] {
  return theme === "light" || theme === "dark" ? theme : "system";
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={toToasterTheme(theme)}
      className="toaster group"
      position="top-center"
      // SAFETY: these are CSS custom properties, which React writes to the
      // element's style verbatim. They are valid inline style entries, but
      // CSSProperties only declares the known CSS properties and has no index
      // signature for `--*`, so there is no way to express them without this.
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

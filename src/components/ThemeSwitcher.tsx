"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useMountEffect } from "@/hooks/useMountEffect";
import { easing } from "@/lib/tokens.stylex";

const iconIn = stylex.keyframes({
  from: { opacity: 0, transform: "scale(0.85)" },
  to: { opacity: 1, transform: "scale(1)" },
});

const styles = stylex.create({
  iconSlot: {
    display: "inline-flex",
  },
  iconSwap: {
    animationName: iconIn,
    animationDuration: "150ms",
    animationTimingFunction: easing.spring,
  },
  icon: {
    height: "1.2rem",
    width: "1.2rem",
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: "-1px",
    marginRight: "-1px",
    marginBottom: "-1px",
    marginLeft: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  // Only crossfade on user-initiated changes, not when the placeholder icon
  // is swapped for the resolved one after mount.
  const [hasCycled, setHasCycled] = React.useState(false);

  useMountEffect(() => {
    setMounted(true);
  });

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun {...stylex.props(styles.icon)} />
        <span {...stylex.props(styles.srOnly)}>Toggle theme</span>
      </Button>
    );
  }

  const cycleTheme = () => {
    setHasCycled(true);
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun {...stylex.props(styles.icon)} />;
      case "dark":
        return <Moon {...stylex.props(styles.icon)} />;
      default:
        return <Monitor {...stylex.props(styles.icon)} />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Switch to dark mode";
      case "dark":
        return "Switch to system mode";
      default:
        return "Switch to light mode";
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={cycleTheme}>
      <span key={theme} {...stylex.props(styles.iconSlot, hasCycled && styles.iconSwap)}>
        {getIcon()}
      </span>
      <span {...stylex.props(styles.srOnly)}>{getLabel()}</span>
    </Button>
  );
}

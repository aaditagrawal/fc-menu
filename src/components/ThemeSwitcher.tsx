"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useMountEffect } from "@/hooks/useMountEffect";

const styles = stylex.create({
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
      {getIcon()}
      <span {...stylex.props(styles.srOnly)}>{getLabel()}</span>
    </Button>
  );
}

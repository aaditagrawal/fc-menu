import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import * as stylex from "@stylexjs/stylex";

import { easing } from "@/lib/tokens.stylex";

const styles = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    borderRadius: "calc(var(--radius) - 2px)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 500,
    // `scale` is listed alongside `transform` because the active press effect
    // uses the standalone `scale` property, which a `transform` transition
    // won't animate.
    transitionProperty: {
      default: "background-color,color,border-color,box-shadow,transform,scale",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionDuration: "150ms",
    transitionTimingFunction: easing.spring,
    scale: {
      default: null,
      ":active": {
        default: "0.98",
        "@media (prefers-reduced-motion: reduce)": "1",
      },
    },
    outlineStyle: {
      default: null,
      ":focus-visible": "none",
    },
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 2px var(--background), 0 0 0 4px var(--ring)",
    },
    pointerEvents: {
      default: null,
      ":disabled": "none",
    },
    opacity: {
      default: null,
      ":disabled": 0.5,
    },
  },
  variantDefault: {
    backgroundColor: {
      default: "var(--primary)",
      ":hover": "color-mix(in oklab, var(--primary) 90%, transparent)",
    },
    color: "var(--primary-foreground)",
  },
  variantDestructive: {
    backgroundColor: {
      default: "var(--destructive)",
      ":hover": "color-mix(in oklab, var(--destructive) 90%, transparent)",
    },
  },
  variantOutline: {
    borderWidth: "1px",
    borderColor: "var(--input)",
    backgroundColor: {
      default: "var(--background)",
      ":hover": "var(--accent)",
    },
    color: {
      default: null,
      ":hover": "var(--accent-foreground)",
    },
  },
  variantSecondary: {
    backgroundColor: {
      default: "var(--secondary)",
      ":hover": "color-mix(in oklab, var(--secondary) 80%, transparent)",
    },
    color: "var(--secondary-foreground)",
  },
  variantGhost: {
    backgroundColor: {
      default: null,
      ":hover": "var(--accent)",
    },
    color: {
      default: null,
      ":hover": "var(--accent-foreground)",
    },
  },
  variantLink: {
    color: "var(--primary)",
    textUnderlineOffset: "4px",
    textDecorationLine: {
      default: null,
      ":hover": "underline",
    },
  },
  sizeDefault: {
    height: "2.5rem",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
  },
  sizeSm: {
    height: "2.25rem",
    borderRadius: "calc(var(--radius) - 2px)",
    paddingInline: "0.75rem",
  },
  sizeLg: {
    height: "2.75rem",
    borderRadius: "calc(var(--radius) - 2px)",
    paddingInline: "2rem",
  },
  sizeIcon: {
    height: "2.5rem",
    width: "2.5rem",
  },
});

const variantStyles = {
  default: styles.variantDefault,
  destructive: styles.variantDestructive,
  outline: styles.variantOutline,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  link: styles.variantLink,
} as const;

const sizeStyles = {
  default: styles.sizeDefault,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
} as const;

export interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "style"
> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  asChild?: boolean;
  style?: stylex.StyleXStyles;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        {...stylex.props(styles.base, variantStyles[variant], sizeStyles[size], style)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };

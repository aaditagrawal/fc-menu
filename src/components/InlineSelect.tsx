"use client";

import * as React from "react";
import { useEffect } from "react";
import * as stylex from "@stylexjs/stylex";
import { easing } from "@/lib/tokens.stylex";

const menuIn = stylex.keyframes({
  from: {
    opacity: 0,
    transform: "translateY(-0.25rem) scale(0.98)",
  },
});

const styles = stylex.create({
  wrap: {
    position: "relative",
    display: "inline-block",
  },
  trigger: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "4px",
    color: {
      default: "color-mix(in oklab, var(--foreground) 90%, transparent)",
      ":hover": "var(--foreground)",
    },
    paddingInline: "0.25rem",
    paddingBlock: "0.125rem",
    borderRadius: "0.25rem",
    outlineStyle: {
      default: null,
      ":focus": "none",
    },
    boxShadow: {
      default: null,
      ":focus": "0 0 0 2px var(--ring)",
    },
    cursor: "pointer",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  triggerValue: {
    fontWeight: 500,
  },
  menu: {
    position: "absolute",
    zIndex: 50,
    marginTop: "0.5rem",
    minWidth: "220px",
    borderRadius: "calc(var(--radius) + 4px)",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "var(--popover)",
    paddingInline: "0.25rem",
    paddingBlock: "0.25rem",
    boxShadow: "0 4px 14px -4px oklch(0 0 0/0.12),0 2px 6px -2px oklch(0 0 0/0.06)",
    top: "100%",
    left: 0,
    transformOrigin: "top",
    animationName: menuIn,
    animationDuration: "150ms",
    animationTimingFunction: easing.spring,
  },
  option: {
    display: "block",
    width: "100%",
    textAlign: "left",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
    cursor: "pointer",
  },
  optionSelected: {
    backgroundColor: "var(--muted)",
    fontWeight: 500,
  },
  optionUnselected: {
    backgroundColor: {
      default: null,
      ":hover": "color-mix(in oklab, var(--muted) 70%, transparent)",
    },
  },
});

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      // A target that is not a Node cannot be inside the menu, so it closes too
      // — same outcome the old `contains` call produced for those events.
      const target = e.target;
      if (ref.current && (!(target instanceof Node) || !ref.current.contains(target))) {
        onClose();
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, ref, onClose]);
}

export function InlineSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  style,
}: {
  label?: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
  style?: stylex.StyleXStyles;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  const closeMenu = React.useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, closeMenu);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} {...stylex.props(styles.wrap, style)}>
      <button
        ref={buttonRef}
        type="button"
        {...stylex.props(styles.trigger)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label ? `${label}: ` : null}
        <span {...stylex.props(styles.triggerValue)}>{selected?.label ?? String(value)}</span>
      </button>
      {open ? (
        <div role="listbox" {...stylex.props(styles.menu)} onClick={(e) => e.stopPropagation()}>
          {options.map((opt) => (
            <button
              type="button"
              key={String(opt.value)}
              role="option"
              aria-selected={opt.value === value}
              {...stylex.props(
                styles.option,
                opt.value === value ? styles.optionSelected : styles.optionUnselected,
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

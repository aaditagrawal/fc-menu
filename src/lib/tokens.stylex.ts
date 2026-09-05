import * as stylex from "@stylexjs/stylex";

/**
 * Compile-time constants shared across StyleX styles.
 *
 * Colors are intentionally NOT defined here: theme colors live as plain CSS
 * custom properties in globals.css (`:root` / `.dark`) because dark mode is
 * class-based via next-themes. Styles reference them as raw strings, e.g.
 * `color: "var(--muted-foreground)"`.
 */

// NOTE: media queries are written as literal strings at each usage site
// (e.g. "@media (min-width: 640px)") rather than defineConsts. Const keys
// compile to opaque placeholders, which defeats StyleX's `enableMediaQueryOrder`
// transform that rewrites overlapping min-width queries into exclusive ranges —
// breaking responsive breakpoints entirely.
export const easing = stylex.defineConsts({
  // The app-wide "spring" ease used by .press / carousels / buttons
  spring: "cubic-bezier(0.16, 1, 0.3, 1)",
  // Tailwind's default transition timing function
  twDefault: "cubic-bezier(0.4, 0, 0.2, 1)",
});

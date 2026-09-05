import * as stylex from "@stylexjs/stylex";

/**
 * Merge StyleX styles with plain global class names (e.g. `press`,
 * `elevated-card`, `scrollbar-hide` from globals.css).
 *
 * Returns `{ className, style }` ready to spread onto an element.
 */
export function sxc(
  classNames: string | null | undefined,
  ...styles: ReadonlyArray<stylex.StyleXStyles | null | undefined | false>
) {
  const props = stylex.props(...styles);
  const merged = [classNames, props.className].filter(Boolean).join(" ");
  return { ...props, className: merged === "" ? undefined : merged };
}

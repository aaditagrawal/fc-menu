import type * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";

interface SlideProps {
  children: React.ReactNode;
  className?: string;
  style?: stylex.StyleXStyles;
  pattern?: "dots" | "none";
}

export function Slide({ children, className, style, pattern = "none" }: SlideProps) {
  return (
    <section
      {...sxc(
        ["wrapped-slide", pattern === "dots" && "pattern-dots", className]
          .filter(Boolean)
          .join(" "),
        style,
      )}
    >
      {children}
    </section>
  );
}

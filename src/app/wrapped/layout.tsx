import { Geist_Mono } from "next/font/google";
import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import "./wrapped.css";

// Only the wrapped slides use the mono face, so it loads here rather than in
// the root layout where every route would preload it.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const styles = stylex.create({
  root: {
    // :root's --font-mono is computed where --font-geist-mono is unset and
    // inherits as invalid, so it must be re-resolved below this font's class.
    "--font-mono":
      'var(--font-geist-mono), ui-monospace, "Cascadia Code", "Source Code Pro", monospace',
    minHeight: "100vh",
    backgroundColor: "var(--background)",
  },
});

export default function WrappedLayout({ children }: { children: React.ReactNode }) {
  return <div {...sxc(geistMono.variable, styles.root)}>{children}</div>;
}

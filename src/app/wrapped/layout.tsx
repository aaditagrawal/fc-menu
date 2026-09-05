import * as stylex from "@stylexjs/stylex";
import "./wrapped.css";

const styles = stylex.create({
  root: {
    minHeight: "100vh",
    backgroundColor: "var(--background)",
  },
});

export default function WrappedLayout({ children }: { children: React.ReactNode }) {
  return <div {...stylex.props(styles.root)}>{children}</div>;
}

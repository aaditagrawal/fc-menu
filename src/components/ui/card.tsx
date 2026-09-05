import * as React from "react";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  card: {
    borderRadius: "calc(var(--radius) + 4px)",
    borderWidth: "1px",
    backgroundColor: "var(--card)",
    color: "var(--card-foreground)",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.375rem",
    padding: "1.5rem",
  },
  title: {
    fontSize: "1.25rem",
    lineHeight: 1,
    fontWeight: 600,
    letterSpacing: "-0.025em",
  },
  description: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  content: {
    padding: "1.5rem",
    paddingTop: 0,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    padding: "1.5rem",
    paddingTop: 0,
  },
});

type DivProps = Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "style"> & {
  style?: stylex.StyleXStyles;
};

export type CardProps = DivProps;

export function Card({ style, ...props }: CardProps) {
  return <div {...stylex.props(styles.card, style)} {...props} />;
}

export function CardHeader({ style, ...props }: DivProps) {
  return <div {...stylex.props(styles.header, style)} {...props} />;
}

export function CardTitle({
  style,
  ...props
}: Omit<React.HTMLAttributes<HTMLHeadingElement>, "className" | "style"> & {
  style?: stylex.StyleXStyles;
}) {
  return <h3 {...stylex.props(styles.title, style)} {...props} />;
}

export function CardDescription({
  style,
  ...props
}: Omit<React.HTMLAttributes<HTMLParagraphElement>, "className" | "style"> & {
  style?: stylex.StyleXStyles;
}) {
  return <p {...stylex.props(styles.description, style)} {...props} />;
}

export function CardContent({ style, ...props }: DivProps) {
  return <div {...stylex.props(styles.content, style)} {...props} />;
}

export function CardFooter({ style, ...props }: DivProps) {
  return <div {...stylex.props(styles.footer, style)} {...props} />;
}

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import * as stylex from "@stylexjs/stylex";
import { AppChrome } from "@/components/AppChrome";
import { ServiceWorker } from "@/components/ServiceWorker";
import { QueryProvider } from "@/providers/QueryProvider";
import { easing } from "@/lib/tokens.stylex";
import { sxc } from "@/lib/utils";
import { geistSans, geistMono } from "./fonts";
import "./globals.css";

const styles = stylex.create({
  body: {
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
  },
  footer: {
    paddingBlock: "1.5rem",
    paddingInline: "1rem",
    display: "flex",
    justifyContent: "center",
  },
  footerPill: {
    display: "inline-flex",
    paddingInline: "1.5rem",
    paddingBlock: "0.75rem",
    borderRadius: "9999px",
    backgroundColor: "color-mix(in oklab, var(--secondary) 40%, transparent)",
    borderWidth: "1px",
    maxWidth: "100%",
  },
  footerText: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
    textAlign: "center",
  },
  footerLink: {
    color: {
      default: null,
      ":hover": "var(--foreground)",
    },
    transitionProperty:
      "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionDuration: "150ms",
    transitionTimingFunction: easing.twDefault,
  },
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tikmit.com"),
  title: {
    default: "Food Court Menus - The Indian Kitchen",
    template: "%s - The Indian Kitchen",
  },
  description: "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Food Court Menus",
    title: "Food Court Menus - The Indian Kitchen",
    description: "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Food Court Menus",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Food Court Menus - The Indian Kitchen",
    description: "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FC Menu",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/data/menu-bundle/manifest.json"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://stat.sys256.com" />
        <script defer src="https://stat.sys256.com/script.js" />
      </head>
      <body {...sxc(`${geistSans.variable} ${geistMono.variable} scroll-optimized`, styles.body)}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main {...stylex.props(styles.main)}>{children}</main>
            <footer {...stylex.props(styles.footer)}>
              <div {...stylex.props(styles.footerPill)}>
                <p {...stylex.props(styles.footerText)}>
                  Made by{" "}
                  <a
                    href="https://aadit.cc"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...stylex.props(styles.footerLink)}
                  >
                    Aadit
                  </a>
                  {" • "}
                  <a
                    href="https://tikm.coolstuff.work/docs/reference"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...stylex.props(styles.footerLink)}
                  >
                    API Docs
                  </a>
                  {" • "}
                  <a
                    href="https://github.com/aaditagrawal/fc-menu"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...stylex.props(styles.footerLink)}
                  >
                    Open Source
                  </a>
                  {" • "}
                  <a
                    href="https://blog.aadit.cc/posts/building-a-food-court-menu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...stylex.props(styles.footerLink)}
                  >
                    How it was made
                  </a>
                </p>
              </div>
            </footer>
            <AppChrome />
            <ServiceWorker />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

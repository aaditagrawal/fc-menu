import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { QueryProvider } from "@/providers/QueryProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Food Court Menus — The Indian Kitchen",
    template: "%s — The Indian Kitchen",
  },
  description:
    "A fast, friendly viewer for weekly menus with time-aware highlighting (IST).",
  icons: {
    icon: "/favicon.svg",
  },
  other: {
    // Encourage browser caching for static content - 7 days
    "cache-control": "public, max-age=604800",
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
        <script defer src="https://stat.sys256.com/script.js"></script>
      </head>
      <body
        className="antialiased min-h-screen flex flex-col scroll-optimized"
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="fixed top-4 right-4 z-50">
              <ThemeSwitcher />
            </div>
            <main className="flex-1">{children}</main>
            <footer className="py-6 px-4 flex justify-center">
              <div className="inline-flex px-6 py-3 rounded-full bg-secondary/40 border max-w-full">
                <p className="text-xs text-muted-foreground text-center">
                  Made by{" "}
                  <a
                    href="https://aadit.cc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Aadit
                  </a>
                  {" • "}
                  <a
                    href="https://tikm.coolstuff.work/docs/reference"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    API Docs
                  </a>
                  {" • "}
                  <a
                    href="https://github.com/aaditagrawal/fc-menu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Open Source
                  </a>
                  {" • "}
                  <a
                    href="https://blog.aadit.cc/posts/building-a-food-court-menu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    How it was made
                  </a>
                </p>
              </div>
            </footer>
            <Toaster />
            <OfflineBanner />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

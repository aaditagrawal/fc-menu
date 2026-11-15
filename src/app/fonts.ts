import { Geist } from "next/font/google";

// Shared so global-error, which replaces the root layout entirely, renders
// the same face as the rest of the app. Geist Mono lives in the wrapped
// layout: every font declared in a module the root layout imports is
// preloaded on every route.
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

import { Geist, Geist_Mono } from "next/font/google";

// Shared so global-error, which replaces the root layout entirely, renders
// the same faces as the rest of the app.
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

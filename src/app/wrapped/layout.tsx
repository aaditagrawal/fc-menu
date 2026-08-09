import { Geist_Mono } from "next/font/google";
import "./wrapped.css";

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function WrappedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${geistMono.variable} min-h-screen bg-background`}>
            {children}
        </div>
    );
}

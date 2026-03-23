"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";

const CANONICAL_HOSTS = ["tikmit.com", "www.tikmit.com"];
const DISMISS_KEY = "domain-banner-dismissed";

export function DomainBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isCanonical = CANONICAL_HOSTS.includes(window.location.hostname);
    const isDismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    if (!isCanonical && !isDismissed) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible || !bannerRef.current || !spacerRef.current) return;
    const height = bannerRef.current.offsetHeight;
    // top-3 (12px) + banner height + 12px bottom gap
    spacerRef.current.style.height = `${height + 24}px`;
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <div ref={spacerRef} />
      <div
        ref={bannerRef}
        className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 md:px-8 animate-in slide-in-from-top duration-300"
      >
        <a
          href="https://tikmit.com"
          className="domain-banner relative flex w-full max-w-4xl items-center justify-center gap-2 rounded-xl px-10 py-2.5 text-sm font-medium text-white no-underline shadow-lg"
        >
          <span className="flex items-center gap-2">
            This site is now available at{" "}
            <strong className="font-semibold">tikmit.com</strong>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              sessionStorage.setItem(DISMISS_KEY, "1");
              setVisible(false);
            }}
            className="absolute right-1 flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </a>
      </div>
    </>
  );
}

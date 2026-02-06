"use client";

import { useCallback, useEffect, useRef } from "react";

interface ScrollOptions {
  passive?: boolean;
  capture?: boolean;
  debounceMs?: number;
}

export function useOptimizedScroll(
  callback: (event: Event) => void,
  options: ScrollOptions = {}
) {
  const { passive = true, capture = false, debounceMs = 80 } = options;
  const callbackRef = useRef(callback);
  const rafRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleScroll = useCallback(
    (event: Event) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        callbackRef.current(event);
        rafRef.current = null;
      });

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        callbackRef.current(event);
      }, debounceMs);
    },
    [debounceMs]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    handleScroll,
    options: { passive, capture },
  };
}

export function useSmoothScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollVelocityRef = useRef(0);

  const scrollToElement = useCallback((element: HTMLElement) => {
    const container = containerRef.current;
    if (!container || !element) return;

    const elementCenterX = element.offsetLeft + element.offsetWidth / 2;
    const containerCenterX = container.clientWidth / 2;
    const scrollX = elementCenterX - containerCenterX;

    container.scrollTo({ left: scrollX, behavior: "smooth" });
  }, []);

  const scrollToIndex = useCallback(
    (index: number, selector: string) => {
      const container = containerRef.current;
      if (!container) return;

      const elements = container.querySelectorAll(selector);
      const element = elements[index] as HTMLElement | undefined;
      if (element) scrollToElement(element);
    },
    [scrollToElement]
  );

  const scrollToPosition = useCallback((x: number, y: number) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({ left: x, top: y, behavior: "smooth" });
  }, []);

  return {
    containerRef,
    scrollToElement,
    scrollToIndex,
    scrollToPosition,
    scrollVelocity: scrollVelocityRef,
    isScrolling: isScrollingRef,
  };
}

export function useMomentumScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollVelocityRef = useRef(0);
  const lastLeftRef = useRef(0);
  const lastTsRef = useRef(0);
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const now = performance.now();
      const deltaX = container.scrollLeft - lastLeftRef.current;
      const deltaT = now - lastTsRef.current;

      if (deltaT > 0) {
        scrollVelocityRef.current = Math.abs(deltaX) / deltaT;
      }

      lastLeftRef.current = container.scrollLeft;
      lastTsRef.current = now;
      isScrollingRef.current = true;

      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current);
      }
      endTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollVelocityRef.current = 0;
      }, 120);
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    isScrolling: isScrollingRef,
    velocity: scrollVelocityRef,
  };
}

export function useTouchScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const isDraggingRef = useRef(false);
  const velocityRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now(),
      };
      isDraggingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      const touch = e.touches[0];
      const now = performance.now();
      const dt = now - touchStartRef.current.time;
      if (dt <= 0) return;

      velocityRef.current = {
        x: (touch.clientX - touchStartRef.current.x) / dt,
        y: (touch.clientY - touchStartRef.current.y) / dt,
      };
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      velocityRef.current = { x: 0, y: 0 };
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return {
    containerRef,
    touchStart: touchStartRef,
    isDragging: isDraggingRef,
    velocity: velocityRef,
  };
}

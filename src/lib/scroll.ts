"use client";

import { useCallback, useEffect, useRef } from 'react';

interface ScrollOptions {
  passive?: boolean;
  capture?: boolean;
  debounceMs?: number;
}

/**
 * Ultra-high frequency scroll handler with micro-adjustments
 * for maximum sensitivity and smoothness (240Hz equivalent)
 */
export function useOptimizedScroll(
  callback: (event: Event) => void,
  options: ScrollOptions = {}
) {
  const { passive = true, capture = false, debounceMs = 4 } = options; // Much higher frequency (240Hz equivalent)
  const tickingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallbackRef = useRef(callback);
  const rafIdRef = useRef<number | undefined>(undefined);
  const lastTimestampRef = useRef<number>(0);

  // Update callback ref when callback changes
  useEffect(() => {
    lastCallbackRef.current = callback;
  }, [callback]);

  const handleScroll = useCallback(
    (event: Event) => {
      const now = performance.now();
      
      // Ultra-high frequency updates - fire every 4ms minimum
      if (!tickingRef.current || now - lastTimestampRef.current > 4) {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        
        rafIdRef.current = requestAnimationFrame(() => {
          lastCallbackRef.current(event);
          tickingRef.current = false;
          lastTimestampRef.current = now;
        });
        
        tickingRef.current = true;
      }

      // Very short debounce for final updates
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        lastCallbackRef.current(event);
        tickingRef.current = false;
      }, debounceMs);
    },
    [debounceMs]
  );

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    handleScroll,
    options: { passive, capture }
  };
}

/**
 * Ultra-sensitive smooth scroll behavior with instant response
 */
export function useSmoothScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollVelocityRef = useRef(0);

  const scrollToElement = useCallback((element: HTMLElement, options?: ScrollIntoViewOptions) => {
    if (!containerRef.current || !element) return;

    const container = containerRef.current;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the scroll position to center the element
    const elementCenterX = element.offsetLeft + element.offsetWidth / 2;
    const containerCenterX = container.clientWidth / 2;
    const scrollX = elementCenterX - containerCenterX;
    
    // Scroll to the calculated position
    container.scrollTo({
      left: scrollX,
      behavior: 'smooth'
    });
  }, []);

  const scrollToIndex = useCallback((index: number, selector: string) => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(selector);
    const element = elements[index] as HTMLElement;
    
    if (element) {
      scrollToElement(element);
    }
  }, [scrollToElement]);

  const scrollToPosition = useCallback((x: number, y: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.scrollTo({
      left: x,
      top: y,
      behavior: 'smooth'
    });
  }, []);

  return {
    containerRef,
    scrollToElement,
    scrollToIndex,
    scrollToPosition,
    scrollVelocity: scrollVelocityRef,
    isScrolling: isScrollingRef
  };
}

/**
 * Ultra-responsive momentum scrolling with velocity tracking
 */
export function useMomentumScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollVelocityRef = useRef(0);
  const lastScrollLeftRef = useRef(0);
  const lastTimestampRef = useRef(performance.now());
  const rafIdRef = useRef<number | undefined>(undefined);
  const momentumIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    
    const handleScroll = () => {
      const now = performance.now();
      const deltaX = container.scrollLeft - lastScrollLeftRef.current;
      const deltaTime = now - lastTimestampRef.current;
      
      // Calculate velocity for momentum with high precision
      if (deltaTime > 0) {
        const velocity = Math.abs(deltaX) / deltaTime;
        scrollVelocityRef.current = velocity;
      }
      
      lastScrollLeftRef.current = container.scrollLeft;
      lastTimestampRef.current = now;
      
      if (!ticking) {
        requestAnimationFrame(() => {
          // Ultra-sensitive scroll state management
          if (!isScrollingRef.current) {
            isScrollingRef.current = true;
            container.style.pointerEvents = 'none';
            container.style.willChange = 'scroll-position';
            container.style.transform = 'translateZ(0)';
          }
          ticking = false;
        });
        ticking = true;
      }
      
      // Clear any existing end timer
      if (momentumIdRef.current) {
        clearTimeout(momentumIdRef.current);
      }
      
      // Set very short timer for scroll end detection (50ms for instant feel)
      momentumIdRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
        container.style.pointerEvents = '';
        container.style.willChange = 'auto';
        scrollVelocityRef.current = 0;
        
        // Remove transform after scroll ends
        requestAnimationFrame(() => {
          container.style.transform = '';
        });
      }, 50);
    };

    // Use passive listeners for maximum performance with capture for priority
    container.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    // Also listen to wheel events for better desktop responsiveness
    const handleWheel = () => {
      if (!isScrollingRef.current) {
        container.style.willChange = 'scroll-position';
        container.style.transform = 'translateZ(0)';
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: true, capture: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      const currentRafId = rafIdRef.current;
      const currentMomentumId = momentumIdRef.current;
      if (currentRafId) {
        cancelAnimationFrame(currentRafId);
      }
      if (currentMomentumId) {
        clearTimeout(currentMomentumId);
      }
    };
  }, []);

  return {
    containerRef,
    isScrolling: isScrollingRef,
    velocity: scrollVelocityRef
  };
}

/**
 * Custom hook for ultra-responsive touch scroll tracking
 */
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
        time: performance.now()
      };
      isDraggingRef.current = true;
      container.style.willChange = 'scroll-position';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      
      const touch = e.touches[0];
      const now = performance.now();
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = now - touchStartRef.current.time;
      
      if (deltaTime > 0) {
        velocityRef.current = {
          x: deltaX / deltaTime,
          y: deltaY / deltaTime
        };
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      container.style.willChange = 'auto';
      
      // Reset velocity after momentum
      setTimeout(() => {
        velocityRef.current = { x: 0, y: 0 };
      }, 100);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return {
    containerRef,
    velocity: velocityRef,
    isDragging: isDraggingRef
  };
}
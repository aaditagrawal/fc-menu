/**
 * Client-side caching utility using localStorage
 * Reduces API calls by caching responses with TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class LocalStorageCache {
  private static instance: LocalStorageCache;
  private readonly prefix = 'fc-menu-cache';

  private constructor() {
    // Auto-clear expired cache entries when cache is first initialized
    if (typeof window !== 'undefined') {
      autoClearExpiredCache();
    }
  }

  static getInstance(): LocalStorageCache {
    if (!LocalStorageCache.instance) {
      LocalStorageCache.instance = new LocalStorageCache();
    }
    return LocalStorageCache.instance;
  }

  private getCacheKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private isValidEntry(entry: CacheEntry<unknown>): boolean {
    return entry && typeof entry.timestamp === 'number' && typeof entry.ttl === 'number';
  }

  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000, // Convert minutes to milliseconds
      };
      localStorage.setItem(this.getCacheKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // Clear some old entries if storage is full
      this.clearExpired();
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getCacheKey(key));
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);

      if (!this.isValidEntry(entry) || this.isExpired(entry)) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      this.delete(key);
      return null;
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.getCacheKey(key));
    } catch (error) {
      console.warn('Failed to delete cache entry:', error);
    }
  }

  clearExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

      for (const cacheKey of cacheKeys) {
        const item = localStorage.getItem(cacheKey);
        if (!item) continue;

        try {
          const entry = JSON.parse(item);
          if (!this.isValidEntry(entry) || this.isExpired(entry)) {
            localStorage.removeItem(cacheKey);
          }
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired cache entries:', error);
    }
  }

  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

      for (const key of cacheKeys) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to clear all cache entries:', error);
    }
  }

  getCacheInfo(): { totalEntries: number; expiredEntries: number } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      let expiredCount = 0;

      for (const cacheKey of cacheKeys) {
        const item = localStorage.getItem(cacheKey);
        if (!item) continue;

        try {
          const entry = JSON.parse(item);
          if (!this.isValidEntry(entry) || this.isExpired(entry)) {
            expiredCount++;
          }
        } catch {
          expiredCount++;
        }
      }

      return {
        totalEntries: cacheKeys.length,
        expiredEntries: expiredCount,
      };
    } catch (error) {
      console.warn('Failed to get cache info:', error);
      return { totalEntries: 0, expiredEntries: 0 };
    }
  }
}

// Cache TTL configurations (in minutes) - reduced for faster updates
export const CACHE_TTL = {
  WEEKS_INFO: 10, // 10 minutes - allows faster updates when new data is published
  WEEK_MENU: 10,  // 10 minutes - allows faster updates when new data is published
  LATEST_WEEK: 10, // 10 minutes - allows faster updates when new data is published
} as const;

// Cache key generators
export const CACHE_KEYS = {
  weeksInfo: () => 'weeks-info',
  weekMenu: (id: string) => `week-menu-${id}`,
  latestWeek: () => 'latest-week',
} as const;

// Auto-clear expired cache on app start (simple cleanup)
function autoClearExpiredCache(): void {
  // Only run on client side and after hydration to avoid hydration mismatches
  if (typeof window === 'undefined') return;

  try {
    const info = LocalStorageCache.getInstance().getCacheInfo();
    if (info.expiredEntries > 0) {
      console.log(`🧹 Auto-clearing ${info.expiredEntries} expired cache entries`);
      clearExpiredCache();
    }
  } catch {
    // Silently fail if cleanup doesn't work
  }
}

// Convenience functions for common cache operations
export const cache = LocalStorageCache.getInstance();

export function getCachedData<T>(key: string): T | null {
  return cache.get<T>(key);
}

export function setCachedData<T>(key: string, data: T, ttlMinutes: number): void {
  cache.set(key, data, ttlMinutes);
}

export function clearExpiredCache(): void {
  cache.clearExpired();
}

export function clearAllCache(): void {
  cache.clearAll();
}

export function getCacheInfo() {
  return cache.getCacheInfo();
}


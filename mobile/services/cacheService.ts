/**
 * Cache service for API responses with TTL support
 * Uses AsyncStorage for persistence across app sessions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache entry metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  prefix: string; // Key prefix for cache entries
  maxEntries: number; // Maximum number of cache entries
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  prefix: '@ettj_cache_',
  maxEntries: 100,
};

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  estimatedSizeBytes: number;
}

/**
 * Cache service class
 */
class CacheService {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get full storage key with prefix
   */
  private getStorageKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * Check if key is a cache key (has our prefix)
   */
  private isCacheKey(key: string): boolean {
    return key.startsWith(this.config.prefix);
  }

  /**
   * Get cached data by key
   * Returns null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const storageKey = this.getStorageKey(key);
      const raw = await AsyncStorage.getItem(storageKey);

      if (!raw) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(raw);

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        // Silently remove expired entry
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('[CacheService] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Get cached data with metadata
   * Useful for showing "cached from X minutes ago" messages
   */
  async getWithMetadata<T>(key: string): Promise<{
    data: T;
    timestamp: number;
    expiresAt: number;
    age: number;
  } | null> {
    try {
      const storageKey = this.getStorageKey(key);
      const raw = await AsyncStorage.getItem(storageKey);

      if (!raw) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(raw);

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.remove(key);
        return null;
      }

      return {
        data: entry.data,
        timestamp: entry.timestamp,
        expiresAt: entry.expiresAt,
        age: Date.now() - entry.timestamp,
      };
    } catch (error) {
      console.warn('[CacheService] Error reading cache with metadata:', error);
      return null;
    }
  }

  /**
   * Store data in cache with optional TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      const now = Date.now();
      const effectiveTTL = ttl ?? this.config.defaultTTL;

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + effectiveTTL,
        key,
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('[CacheService] Error writing cache:', error);
    }
  }

  /**
   * Remove a specific cache entry
   */
  async remove(key: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('[CacheService] Error removing cache entry:', error);
    }
  }

  /**
   * Check if a key exists in cache and is not expired
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => this.isCacheKey(k));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('[CacheService] Error clearing cache:', error);
    }
  }

  /**
   * Clean up expired cache entries
   * @returns Number of entries removed
   */
  async cleanExpired(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => this.isCacheKey(k));

      const keysToRemove: string[] = [];
      const now = Date.now();

      // Check each entry for expiration
      const entries = await AsyncStorage.multiGet(cacheKeys);
      for (const [key, raw] of entries) {
        if (raw) {
          try {
            const entry = JSON.parse(raw) as CacheEntry<unknown>;
            if (now > entry.expiresAt) {
              keysToRemove.push(key);
            }
          } catch {
            // Invalid JSON, remove it
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      return keysToRemove.length;
    } catch (error) {
      console.warn('[CacheService] Error cleaning expired entries:', error);
      return 0;
    }
  }

  /**
   * Get all cache keys (without prefix)
   */
  async getKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys
        .filter((k) => this.isCacheKey(k))
        .map((k) => k.replace(this.config.prefix, ''));
    } catch (error) {
      console.warn('[CacheService] Error getting cache keys:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => this.isCacheKey(k));
      const now = Date.now();

      let validEntries = 0;
      let expiredEntries = 0;
      let estimatedSizeBytes = 0;

      const entries = await AsyncStorage.multiGet(cacheKeys);
      for (const [, raw] of entries) {
        if (raw) {
          estimatedSizeBytes += raw.length * 2; // Approximate bytes (UTF-16)
          try {
            const entry = JSON.parse(raw) as CacheEntry<unknown>;
            if (now > entry.expiresAt) {
              expiredEntries++;
            } else {
              validEntries++;
            }
          } catch {
            expiredEntries++;
          }
        }
      }

      return {
        totalEntries: cacheKeys.length,
        validEntries,
        expiredEntries,
        estimatedSizeBytes,
      };
    } catch (error) {
      console.warn('[CacheService] Error getting cache stats:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        estimatedSizeBytes: 0,
      };
    }
  }

  /**
   * Get estimated cache size in a human-readable format
   */
  async getCacheSize(): Promise<string> {
    const stats = await this.getStats();
    const bytes = stats.estimatedSizeBytes;

    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}

// Cache key generators for common API endpoints
export const CacheKeys = {
  di1Data: (date: string) => `di1_${date}`,
  di1Summary: (date: string) => `di1_summary_${date}`,
  curveData: (date: string, method: string) => `curve_${date}_${method}`,
  workflow: (date: string, method: string) => `workflow_${date}_${method}`,
  methods: () => 'methods',
  health: () => 'health',
};

// Cache TTL presets (in milliseconds)
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
};

// Export singleton instance
export const cacheService = new CacheService();

// Export class for testing or custom instances
export { CacheService };

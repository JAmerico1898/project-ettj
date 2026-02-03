/**
 * Error logging service with persistence for debugging
 * Stores error logs in AsyncStorage with automatic cleanup
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiErrorCode } from '../types/errors';

/**
 * Error log entry
 */
export interface ErrorLog {
  id: string;
  timestamp: number;
  errorCode: ApiErrorCode | string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  appVersion?: string;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  maxLogs: number; // Maximum number of logs to keep
  storageKey: string; // AsyncStorage key for logs
  enableConsole: boolean; // Also log to console in dev mode
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  maxLogs: 100,
  storageKey: '@ettj_error_logs',
  enableConsole: __DEV__,
};

/**
 * Generate unique ID for log entries
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Error logger class
 */
class ErrorLogger {
  private config: LoggerConfig;
  private pendingLogs: ErrorLog[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the logger (loads existing logs)
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  /**
   * Log an error
   */
  async log(
    errorCode: ApiErrorCode | string,
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.initialize();

    const logEntry: ErrorLog = {
      id: generateId(),
      timestamp: Date.now(),
      errorCode,
      message,
      context,
    };

    // Extract stack trace if error is provided
    if (error instanceof Error) {
      logEntry.stack = error.stack;
    } else if (error) {
      logEntry.context = {
        ...logEntry.context,
        rawError: String(error),
      };
    }

    // Log to console in dev mode
    if (this.config.enableConsole) {
      console.error(`[ErrorLogger] ${errorCode}:`, message, {
        error,
        context,
      });
    }

    // Add to pending logs
    this.pendingLogs.push(logEntry);

    // Debounce flush to avoid too many storage writes
    this.scheduleFlush();
  }

  /**
   * Log an error from an Error object
   */
  async logError(error: Error, context?: Record<string, unknown>): Promise<void> {
    const errorCode = (error as { code?: string }).code || 'UNKNOWN_ERROR';
    await this.log(errorCode, error.message, error, context);
  }

  /**
   * Schedule a flush of pending logs
   */
  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(async () => {
      await this.flush();
    }, 1000); // Flush after 1 second of inactivity
  }

  /**
   * Flush pending logs to storage
   */
  private async flush(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    try {
      const logsToFlush = [...this.pendingLogs];
      this.pendingLogs = [];

      // Get existing logs
      const existingLogs = await this.getLogsFromStorage();

      // Combine and trim
      const allLogs = [...logsToFlush, ...existingLogs]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.config.maxLogs);

      // Save to storage
      await AsyncStorage.setItem(
        this.config.storageKey,
        JSON.stringify(allLogs)
      );
    } catch (error) {
      console.warn('[ErrorLogger] Failed to flush logs:', error);
      // Put logs back in pending queue
      this.pendingLogs = [...this.pendingLogs];
    }
  }

  /**
   * Get logs from storage
   */
  private async getLogsFromStorage(): Promise<ErrorLog[]> {
    try {
      const raw = await AsyncStorage.getItem(this.config.storageKey);
      if (!raw) return [];
      return JSON.parse(raw) as ErrorLog[];
    } catch {
      return [];
    }
  }

  /**
   * Get all logs
   */
  async getLogs(): Promise<ErrorLog[]> {
    await this.initialize();

    // Flush any pending logs first
    if (this.pendingLogs.length > 0) {
      await this.flush();
    }

    return this.getLogsFromStorage();
  }

  /**
   * Get logs filtered by error code
   */
  async getLogsByCode(errorCode: ApiErrorCode | string): Promise<ErrorLog[]> {
    const logs = await this.getLogs();
    return logs.filter((log) => log.errorCode === errorCode);
  }

  /**
   * Get logs from the last N hours
   */
  async getRecentLogs(hours: number = 24): Promise<ErrorLog[]> {
    const logs = await this.getLogs();
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return logs.filter((log) => log.timestamp > cutoff);
  }

  /**
   * Clear all logs
   */
  async clearLogs(): Promise<void> {
    this.pendingLogs = [];
    await AsyncStorage.removeItem(this.config.storageKey);
  }

  /**
   * Export logs as JSON string
   */
  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs as formatted text
   */
  async exportLogsAsText(): Promise<string> {
    const logs = await this.getLogs();
    const lines = logs.map((log) => {
      const date = new Date(log.timestamp).toISOString();
      const contextStr = log.context ? JSON.stringify(log.context) : '';
      return `[${date}] ${log.errorCode}: ${log.message}${contextStr ? ` | Context: ${contextStr}` : ''}${log.stack ? `\nStack: ${log.stack}` : ''}`;
    });
    return lines.join('\n\n');
  }

  /**
   * Get log statistics
   */
  async getStats(): Promise<{
    totalLogs: number;
    oldestLog: Date | null;
    newestLog: Date | null;
    errorCodeCounts: Record<string, number>;
  }> {
    const logs = await this.getLogs();

    if (logs.length === 0) {
      return {
        totalLogs: 0,
        oldestLog: null,
        newestLog: null,
        errorCodeCounts: {},
      };
    }

    const errorCodeCounts: Record<string, number> = {};
    logs.forEach((log) => {
      errorCodeCounts[log.errorCode] = (errorCodeCounts[log.errorCode] || 0) + 1;
    });

    const timestamps = logs.map((log) => log.timestamp);

    return {
      totalLogs: logs.length,
      oldestLog: new Date(Math.min(...timestamps)),
      newestLog: new Date(Math.max(...timestamps)),
      errorCodeCounts,
    };
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export class for testing or custom instances
export { ErrorLogger };

// Convenience function for quick logging
export async function logError(
  errorCode: ApiErrorCode | string,
  message: string,
  error?: Error | unknown,
  context?: Record<string, unknown>
): Promise<void> {
  return errorLogger.log(errorCode, message, error, context);
}

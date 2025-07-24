'use client';

import { z } from 'zod';

import { ValidationException } from '../lib/exceptions';

import { backendService } from './backendservice';
import { tryCatch } from './errorHandler';

// Types
export type LogType = 'telegram' | 'general' | 'error';
export type LogStatus = 'success' | 'error' | 'info';
export type LogContext = Record<string, unknown>;

// Constants
const MIN_POLLING_INTERVAL = 1000;
const DEFAULT_POLLING_INTERVAL = 10000;
const DEFAULT_LOG_LIMIT = 50;

// Validation schemas
export const LogEntrySchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  type: z.enum(['telegram', 'general', 'error']),
  status: z.enum(['success', 'error', 'info']),
  timestamp: z.string().datetime(),
  error: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export const CreateLogSchema = z.object({
  message: z.string().min(1, 'Pesan log tidak boleh kosong'),
  type: z.enum(['telegram', 'general', 'error']).default('general'),
  status: z.enum(['success', 'error', 'info']).default('info'),
  context: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

// Types from schemas
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type CreateLogInput = z.infer<typeof CreateLogSchema>;

/**
 * Validates log input parameters
 */
const validateLogInput = (
  message: string,
  type: LogType,
  status: LogStatus,
  context?: LogContext,
  error?: Error | string,
): CreateLogInput => {
  return CreateLogSchema.parse({
    message,
    type,
    status,
    context: context ?? {},
    error: error instanceof Error ? error.message : error,
  });
};

/**
 * Validates a single log entry
 */
const validateLogEntry = (log: unknown): LogEntry => {
  try {
    return LogEntrySchema.parse(log);
  } catch (validationError) {
    console.warn('Log entry tidak valid:', validationError, log);
    // Return original log as fallback
    return log as LogEntry;
  }
};

/**
 * Validates polling parameters
 */
const validatePollingParams = (
  limitCount: number,
  pollingInterval: number,
): void => {
  if (limitCount <= 0) {
    throw new ValidationException(
      'Jumlah log harus lebih besar dari 0',
      { limitCount },
    );
  }

  if (pollingInterval < MIN_POLLING_INTERVAL) {
    console.warn('Polling interval terlalu cepat, minimum 1000ms disarankan');
  }
};

/**
 * Adds new log to backend
 */
export const addLog = async (
  message: string,
  type: LogType = 'general',
  status: LogStatus = 'info',
  context?: LogContext,
  error?: Error | string,
): Promise<string> => {
  return tryCatch<string, string>(
    async () => {
      const logInput = validateLogInput(message, type, status, context, error);
      
      const response = await backendService.createLog(logInput);
      
      if (response.success !== true || response.data === null || response.data === undefined) {
        throw new ValidationException(
          'Gagal menambahkan log ke backend',
          { response },
        );
      }
      
      return response.data.id;
    },
    (error) => {
      // Handle error and log to console (but don't create new log to avoid loop)
      console.error('Error saat menambahkan log:', error);
      // Return empty string instead of throwing
      return '';
    },
  );
};

/**
 * Gets logs from backend with polling
 * 
 * Note: This implementation doesn't use real-time listeners because the Go backend
 * doesn't support such features. Instead, we use simple polling.
 */
export const getLogsWithListener = async (
  limitCount: number = DEFAULT_LOG_LIMIT,
  callback: (logs: LogEntry[]) => void,
  pollingInterval: number = DEFAULT_POLLING_INTERVAL,
): Promise<() => void> => {
  // Validate parameters
  validatePollingParams(limitCount, pollingInterval);
  
  // Function to fetch logs
  const fetchLogs = async (): Promise<undefined> => {
    await tryCatch<undefined, undefined>(
      async () => {
        const response = await backendService.getLogs();
        
        if (response.success === true && response.data !== null && response.data !== undefined) {
          // Validate log data
          const validatedLogs = response.data.map(validateLogEntry);
          callback(validatedLogs);
        } else {
          console.warn('Tidak ada data log yang diterima dari server');
          callback([]);
        }
        return undefined;
      },
      (error) => {
        console.error('Error saat mengambil log:', error);
        // Don't throw error here, just log to console and call callback with empty array
        callback([]);
        return undefined;
      },
    );
  };
  
  // Call once at the beginning
  void fetchLogs();
  
  // Setup polling with specified interval
  const intervalId = setInterval(() => {
    void fetchLogs();
  }, pollingInterval);
  
  // Return function to clean up interval
  return () => clearInterval(intervalId);
};
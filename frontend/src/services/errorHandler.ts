/**
 * @fileOverview Centralized error handling system for service layer.
 *
 * This file provides helper functions to handle errors consistently
 * across the service layer, including transforming API errors to AppExceptions.
 */

import {
  AppException,
  ValidationException,
  NotFoundException,
  InternalServerException,
} from '@/lib/exceptions';

import { ApiResponse } from './httpClient';

/**
 * Type for error handling callback
 */
export type ErrorHandler<T> = (error: unknown) => T;

// Constants for error detection
const NOT_FOUND_KEYWORDS = ['not found', 'tidak ditemukan'];
const VALIDATION_KEYWORDS = ['validation', 'validasi', 'invalid', 'tidak valid'];

/**
 * Checks if error message contains specific keywords
 */
const containsKeywords = (message: string, keywords: string[]): boolean => {
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Determines exception type based on error message patterns
 */
const determineExceptionType = (
  errorMessage: string,
  context?: Record<string, unknown>,
): AppException => {
  if (containsKeywords(errorMessage, NOT_FOUND_KEYWORDS)) {
    return new NotFoundException(errorMessage, context);
  }

  if (containsKeywords(errorMessage, VALIDATION_KEYWORDS)) {
    return new ValidationException(errorMessage, context);
  }

  // Default to InternalServerException
  return new InternalServerException(errorMessage, context);
};

/**
 * Transforms API response error to appropriate AppException
 */
export const transformApiError = (
  response: ApiResponse<unknown>,
  defaultMessage: string = 'Terjadi kesalahan pada server',
  context?: Record<string, unknown>,
): AppException => {
  // Use specific error message from API if available
  const errorMessage = response.error ?? response.message ?? defaultMessage;

  return determineExceptionType(errorMessage, context);
};

/**
 * Creates error context with original error information
 */
const createErrorContext = (
  error: Error,
  context?: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    ...context,
    originalError: error.message,
    stack: error.stack,
  };
};

/**
 * Handles service errors consistently across the service layer
 */
export const handleServiceError = (
  error: unknown,
  defaultMessage: string = 'Terjadi kesalahan pada server',
  context?: Record<string, unknown>,
): AppException => {
  // If error is already an AppException, return it directly
  if (error instanceof AppException) {
    return error;
  }

  // If error is a JavaScript Error
  if (error instanceof Error) {
    const errorContext = createErrorContext(error, context);
    return new InternalServerException(error.message || defaultMessage, errorContext);
  }

  // For unrecognized errors
  return new InternalServerException(defaultMessage, {
    ...context,
    originalError: String(error),
  });
};

/**
 * Wrapper function to execute functions and handle errors consistently
 */
export const tryCatch = async <T, R>(
  fn: () => Promise<T>,
  errorHandler: ErrorHandler<R>,
): Promise<T | R> => {
  try {
    return await fn();
  } catch (error) {
    return errorHandler(error);
  }
};
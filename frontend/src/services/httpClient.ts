'use client';

import axios, { 
  AxiosInstance, 
  AxiosResponse, 
  AxiosError, 
  InternalAxiosRequestConfig,
} from 'axios';

import { 
  AppException, 
  ValidationException, 
  NotFoundException, 
  InternalServerException,
} from '@/lib/exceptions';

// Interface definitions
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  errorCode?: string;
}

// Constants
const DEFAULT_API_URL = 'http://localhost:8080';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

// Create axios instance with default configuration
const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

/**
 * Creates AppException based on HTTP status code
 */
const createExceptionFromStatus = (
  status: number,
  message: string,
  errorCode: string,
  originalError?: AxiosError,
): AppException => {
  switch (status) {
    case 400:
      return new ValidationException(message, { errorCode, originalError });
    case 404:
      return new NotFoundException(message, { errorCode });
    case 500:
    default:
      return new InternalServerException(message, { errorCode, originalError });
  }
};

/**
 * Extracts error information from axios error response
 */
const extractErrorInfo = (errorData: Record<string, unknown>): { message: string; errorCode: string } => {
  const message = (errorData?.message as string) ?? 
                 (errorData?.error as string) ?? 
                 'Terjadi kesalahan pada server';
  const errorCode = (errorData?.errorCode as string) ?? 'UNKNOWN_ERROR';
  
  return { message, errorCode };
};

// Request interceptor
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add token or other headers if needed in the future
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  },
);

// Response interceptor
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle error globally
    console.error('API Error:', error);
    
    // Transform Axios error to AppException
    if (error.response !== undefined) {
      // Server responded with error status
      const { status } = error.response;
      const errorData = error.response.data as Record<string, unknown>;
      const { message, errorCode } = extractErrorInfo(errorData);
      
      const exception = createExceptionFromStatus(status, message, errorCode, error);
      return Promise.reject(exception);
    } 
    
    if (error.request !== undefined) {
      // Request was made but no response received
      return Promise.reject(new InternalServerException(
        'Tidak dapat terhubung ke server',
        { errorCode: 'SERVER_UNREACHABLE' },
      ));
    }
    
    // Error during request setup
    const errorMessage = (error instanceof Error && 
                         error.message !== undefined && 
                         error.message !== null && 
                         error.message !== "") === true
      ? error.message 
      : 'Terjadi kesalahan saat mempersiapkan request';
    
    return Promise.reject(new AppException(
      500,
      errorMessage,
      'REQUEST_SETUP_ERROR',
      { originalError: errorMessage },
    ));
  },
);

/**
 * Creates consistent API response
 */
export const createApiResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  statusCode?: number,
  errorCode?: string,
): ApiResponse<T> => {
  const response: ApiResponse<T> = { success };
  
  // Only add properties if they exist
  if (message !== undefined) {response.message = message;}
  if (error !== undefined) {response.error = error;}
  if (statusCode !== undefined) {response.statusCode = statusCode;}
  if (errorCode !== undefined) {response.errorCode = errorCode;}
  if (data !== undefined) {response.data = data;}
  
  return response;
};

/**
 * Handles API errors and creates appropriate response
 */
const handleApiError = <T>(error: unknown, defaultMessage: string): ApiResponse<T> => {
  if (error instanceof AppException) {
    return createApiResponse<T>(
      false,
      undefined,
      error.message,
      error.message,
      error.statusCode,
      error.errorCode,
    );
  }
  
  const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
  return createApiResponse<T>(
    false,
    undefined,
    defaultMessage,
    errorMessage,
    500,
  );
};

// API helper functions
export const api = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await httpClient.get<T>(url);
      return createApiResponse<T>(true, response.data, 'Data berhasil diambil');
    } catch (error: unknown) {
      return handleApiError<T>(error, 'Gagal mengambil data');
    }
  },

  async post<T, D = Record<string, unknown>>(
    url: string, 
    data: D,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await httpClient.post<T>(url, data);
      return createApiResponse<T>(true, response.data, 'Data berhasil dibuat');
    } catch (error: unknown) {
      return handleApiError<T>(error, 'Gagal membuat data');
    }
  },

  async put<T, D = Record<string, unknown>>(
    url: string, 
    data: D,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await httpClient.put<T>(url, data);
      return createApiResponse<T>(true, response.data, 'Data berhasil diperbarui');
    } catch (error: unknown) {
      return handleApiError<T>(error, 'Gagal memperbarui data');
    }
  },

  async patch<T, D = Record<string, unknown>>(
    url: string, 
    data: D,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await httpClient.patch<T>(url, data);
      return createApiResponse<T>(true, response.data, 'Data berhasil diperbarui');
    } catch (error: unknown) {
      return handleApiError<T>(error, 'Gagal memperbarui data');
    }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await httpClient.delete<T>(url);
      return createApiResponse<T>(true, response.data, 'Data berhasil dihapus');
    } catch (error: unknown) {
      return handleApiError<T>(error, 'Gagal menghapus data');
    }
  },
};

export default httpClient;
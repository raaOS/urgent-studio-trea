'use client';

import { z } from 'zod';

import { tryCatch } from './errorHandler';
import { api, ApiResponse } from './httpClient';

// Constants
const API_ENDPOINTS = {
  PING: '/api/ping',
  ORDERS: '/api/orders',
  SETTINGS: '/api/settings',
  LOGS: '/api/logs',
} as const;

// Zod schemas for backend data validation
export const BackendOrderSchema = z.object({
  id: z.string().uuid({ message: 'ID pesanan harus berupa UUID yang valid' }),
  customerName: z.string().optional(),
  customerEmail: z.string().email({ message: 'Email tidak valid' }).optional(),
  status: z.string(),
  totalAmount: z.number().nonnegative({ message: 'Total amount harus berupa angka positif' }),
  createdAt: z.string().datetime({ message: 'Format tanggal tidak valid' }),
  updatedAt: z.string().datetime({ message: 'Format tanggal tidak valid' }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerTelegram: z.string().optional(),
  briefs: z.array(z.unknown()).optional(),
  subtotal: z.number().optional(),
  handlingFee: z.number().optional(),
  uniqueCode: z.number().optional(),
});

export const BackendLogSchema = z.object({
  id: z.string().uuid({ message: 'ID log harus berupa UUID yang valid' }),
  message: z.string(),
  type: z.string(),
  status: z.string(),
  timestamp: z.string().datetime({ message: 'Format tanggal tidak valid' }),
  error: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

// Types
export type BackendOrder = z.infer<typeof BackendOrderSchema>;
export type BackendLog = z.infer<typeof BackendLogSchema>;

interface CustomerUpdateData {
  name: string;
  email: string;
  [key: string]: unknown;
}

interface OrderStatusUpdate {
  status: string;
  [key: string]: unknown;
}

interface PingResponse {
  message: string;
}

/**
 * Creates consistent error response
 */
const createErrorResponse = <T>(
  error: string,
  message: string,
  data?: T,
): ApiResponse<T> => {
  return {
    success: false,
    error,
    message,
    data: data as T,
  };
};

/**
 * Validates string parameter
 */
const validateStringParam = (value: string): boolean => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Validates object parameter
 */
const validateObjectParam = (value: unknown): boolean => {
  return value !== null && value !== undefined && typeof value === 'object';
};

/**
 * Validates order data with schema
 */
const validateOrderData = (orders: BackendOrder[]): void => {
  try {
    orders.forEach(order => {
      BackendOrderSchema.parse(order);
    });
  } catch (validationError) {
    console.warn('Validasi data order gagal:', validationError);
  }
};

/**
 * Validates single order data with schema
 */
const validateSingleOrderData = (order: BackendOrder): void => {
  try {
    BackendOrderSchema.parse(order);
  } catch (validationError) {
    console.warn('Validasi data order gagal:', validationError);
  }
};

/**
 * Validates log data with schema
 */
const validateLogData = (logs: BackendLog[]): void => {
  try {
    logs.forEach(log => {
      BackendLogSchema.parse(log);
    });
  } catch (validationError) {
    console.warn('Validasi data log gagal:', validationError);
  }
};

/**
 * Service class for communicating with Go backend
 */
class BackendService {
  /**
   * Ping backend to check connection
   */
  async ping(): Promise<ApiResponse<PingResponse>> {
    return tryCatch<ApiResponse<PingResponse>, ApiResponse<PingResponse>>(
      async () => api.get<PingResponse>(API_ENDPOINTS.PING),
      (error) => {
        console.error('Ping failed:', error);
        return createErrorResponse(
          'PING_FAILED',
          'Gagal terhubung ke server',
          { message: 'Server tidak merespons' },
        );
      },
    );
  }

  // === ORDER ENDPOINTS ===

  /**
   * Get all orders
   */
  async getOrders(): Promise<ApiResponse<BackendOrder[]>> {
    return tryCatch<ApiResponse<BackendOrder[]>, ApiResponse<BackendOrder[]>>(
      async () => {
        const response = await api.get<BackendOrder[]>(API_ENDPOINTS.ORDERS);

        if (response.success === true && response.data !== null && response.data !== undefined) {
          validateOrderData(response.data);
        }

        return response;
      },
      (error) => {
        console.error('Get orders failed:', error);
        return createErrorResponse('GET_ORDERS_FAILED', 'Gagal mendapatkan daftar pesanan', []);
      },
    );
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<ApiResponse<BackendOrder>> {
    if (!validateStringParam(id)) {
      return createErrorResponse(
        'INVALID_ORDER_ID',
        'ID pesanan tidak valid',
        {} as BackendOrder,
      );
    }

    return tryCatch<ApiResponse<BackendOrder>, ApiResponse<BackendOrder>>(
      async () => {
        const response = await api.get<BackendOrder>(`${API_ENDPOINTS.ORDERS}/${id}`);

        if (response.success === true && response.data !== null && response.data !== undefined) {
          validateSingleOrderData(response.data);
        }

        return response;
      },
      (error) => {
        console.error(`Get order ${id} failed:`, error);
        return createErrorResponse(
          'GET_ORDER_FAILED',
          `Gagal mendapatkan pesanan dengan ID ${id}`,
          {} as BackendOrder,
        );
      },
    );
  }

  /**
   * Create new order
   */
  async createOrder(orderData: Partial<BackendOrder>): Promise<ApiResponse<BackendOrder>> {
    return tryCatch<ApiResponse<BackendOrder>, ApiResponse<BackendOrder>>(
      async () => api.post<BackendOrder>(API_ENDPOINTS.ORDERS, orderData),
      (error) => {
        console.error('Create order failed:', error);
        return createErrorResponse(
          'CREATE_ORDER_FAILED',
          'Gagal membuat pesanan baru',
          {} as BackendOrder,
        );
      },
    );
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<BackendOrder>> {
    if (!validateStringParam(id)) {
      return createErrorResponse(
        'INVALID_ORDER_ID',
        'ID pesanan tidak valid',
        {} as BackendOrder,
      );
    }

    if (!validateStringParam(status)) {
      return createErrorResponse(
        'INVALID_STATUS',
        'Status pesanan tidak valid',
        {} as BackendOrder,
      );
    }

    const updateData: OrderStatusUpdate = { status };

    return tryCatch<ApiResponse<BackendOrder>, ApiResponse<BackendOrder>>(
      async () => api.put<BackendOrder>(`${API_ENDPOINTS.ORDERS}/${id}/status`, updateData),
      (error) => {
        console.error(`Update order status ${id} failed:`, error);
        return createErrorResponse(
          'UPDATE_STATUS_FAILED',
          `Gagal memperbarui status pesanan ${id}`,
          {} as BackendOrder,
        );
      },
    );
  }

  /**
   * Update customer information
   */
  async updateCustomerInfo(
    id: string,
    customerData: CustomerUpdateData,
  ): Promise<ApiResponse<BackendOrder>> {
    if (!validateStringParam(id)) {
      return createErrorResponse(
        'INVALID_ORDER_ID',
        'ID pesanan tidak valid',
        {} as BackendOrder,
      );
    }

    if (!validateObjectParam(customerData)) {
      return createErrorResponse(
        'INVALID_CUSTOMER_DATA',
        'Data pelanggan tidak valid',
        {} as BackendOrder,
      );
    }

    return tryCatch<ApiResponse<BackendOrder>, ApiResponse<BackendOrder>>(
      async () => api.put<BackendOrder>(`${API_ENDPOINTS.ORDERS}/${id}`, customerData),
      (error) => {
        console.error(`Update customer info ${id} failed:`, error);
        return createErrorResponse(
          'UPDATE_CUSTOMER_FAILED',
          `Gagal memperbarui informasi pelanggan untuk pesanan ${id}`,
          {} as BackendOrder,
        );
      },
    );
  }

  /**
   * Delete order
   */
  async deleteOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!validateStringParam(id)) {
      return createErrorResponse(
        'INVALID_ORDER_ID',
        'ID pesanan tidak valid',
        { message: 'ID pesanan tidak valid' },
      );
    }

    return tryCatch<ApiResponse<{ message: string }>, ApiResponse<{ message: string }>>(
      async () => api.delete<{ message: string }>(`${API_ENDPOINTS.ORDERS}/${id}`),
      (error) => {
        console.error(`Delete order ${id} failed:`, error);
        return createErrorResponse(
          'DELETE_ORDER_FAILED',
          `Gagal menghapus pesanan ${id}`,
          { message: `Gagal menghapus pesanan ${id}` },
        );
      },
    );
  }

  // === SETTINGS ENDPOINTS ===

  /**
   * Get settings
   */
  async getSettings(): Promise<ApiResponse<Record<string, unknown>>> {
    return tryCatch<ApiResponse<Record<string, unknown>>, ApiResponse<Record<string, unknown>>>(
      async () => api.get<Record<string, unknown>>(API_ENDPOINTS.SETTINGS),
      (error) => {
        console.error('Get settings failed:', error);
        return createErrorResponse(
          'GET_SETTINGS_FAILED',
          'Gagal mendapatkan pengaturan',
          {},
        );
      },
    );
  }

  /**
   * Update settings
   */
  async updateSettings(
    settings: Record<string, unknown>,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    if (!validateObjectParam(settings)) {
      return createErrorResponse(
        'INVALID_SETTINGS_DATA',
        'Data pengaturan tidak valid',
        {},
      );
    }

    return tryCatch<ApiResponse<Record<string, unknown>>, ApiResponse<Record<string, unknown>>>(
      async () => api.put<Record<string, unknown>>(API_ENDPOINTS.SETTINGS, settings),
      (error) => {
        console.error('Update settings failed:', error);
        return createErrorResponse(
          'UPDATE_SETTINGS_FAILED',
          'Gagal memperbarui pengaturan',
          {},
        );
      },
    );
  }

  // === LOG ENDPOINTS ===

  /**
   * Get all logs
   */
  async getLogs(): Promise<ApiResponse<BackendLog[]>> {
    return tryCatch<ApiResponse<BackendLog[]>, ApiResponse<BackendLog[]>>(
      async () => {
        const response = await api.get<BackendLog[]>(API_ENDPOINTS.LOGS);

        if (response.success === true && response.data !== null && response.data !== undefined) {
          validateLogData(response.data);
        }

        return response;
      },
      (error) => {
        console.error('Get logs failed:', error);
        return createErrorResponse(
          'GET_LOGS_FAILED',
          'Gagal mendapatkan daftar log',
          [],
        );
      },
    );
  }

  /**
   * Create new log
   */
  async createLog(logData: Partial<BackendLog>): Promise<ApiResponse<BackendLog>> {
    if (!validateObjectParam(logData)) {
      return createErrorResponse(
        'INVALID_LOG_DATA',
        'Data log tidak valid',
        {} as BackendLog,
      );
    }

    return tryCatch<ApiResponse<BackendLog>, ApiResponse<BackendLog>>(
      async () => api.post<BackendLog>(API_ENDPOINTS.LOGS, logData),
      (error) => {
        console.error('Create log failed:', error);
        return createErrorResponse(
          'CREATE_LOG_FAILED',
          'Gagal membuat log baru',
          {} as BackendLog,
        );
      },
    );
  }
}

export const backendService = new BackendService();
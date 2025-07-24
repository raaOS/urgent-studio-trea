'use client';

import {
  NotFoundException,
  ValidationException,
  AppException,
} from '@/lib/exceptions';
import {
  Order,
  Product,
  OrderSchema,
  OrderStatusEnum,
  Brief,
} from '@/lib/types';

import { backendService } from './backendservice';
import { handleServiceError, tryCatch } from './errorHandler';
import { CreateOrderSchema } from './validationSchemas';

// Types
interface BackendOrder {
  id: string;
  tier?: string;
  briefs?: Brief[];
  status: string;
  createdAt: string;
  updatedAt?: string;
  subtotal?: number;
  handlingFee?: number;
  uniqueCode?: number;
  totalAmount: number;
  statusHistory?: Record<string, string>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerTelegram?: string;
  customerAddress?: string;
}

interface CustomerData {
  name: string;
  phone: string;
  telegram: string;
}

interface BriefData {
  tier: string;
  instanceId: string;
  productId: string;
  productName: string;
  briefDetails: string;
  height?: number | string;
  width?: number | string;
  googleDriveAssetLinks?: string;
  unit?: string;
}

interface CreateOrderData {
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  handlingFee: number;
  uniqueCode: number;
  tier: string;
  briefs: BriefData[];
}

// Constants
const DEFAULT_TIER = 'standard';
const DEFAULT_HANDLING_FEE = 2500;
const UNIQUE_CODE_MIN = 100;
const UNIQUE_CODE_MAX = 999;
const MIN_BRIEF_DETAILS_LENGTH = 10;
const DEFAULT_BRIEF_DETAILS = 'Deskripsi cukup panjang';

/**
 * Validates required fields for BackendOrder
 */
const validateBackendOrder = (backendOrder: BackendOrder): void => {
  if (!backendOrder?.id) {
    throw new ValidationException('Data pesanan dari backend tidak lengkap', {
      backendOrder,
    });
  }
};

/**
 * Creates default status history if not provided
 */
const createDefaultStatusHistory = (
  status: string,
  createdAt: string,
  existingHistory?: Record<string, string>,
): Record<string, string> => {
  return existingHistory ?? { [status]: createdAt };
};

/**
 * Safely converts nullable/undefined string to empty string
 */
const safeStringValue = (value: string | null | undefined): string => {
  return value ?? '';
};

/**
 * Type guard to check if value is a valid object
 */
const isValidObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

/**
 * Type guard to check if value is a string
 */
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Type guard to check if value is a number
 */
const isNumber = (value: unknown): value is number => {
  return typeof value === 'number';
};

/**
 * Type guard to check if value is a non-empty string
 */
const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Converts backend order data to validated Order object
 */
const convertBackendOrderToOrder = (backendOrder: BackendOrder): Order => {
  validateBackendOrder(backendOrder);

  const plainData = {
    id: backendOrder.id,
    tier: safeStringValue(backendOrder.tier) || DEFAULT_TIER,
    briefs: backendOrder.briefs ?? [],
    status: backendOrder.status,
    createdAt: backendOrder.createdAt,
    updatedAt: backendOrder.updatedAt,
    subtotal: backendOrder.subtotal ?? backendOrder.totalAmount,
    handlingFee: backendOrder.handlingFee ?? 0,
    uniqueCode: backendOrder.uniqueCode ?? 0,
    totalAmount: backendOrder.totalAmount,
    statusHistory: createDefaultStatusHistory(
      backendOrder.status,
      backendOrder.createdAt,
      backendOrder.statusHistory,
    ),
    customerName: backendOrder.customerName,
    customerEmail: backendOrder.customerEmail,
    customerPhone: safeStringValue(backendOrder.customerPhone),
    customerTelegram: safeStringValue(backendOrder.customerTelegram),
    customerAddress: backendOrder.customerAddress ?? '',
  };

  const validation = OrderSchema.safeParse(plainData);
  if (!validation.success) {
    console.error(
      'Data backend tidak valid untuk Order:',
      validation.error.flatten(),
    );
    throw new ValidationException('Data pesanan dari backend tidak valid', {
      orderId: backendOrder.id,
      errors: validation.error.flatten(),
    });
  }

  return validation.data;
};

/**
 * Validates cart item fields
 */
const validateCartItem = (item: Product): void => {
  const requiredFields: Array<keyof Product> = ['id', 'name', 'price', 'tier'];
  const missingFields = requiredFields.filter(
    (field): boolean => {
      const value = item[field];
      return value === null || value === undefined || value === '';
    }
  );

  if (missingFields.length > 0) {
    throw new ValidationException('Item di keranjang tidak valid', {
      item,
      missingFields,
    });
  }
};

/**
 * Groups cart items by tier
 */
const groupCartByTier = (cart: Product[]): Record<string, Product[]> => {
  return cart.reduce((acc: Record<string, Product[]>, item: Product) => {
    acc[item.tier] ??= [];
    const tierArray = acc[item.tier];
    if (tierArray) {
      tierArray.push(item);
    }
    return acc;
  }, {});
};

/**
 * Calculates subtotal for items
 */
const calculateSubtotal = (items: Product[]): number => {
  return items.reduce(
    (sum: number, item: Product) => sum + (item.promoPrice ?? item.price),
    0,
  );
};

/**
 * Generates random unique code
 */
const generateUniqueCode = (): number => {
  return Math.floor(Math.random() * (UNIQUE_CODE_MAX - UNIQUE_CODE_MIN + 1)) + UNIQUE_CODE_MIN;
};

/**
 * Creates brief object from product
 */
const createBriefFromProduct = (item: Product): BriefData => {
  const briefData: BriefData = {
    instanceId: item.instanceId ?? `${item.id}-${Date.now()}`,
    productId: item.id,
    productName: item.name,
    tier: item.tier,
    briefDetails: (isString(item.briefDetails) && 
      item.briefDetails.length >= MIN_BRIEF_DETAILS_LENGTH)
      ? item.briefDetails 
      : DEFAULT_BRIEF_DETAILS,
  };

  // Add optional properties only if they have valid values
  if (isNonEmptyString(item.googleDriveAssetLinks)) {
    briefData.googleDriveAssetLinks = item.googleDriveAssetLinks;
  }
  
  if (isNumber(item.width) || isNonEmptyString(item.width)) {
    briefData.width = item.width;
  }
  
  if (isNumber(item.height) || isNonEmptyString(item.height)) {
    briefData.height = item.height;
  }
  
  if (isNonEmptyString(item.unit)) {
    briefData.unit = item.unit;
  }

  return briefData;
};

/**
 * Validates and normalizes brief data
 */
const validateAndNormalizeBrief = (brief: unknown): BriefData => {
  if (isValidObject(brief)) {
    const briefData: BriefData = {
      tier: isString(brief.tier) ? brief.tier : '',
      instanceId: isString(brief.instanceId) ? brief.instanceId : '',
      productId: isString(brief.productId) ? brief.productId : '',
      productName: isString(brief.productName) ? brief.productName : '',
      briefDetails: isString(brief.briefDetails) ? brief.briefDetails : '',
    };

    // Add optional properties only if they have valid values
    if ((isNumber(brief.height) || isNonEmptyString(brief.height)) === true) {
      briefData.height = brief.height as number | string;
    }
    
    if ((isNumber(brief.width) || isNonEmptyString(brief.width)) === true) {
      briefData.width = brief.width as number | string;
    }
    
    if (isString(brief.googleDriveAssetLinks)) {
      briefData.googleDriveAssetLinks = brief.googleDriveAssetLinks;
    }
    
    if (isString(brief.unit)) {
      briefData.unit = brief.unit;
    }

    return briefData;
  }
  
  return {
    tier: '',
    instanceId: '',
    productId: '',
    productName: '',
    briefDetails: '',
  };
};

/**
 * Validates customer data
 */
const validateCustomerData = (customerData: CustomerData): void => {
  const { name, phone, telegram } = customerData;
  
  if (!name || !phone || !telegram) {
    throw new ValidationException(
      'Nama, telepon, dan telegram wajib diisi.',
      { customerData },
    );
  }
};

/**
 * Creates multiple orders from cart, splitting by service tier
 */
export const createMultipleOrdersFromCart = async (
  cart: Product[],
): Promise<string[]> => {
  return tryCatch<string[], never>(
    async (): Promise<string[]> => {
      // Validate input
      if ((cart?.length ?? 0) === 0) {
        throw new ValidationException('Keranjang tidak boleh kosong', { cart });
      }

      // Validate each cart item
      cart.forEach((item: Product): void => validateCartItem(item));

      const orderIds: string[] = [];
      const cartByTier = groupCartByTier(cart);

      for (const [tier, itemsInTier] of Object.entries(cartByTier)) {
        if (!itemsInTier || itemsInTier.length === 0) {
          continue;
        }

        const subtotal = calculateSubtotal(itemsInTier);
        const handlingFee = DEFAULT_HANDLING_FEE;
        const uniqueCode = generateUniqueCode();
        const totalAmount = subtotal + handlingFee + uniqueCode;

        const orderData: CreateOrderData = {
          customerName: '',
          customerEmail: '',
          status: 'Menunggu Pembayaran',
          totalAmount,
          subtotal,
          handlingFee,
          uniqueCode,
          tier,
          briefs: itemsInTier.map((item: Product): BriefData => createBriefFromProduct(item)),
        };

        const parsedOrderData = CreateOrderSchema.parse(orderData);
        const response = await backendService.createOrder(parsedOrderData);

        if (!response.success || !response.data) {
          throw new ValidationException(
            response.error ?? 'Gagal membuat pesanan',
            { response },
          );
        }

        orderIds.push(response.data.id);
      }

      return orderIds;
    },
    (error): never => {
      throw handleServiceError(error, 'Gagal menyimpan pesanan ke backend');
    },
  );
};

/**
 * Gets order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  return tryCatch<Order | null, never>(
    async (): Promise<Order | null> => {
      const response = await backendService.getOrderById(orderId);
      
      if (!response.success || !response.data) {
        return null;
      }

      const orderData = response.data;

      // Validate and normalize briefs if present
      if (Array.isArray(orderData.briefs)) {
        orderData.briefs = orderData.briefs.map(validateAndNormalizeBrief);
      }

      // Type assertion with validation
      if (!isValidObject(orderData)) {
        throw new ValidationException('Data pesanan tidak valid dari backend');
      }

      const orderDataTyped = orderData as Record<string, unknown>;
        
        const backendOrder: BackendOrder = {
          id: isString(orderDataTyped.id) ? orderDataTyped.id : '',
          ...(isString(orderDataTyped.tier) && { tier: orderDataTyped.tier }),
          ...(Array.isArray(orderDataTyped.briefs) && { briefs: orderDataTyped.briefs as Brief[] }),
          status: isString(orderDataTyped.status) ? orderDataTyped.status : '',
          createdAt: isString(orderDataTyped.createdAt) ? orderDataTyped.createdAt : '',
          ...(isString(orderDataTyped.updatedAt) && { updatedAt: orderDataTyped.updatedAt }),
          ...(isNumber(orderDataTyped.subtotal) && { subtotal: orderDataTyped.subtotal }),
          ...(isNumber(orderDataTyped.handlingFee) && { handlingFee: orderDataTyped.handlingFee }),
          ...(isNumber(orderDataTyped.uniqueCode) && { uniqueCode: orderDataTyped.uniqueCode }),
          totalAmount: isNumber(orderDataTyped.totalAmount) ? orderDataTyped.totalAmount : 0,
          ...(isValidObject(orderDataTyped.statusHistory) && { statusHistory: orderDataTyped.statusHistory as Record<string, string> }),
          ...(isString(orderDataTyped.customerName) && { customerName: orderDataTyped.customerName }),
          ...(isString(orderDataTyped.customerEmail) && { customerEmail: orderDataTyped.customerEmail }),
          ...(isString(orderDataTyped.customerPhone) && { customerPhone: orderDataTyped.customerPhone }),
          ...(isString(orderDataTyped.customerTelegram) && { customerTelegram: orderDataTyped.customerTelegram }),
          ...(isString(orderDataTyped.customerAddress) && { customerAddress: orderDataTyped.customerAddress }),
        };

      return convertBackendOrderToOrder(backendOrder);
    },
    (error): never => {
      throw handleServiceError(error, 'Gagal mengambil data pesanan dari backend.');
    },
  );
};

/**
 * Gets all orders from backend
 */
export const getAllOrders = async (): Promise<Order[]> => {
  return tryCatch<Order[], never>(
    async (): Promise<Order[]> => {
      const response = await backendService.getOrders();
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map((backendOrderData: unknown): Order => {
        if (!isValidObject(backendOrderData)) {
          throw new ValidationException('Data pesanan tidak valid dari backend');
        }

        // Validate and normalize briefs if present
        if (Array.isArray(backendOrderData.briefs)) {
          backendOrderData.briefs = backendOrderData.briefs.map(validateAndNormalizeBrief);
        }
        
        const backendOrder: BackendOrder = {
          id: isString(backendOrderData.id) ? backendOrderData.id : '',
          ...(isString(backendOrderData.tier) && { tier: backendOrderData.tier }),
          ...(Array.isArray(backendOrderData.briefs) && { briefs: backendOrderData.briefs as Brief[] }),
          status: isString(backendOrderData.status) ? backendOrderData.status : '',
          createdAt: isString(backendOrderData.createdAt) ? backendOrderData.createdAt : '',
          ...(isString(backendOrderData.updatedAt) && { updatedAt: backendOrderData.updatedAt }),
          ...(isNumber(backendOrderData.subtotal) && { subtotal: backendOrderData.subtotal }),
          ...(isNumber(backendOrderData.handlingFee) && { handlingFee: backendOrderData.handlingFee }),
          ...(isNumber(backendOrderData.uniqueCode) && { uniqueCode: backendOrderData.uniqueCode }),
          totalAmount: isNumber(backendOrderData.totalAmount) ? backendOrderData.totalAmount : 0,
          ...(isValidObject(backendOrderData.statusHistory) && { statusHistory: backendOrderData.statusHistory as Record<string, string> }),
          ...(isString(backendOrderData.customerName) && { customerName: backendOrderData.customerName }),
          ...(isString(backendOrderData.customerEmail) && { customerEmail: backendOrderData.customerEmail }),
          ...(isString(backendOrderData.customerPhone) && { customerPhone: backendOrderData.customerPhone }),
          ...(isString(backendOrderData.customerTelegram) && { customerTelegram: backendOrderData.customerTelegram }),
          ...(isString(backendOrderData.customerAddress) && { customerAddress: backendOrderData.customerAddress }),
        };
        
        return convertBackendOrderToOrder(backendOrder);
      });
    },
    (error): never => {
      throw handleServiceError(error, 'Gagal mengambil data pesanan dari backend.');
    },
  );
};

/**
 * Updates order with customer information
 */
export const updateOrderWithCustomerInfo = async (
  orderId: string,
  customerData: CustomerData,
): Promise<void> => {
  await tryCatch(
    async (): Promise<void> => {
      if (!orderId) {
        throw new ValidationException('ID Pesanan wajib diisi.');
      }

      validateCustomerData(customerData);

      // Send update to backend
      // Note: Backend currently only accepts name and email, so we use telegram as email temporarily
      const response = await backendService.updateCustomerInfo(orderId, {
        name: customerData.name,
        email: customerData.telegram, // Use telegram as email temporarily
      });

      if (!response.success) {
        throw new Error(response.error ?? 'Gagal memperbarui info pelanggan');
      }
    },
    (error): AppException => {
      if (error instanceof Error && error.message.includes('not found')) {
        return new NotFoundException(
          `Pesanan dengan ID ${orderId} tidak ditemukan.`,
          { orderId },
        );
      }
      return handleServiceError(
        error,
        'Gagal memperbarui info pelanggan di backend.',
      );
    },
  );
};

/**
 * Updates order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
): Promise<void> => {
  await tryCatch(
    async (): Promise<void> => {
      const validatedStatus = OrderStatusEnum.safeParse(status);
      
      if (!orderId || !validatedStatus.success) {
        throw new ValidationException(
          'ID Pesanan dan status baru yang valid wajib diisi.',
        );
      }

      const response = await backendService.updateOrderStatus(orderId, status);

      if (!response.success) {
        throw new Error(response.error ?? 'Gagal memperbarui status pesanan');
      }
    },
    (error): AppException => {
      if (error instanceof Error && error.message.includes('not found')) {
        return new NotFoundException(
          `Pesanan dengan ID ${orderId} tidak ditemukan.`,
          { orderId },
        );
      }
      return handleServiceError(
        error,
        'Gagal memperbarui status pesanan di backend.',
      );
    },
  );
};

/**
 * Confirms payment for order IDs
 */
export const confirmPayment = async (orderIds: string[]): Promise<void> => {
  await tryCatch(
    async (): Promise<void> => {
      if ((orderIds?.length ?? 0) === 0) {
        throw new ValidationException('Daftar ID Pesanan tidak boleh kosong.');
      }

      const newStatus = 'Pembayaran Sedang Diverifikasi';

      // Verify all orders exist
      await Promise.all(
        orderIds.map(async (id): Promise<Order | null> => {
          const order = await getOrderById(id);
          if (!order) {
            throw new NotFoundException(
              `Pesanan dengan ID ${id} tidak ditemukan saat konfirmasi.`,
            );
          }
          return order;
        }),
      );

      // Update status for each order
      await Promise.all(
        orderIds.map((orderId): Promise<void> => 
          updateOrderStatus(orderId, newStatus),
        ),
      );
    },
    (error): AppException => {
      if (error instanceof NotFoundException) {
        return error;
      }
      return handleServiceError(
        error,
        'Gagal memperbarui status pesanan di backend.',
      );
    },
  );
};

/**
 * Deletes an order
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  await tryCatch(
    async (): Promise<void> => {
      if (!orderId) {
        throw new ValidationException('ID Pesanan wajib diisi.');
      }

      const response = await backendService.deleteOrder(orderId);

      if (!response.success) {
        throw new Error(response.error ?? 'Gagal menghapus pesanan');
      }
    },
    (error): AppException => {
      if (error instanceof Error && error.message.includes('not found')) {
        return new NotFoundException(
          `Pesanan dengan ID ${orderId} tidak ditemukan.`,
          { orderId },
        );
      }
      return handleServiceError(error, 'Gagal menghapus pesanan di backend.');
    },
  );
};
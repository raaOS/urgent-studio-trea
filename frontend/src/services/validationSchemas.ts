/**
 * @fileOverview Centralized validation schemas for service layer.
 * 
 * This file provides Zod validation schemas used throughout the service layer
 * to ensure consistency in data input and output validation.
 */

import { z } from 'zod';

import { OrderSchema, OrderStatusEnum, ProductSchema, BriefSchema } from '@/lib/types';

// Constants for validation
const MIN_NAME_LENGTH = 3;
const MIN_PHONE_LENGTH = 10;
const MIN_TELEGRAM_LENGTH = 3;
const MIN_ADDRESS_LENGTH = 10;
const MIN_ORDER_IDS = 1;

/**
 * Schema for validating customer data on orders
 */
export const CustomerInfoSchema = z.object({
  name: z.string().min(MIN_NAME_LENGTH, { 
    message: `Nama harus minimal ${MIN_NAME_LENGTH} karakter` 
  }),
  phone: z.string().min(MIN_PHONE_LENGTH, { 
    message: `Nomor telepon harus minimal ${MIN_PHONE_LENGTH} digit` 
  }),
  telegram: z.string().min(MIN_TELEGRAM_LENGTH, { 
    message: `Username Telegram harus minimal ${MIN_TELEGRAM_LENGTH} karakter` 
  }),
  address: z.string().min(MIN_ADDRESS_LENGTH, { 
    message: `Alamat harus minimal ${MIN_ADDRESS_LENGTH} karakter` 
  }),
});

/**
 * Schema for validating order status updates
 */
export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid({ 
    message: 'ID pesanan harus berupa UUID yang valid' 
  }),
  status: OrderStatusEnum,
  notes: z.string().optional(),
});

/**
 * Schema for validating payment confirmation
 */
export const ConfirmPaymentSchema = z.object({
  orderIds: z.array(
    z.string().uuid({ 
      message: 'ID pesanan harus berupa UUID yang valid' 
    })
  ).min(MIN_ORDER_IDS, { 
    message: `Minimal harus ada ${MIN_ORDER_IDS} ID pesanan` 
  }),
  paymentProofUrl: z.string().url({ 
    message: 'URL bukti pembayaran tidak valid' 
  }).optional(),
  notes: z.string().optional(),
});

/**
 * Schema for brief validation in order creation - using Record<string, string> instead of z.record(z.string())
 */
const BriefCreateSchema = z.object({
  instanceId: z.string(),
  productId: z.string(),
  productName: z.string(),
  tier: z.string(),
  briefDetails: z.union([
    z.string(),
    z.record(z.string(), z.string()) // This allows Record<string, string>
  ]),
  googleDriveAssetLinks: z.array(z.string()).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  unit: z.string().optional(),
});

/**
 * Schema for validating order creation
 */
export const CreateOrderSchema = z.object({
  tier: z.string().min(1, { message: 'Tier harus diisi' }),
  briefs: z.array(BriefCreateSchema),
  subtotal: z.number().nonnegative({ 
    message: 'Subtotal harus berupa angka non-negatif' 
  }),
  handlingFee: z.number().nonnegative({ 
    message: 'Biaya penanganan harus berupa angka non-negatif' 
  }),
  uniqueCode: z.number().int().nonnegative({ 
    message: 'Kode unik harus berupa bilangan bulat non-negatif' 
  }),
  totalAmount: z.number().nonnegative({ 
    message: 'Total amount harus berupa angka non-negatif' 
  }),
  customerInfo: CustomerInfoSchema.optional(),
  // Add these required fields for backend compatibility
  customerName: z.string().default(''),
  customerEmail: z.string().default(''),
  status: z.string().default('Menunggu Pembayaran'),
});

// Type exports
export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;
export type ConfirmPayment = z.infer<typeof ConfirmPaymentSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;

// Re-export schemas from types.ts for convenience
export { OrderSchema, ProductSchema, BriefSchema };
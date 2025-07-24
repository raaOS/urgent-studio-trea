'use client';

import { z } from 'zod';

import { ValidationException } from '../lib/exceptions';

import { backendService } from './backendservice';
import { tryCatch } from './errorHandler';

// Constants
const MIN_VALUE = 0;

// Validation schema for settings
export const ControlSettingsSchema = z.object({
  productLimitWeekly: z.number().int().nonnegative({
    message: 'Batas produk mingguan harus berupa angka non-negatif'
  }),
  revenueTarget: z.number().nonnegative({
    message: 'Target pendapatan harus berupa angka non-negatif'
  })
});

// Type for settings based on Zod schema
export type ControlSettings = z.infer<typeof ControlSettingsSchema>;

// Default values for settings
export const DEFAULT_SETTINGS: ControlSettings = {
  productLimitWeekly: 0,
  revenueTarget: 0
};

/**
 * Validates if a value is a valid number and non-negative
 */
const isValidNonNegativeNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value >= MIN_VALUE;
};

/**
 * Safely extracts valid settings from response data
 */
const extractValidSettings = (data: Record<string, unknown>): ControlSettings => {
  const settings = { ...DEFAULT_SETTINGS };

  // Extract valid productLimitWeekly
  if (isValidNonNegativeNumber(data.productLimitWeekly)) {
    settings.productLimitWeekly = data.productLimitWeekly;
  }

  // Extract valid revenueTarget
  if (isValidNonNegativeNumber(data.revenueTarget)) {
    settings.revenueTarget = data.revenueTarget;
  }

  return settings;
};

/**
 * Validates settings data with schema
 */
const validateSettingsData = (data: Record<string, unknown>): ControlSettings => {
  try {
    return ControlSettingsSchema.parse(data);
  } catch (validationError) {
    console.warn('Data pengaturan tidak valid:', validationError);
    // If validation fails, try to extract valid values and use defaults for invalid ones
    return extractValidSettings(data);
  }
};

/**
 * Gets control settings from backend
 * 
 * @returns Promise with validated control settings
 * @throws AppException if unhandleable error occurs
 */
export const getControlSettings = async (): Promise<ControlSettings> => {
  return tryCatch<ControlSettings, ControlSettings>(
    async () => {
      const response = await backendService.getSettings();

      if (response.success !== true || response.data === null || response.data === undefined) {
        console.warn('Tidak ada data pengaturan yang diterima dari server, menggunakan nilai default');
        return DEFAULT_SETTINGS;
      }

      return validateSettingsData(response.data);
    },
    (error) => {
      console.error('Gagal mengambil pengaturan dari backend:', error);
      // Return default values if error occurs
      return DEFAULT_SETTINGS;
    }
  );
};

/**
 * Updates control settings in backend
 * 
 * @param settings - Control settings to be updated
 * @returns Promise with success status
 * @throws AppException if validation fails or unhandleable error occurs
 */
export const updateControlSettings = async (settings: ControlSettings): Promise<boolean> => {
  return tryCatch<boolean, boolean>(
    async () => {
      // Validate settings before sending to backend
      const validatedSettings = ControlSettingsSchema.parse(settings);

      // Send to backend
      const response = await backendService.updateSettings(validatedSettings);

      if (response.success !== true) {
        throw new ValidationException(
          'Gagal memperbarui pengaturan di backend',
          { response }
        );
      }

      return true;
    },
    (error) => {
      // Handle error
      console.error('Gagal memperbarui pengaturan di backend:', error);

      // Return false instead of throwing
      return false;
    }
  );
};
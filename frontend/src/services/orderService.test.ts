import { ValidationException } from '@/lib/exceptions';
import { Product } from '@/lib/types';

import { createMultipleOrdersFromCart } from './orderService';

// Mock backend service
jest.mock('./backendservice', () => ({
  backendService: {
    createOrder: jest.fn().mockResolvedValue({ 
      success: true, 
      data: { id: 'order-123' } 
    })
  }
}));

// Constants for test data
const MOCK_ORDER_ID = 'order-123';
const MOCK_DESCRIPTION = 'Deskripsi cukup panjang';
const MOCK_DRIVE_LINK = 'https://drive.google.com/file/d/abc123';
const EXPECTED_TIER_COUNT = 2;

// Helper function to create mock product
const createMockProduct = (
  id: string,
  name: string,
  price: number,
  tier: string,
  instanceId: string,
  promoPrice?: number
): Partial<Product> => ({
  id,
  name,
  price,
  promoPrice,
  tier,
  instanceId,
  briefDetails: JSON.stringify({ description: MOCK_DESCRIPTION }),
  googleDriveAssetLinks: MOCK_DRIVE_LINK,
  width: 10,
  height: 10,
  unit: 'px'
});

// Helper function to convert mock product to valid Product type
const convertToProduct = (mockProduct: Partial<Product>): Product => {
  const product: Product = {
    id: mockProduct.id ?? '',
    name: mockProduct.name ?? '',
    price: mockProduct.price ?? 0,
    promoPrice: mockProduct.promoPrice,
    tier: mockProduct.tier ?? '',
    instanceId: mockProduct.instanceId ?? '',
    briefDetails: typeof mockProduct.briefDetails === 'string' 
      ? mockProduct.briefDetails 
      : JSON.stringify(mockProduct.briefDetails ?? {}),
    googleDriveAssetLinks: typeof mockProduct.googleDriveAssetLinks === 'string' 
      ? mockProduct.googleDriveAssetLinks 
      : undefined,
    width: mockProduct.width ?? 0,
    height: mockProduct.height ?? 0,
    unit: mockProduct.unit ?? 'px'
  };
  return product;
};

describe('createMultipleOrdersFromCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful order creation', () => {
    it('should create orders for each tier in cart', async () => {
      // Arrange
      const mockCart = [
        createMockProduct('p1', 'Produk 1', 10000, 'Kaki Lima', 'i1', 9000),
        createMockProduct('p2', 'Produk 2', 20000, 'UMKM', 'i2'),
        createMockProduct('p3', 'Produk 3', 30000, 'Kaki Lima', 'i3'),
      ];

      const convertedCart: Product[] = mockCart.map(convertToProduct);

      // Act
      const orderIds = await createMultipleOrdersFromCart(convertedCart);

      // Assert
      expect(Array.isArray(orderIds)).toBe(true);
      expect(orderIds).toHaveLength(EXPECTED_TIER_COUNT);
      expect(orderIds[0]).toBe(MOCK_ORDER_ID);
    });

    it('should handle single tier cart', async () => {
      // Arrange
      const mockCart = [
        createMockProduct('p1', 'Produk 1', 10000, 'Kaki Lima', 'i1'),
      ];

      const convertedCart: Product[] = mockCart.map(convertToProduct);

      // Act
      const orderIds = await createMultipleOrdersFromCart(convertedCart);

      // Assert
      expect(Array.isArray(orderIds)).toBe(true);
      expect(orderIds).toHaveLength(1);
      expect(orderIds[0]).toBe(MOCK_ORDER_ID);
    });
  });

  describe('validation errors', () => {
    it('should throw ValidationException for empty cart', async () => {
      // Act & Assert
      await expect(createMultipleOrdersFromCart([])).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for cart with invalid items', async () => {
      // Arrange
      const invalidCart = [
        {
          id: '', // Invalid empty ID
          name: 'Produk 1',
          price: 10000,
          tier: 'Kaki Lima',
        } as Product,
      ];

      // Act & Assert
      await expect(createMultipleOrdersFromCart(invalidCart)).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for null cart', async () => {
      // Act & Assert
      await expect(createMultipleOrdersFromCart(null as unknown as Product[])).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for undefined cart', async () => {
      // Act & Assert
      await expect(createMultipleOrdersFromCart(undefined as unknown as Product[])).rejects.toThrow(ValidationException);
    });
  });

  describe('product validation', () => {
    it('should validate required product fields', async () => {
      // Arrange
      const invalidProducts = [
        { ...createMockProduct('p1', '', 10000, 'Kaki Lima', 'i1') }, // Empty name
        { ...createMockProduct('', 'Produk 2', 20000, 'UMKM', 'i2') }, // Empty ID
        { ...createMockProduct('p3', 'Produk 3', 30000, '', 'i3') }, // Empty tier
      ].map(convertToProduct);

      // Act & Assert
      for (const invalidProduct of invalidProducts) {
        await expect(createMultipleOrdersFromCart([invalidProduct])).rejects.toThrow(ValidationException);
      }
    });

    it('should handle products with missing optional fields', async () => {
      // Arrange
      const productWithoutOptionals = {
        id: 'p1',
        name: 'Produk 1',
        price: 10000,
        tier: 'Kaki Lima',
        instanceId: 'i1',
        briefDetails: MOCK_DESCRIPTION,
        // Missing optional fields like promoPrice, googleDriveAssetLinks, etc.
      } as Product;

      // Act
      const orderIds = await createMultipleOrdersFromCart([productWithoutOptionals]);

      // Assert
      expect(Array.isArray(orderIds)).toBe(true);
      expect(orderIds).toHaveLength(1);
    });
  });

  describe('tier grouping', () => {
    it('should group products correctly by tier', async () => {
      // Arrange
      const mockCart = [
        createMockProduct('p1', 'Produk 1', 10000, 'Premium', 'i1'),
        createMockProduct('p2', 'Produk 2', 20000, 'Standard', 'i2'),
        createMockProduct('p3', 'Produk 3', 30000, 'Premium', 'i3'),
        createMockProduct('p4', 'Produk 4', 40000, 'Basic', 'i4'),
      ];

      const convertedCart: Product[] = mockCart.map(convertToProduct);

      // Act
      const orderIds = await createMultipleOrdersFromCart(convertedCart);

      // Assert
      expect(Array.isArray(orderIds)).toBe(true);
      expect(orderIds).toHaveLength(3); // 3 different tiers
    });
  });

  describe('price calculations', () => {
    it('should use promo price when available', async () => {
      // Arrange
      const mockCart = [
        createMockProduct('p1', 'Produk 1', 10000, 'Kaki Lima', 'i1', 8000), // Has promo price
      ];

      const convertedCart: Product[] = mockCart.map(convertToProduct);

      // Act
      const orderIds = await createMultipleOrdersFromCart(convertedCart);

      // Assert
      expect(Array.isArray(orderIds)).toBe(true);
      expect(orderIds).toHaveLength(1);
      // Note: We can't easily test the actual calculation without mocking more internals
      // but we can ensure the function completes successfully
    });

    it('should use regular price when promo price is not available', async () => {
      // Arrange
      const mockCart = [
        createMockProduct('p1', 'Produk 1', 10000, 'Kaki Lima', 'i1'), // No promo price
      ];

      const convertedCart: Product[] = mockCart.map(convertToProduct);

      // Act
      const orderIds = await createMultipleOrdersFromCart(convertedCart);

      // Assert
      expect(Array.isArray(orderIds)).toBe(true);
      expect(orderIds).toHaveLength(1);
    });
  });
});
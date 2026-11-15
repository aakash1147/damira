/**
 * DAMIRA Synthetic Business Data Generation Configuration
 * Configurable parameters and statistical weights for realistic BI testing.
 */

export interface SyntheticConfig {
  batchId: string;
  seed: number;
  customerTarget: number;
  addressTarget: number;
  orderTarget: number;
  minItemsPerOrder: number;
  maxItemsPerOrder: number;
  startDate: Date;
  endDate: Date;
  customerPrefix: string;
  orderPrefix: string;
  tagMarker: string;

  // Distributions
  addressCountDistribution: { count: number; weight: number }[];
  orderFrequencyDistribution: { orderRange: [number, number]; weight: number }[];
  salesChannelWeights: Record<string, number>;
  orderStatusWeights: Record<string, number>;
  customerTypeWeights: Record<string, number>;
}

export const DEFAULT_SYNTHETIC_CONFIG: SyntheticConfig = {
  batchId: 'BATCH-2026-GEO-ANALYTICS',
  seed: 42091,
  customerTarget: 1700,
  addressTarget: 2350,
  orderTarget: 3200,
  minItemsPerOrder: 1,
  maxItemsPerOrder: 4,
  startDate: new Date('2025-11-15T00:00:00.000Z'),
  endDate: new Date('2026-11-15T23:59:59.999Z'),
  customerPrefix: 'CUST-SYN-',
  orderPrefix: 'ORD-SYN-',
  tagMarker: '[SYNTHETIC-DATA-BATCH-2026]',

  // ~65% 1 address, ~25% 2 addresses, ~10% 3+ addresses
  addressCountDistribution: [
    { count: 1, weight: 65 },
    { count: 2, weight: 25 },
    { count: 3, weight: 8 },
    { count: 4, weight: 2 },
  ],

  // ~25% 0 orders, ~35% 1 order, ~25% 2-3 orders, ~15% 4+ orders
  orderFrequencyDistribution: [
    { orderRange: [0, 0], weight: 25 }, // No orders (lead / prospect)
    { orderRange: [1, 1], weight: 35 }, // Single purchase
    { orderRange: [2, 3], weight: 25 }, // Repeat buyer
    { orderRange: [4, 7], weight: 15 }, // High loyalty / commercial buyer
  ],

  // Channels: Own Website (30%), Amazon (25%), Flipkart (15%), Instagram (10%), WhatsApp (10%), Offline (5%), Bulk (5%)
  salesChannelWeights: {
    WEBSITE: 30,
    AMAZON: 25,
    FLIPKART: 15,
    INSTAGRAM: 10,
    WHATSAPP: 10,
    OFFLINE: 5,
    BULK: 5,
  },

  // Order status distribution
  orderStatusWeights: {
    DELIVERED: 75,
    SHIPPED: 8,
    PROCESSING: 5,
    CONFIRMED: 4,
    CANCELLED: 3,
    RETURNED: 3,
    REFUNDED: 2,
  },

  // Customer type distribution
  customerTypeWeights: {
    INDIVIDUAL: 65,
    RETAILER: 15,
    WHOLESALER: 8,
    DISTRIBUTOR: 5,
    CORPORATE: 4,
    BULK_BUYER: 3,
  },
};

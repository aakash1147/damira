/**
 * DAMIRA Product & Variant Catalog for synthetic sales generation
 */

export interface VariantDefinition {
  name: string;
  sku: string;
  weightGrams: number;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  packagingCost: number;
}

export interface ProductDefinition {
  name: string;
  sku: string;
  categoryName: string;
  categoryCode: string;
  description: string;
  variants: VariantDefinition[];
}

export const SYNTHETIC_PRODUCT_CATALOG: ProductDefinition[] = [
  {
    name: 'DAMIRA Pure Organic Mango Fruit Powder',
    sku: 'DAM-MNG-PWD',
    categoryName: 'Fruit Powders',
    categoryCode: 'FRUIT_POWDERS',
    description: '100% natural spray-dried Alphonso mango powder, no added sugar or preservatives.',
    variants: [
      { name: '100g Standup Pouch', sku: 'DAM-MNG-100G', weightGrams: 100, mrp: 299, sellingPrice: 249, costPrice: 110, packagingCost: 15 },
      { name: '250g Zip Pouch', sku: 'DAM-MNG-250G', weightGrams: 250, mrp: 599, sellingPrice: 499, costPrice: 220, packagingCost: 20 },
      { name: '500g Value Pack', sku: 'DAM-MNG-500G', weightGrams: 500, mrp: 1099, sellingPrice: 899, costPrice: 390, packagingCost: 30 },
      { name: '1kg Bulk Cannister', sku: 'DAM-MNG-1KG', weightGrams: 1000, mrp: 1999, sellingPrice: 1699, costPrice: 720, packagingCost: 55 },
    ],
  },
  {
    name: 'DAMIRA Raw Banana Flour & Powder',
    sku: 'DAM-BAN-PWD',
    categoryName: 'Fruit Powders',
    categoryCode: 'FRUIT_POWDERS',
    description: 'Gut-healthy green raw banana powder rich in prebiotic resistant starch.',
    variants: [
      { name: '200g Pouch', sku: 'DAM-BAN-200G', weightGrams: 200, mrp: 250, sellingPrice: 199, costPrice: 85, packagingCost: 15 },
      { name: '500g Eco Pack', sku: 'DAM-BAN-500G', weightGrams: 500, mrp: 499, sellingPrice: 399, costPrice: 170, packagingCost: 25 },
      { name: '1kg Bulk Pack', sku: 'DAM-BAN-1KG', weightGrams: 1000, mrp: 899, sellingPrice: 749, costPrice: 310, packagingCost: 45 },
    ],
  },
  {
    name: 'DAMIRA Pure Dehydrated Beetroot Powder',
    sku: 'DAM-BET-PWD',
    categoryName: 'Vegetable Powders',
    categoryCode: 'VEG_POWDERS',
    description: 'Nitric-oxide rich vibrant beetroot powder for pre-workout and natural culinary coloring.',
    variants: [
      { name: '100g Glass Jar', sku: 'DAM-BET-100G', weightGrams: 100, mrp: 320, sellingPrice: 269, costPrice: 115, packagingCost: 25 },
      { name: '250g Pouch', sku: 'DAM-BET-250G', weightGrams: 250, mrp: 650, sellingPrice: 549, costPrice: 230, packagingCost: 20 },
      { name: '500g Value Pack', sku: 'DAM-BET-500G', weightGrams: 500, mrp: 1150, sellingPrice: 949, costPrice: 410, packagingCost: 32 },
    ],
  },
  {
    name: 'DAMIRA Organic Spinach (Palak) Powder',
    sku: 'DAM-SPN-PWD',
    categoryName: 'Vegetable Powders',
    categoryCode: 'VEG_POWDERS',
    description: 'Micro-milled farm-fresh green spinach powder rich in iron, lutein and chlorophyll.',
    variants: [
      { name: '100g Fresh Pack', sku: 'DAM-SPN-100G', weightGrams: 100, mrp: 280, sellingPrice: 229, costPrice: 95, packagingCost: 18 },
      { name: '250g Pouch', sku: 'DAM-SPN-250G', weightGrams: 250, mrp: 580, sellingPrice: 479, costPrice: 195, packagingCost: 22 },
      { name: '500g Pouch', sku: 'DAM-SPN-500G', weightGrams: 500, mrp: 999, sellingPrice: 849, costPrice: 350, packagingCost: 30 },
    ],
  },
  {
    name: 'DAMIRA Farm Fresh Carrot Powder',
    sku: 'DAM-CRT-PWD',
    categoryName: 'Vegetable Powders',
    categoryCode: 'VEG_POWDERS',
    description: 'Sweet beta-carotene enriched dehydrated red carrot powder for baking and nutrition.',
    variants: [
      { name: '100g Pouch', sku: 'DAM-CRT-100G', weightGrams: 100, mrp: 260, sellingPrice: 219, costPrice: 90, packagingCost: 15 },
      { name: '250g Pouch', sku: 'DAM-CRT-250G', weightGrams: 250, mrp: 540, sellingPrice: 449, costPrice: 185, packagingCost: 20 },
    ],
  },
  {
    name: 'DAMIRA Dehydrated Toasted Garlic Powder',
    sku: 'DAM-GRL-PWD',
    categoryName: 'Spice & Condiment Powders',
    categoryCode: 'SPICE_POWDERS',
    description: 'Pungent, highly aromatic roasted garlic granules and micro-powder for culinary seasoning.',
    variants: [
      { name: '100g Shaker Bottle', sku: 'DAM-GRL-100G', weightGrams: 100, mrp: 220, sellingPrice: 185, costPrice: 75, packagingCost: 22 },
      { name: '250g Refill Pack', sku: 'DAM-GRL-250G', weightGrams: 250, mrp: 480, sellingPrice: 399, costPrice: 160, packagingCost: 18 },
      { name: '1kg Bulk Bag', sku: 'DAM-GRL-1KG', weightGrams: 1000, mrp: 1450, sellingPrice: 1199, costPrice: 490, packagingCost: 40 },
    ],
  },
  {
    name: 'DAMIRA Pink Onion Flakes & Powder',
    sku: 'DAM-ONN-PWD',
    categoryName: 'Spice & Condiment Powders',
    categoryCode: 'SPICE_POWDERS',
    description: 'Dehydrated Mahuva sweet pink onion powder with long shelf life and authentic aroma.',
    variants: [
      { name: '100g Shaker Bottle', sku: 'DAM-ONN-100G', weightGrams: 100, mrp: 199, sellingPrice: 169, costPrice: 65, packagingCost: 20 },
      { name: '250g Refill Pack', sku: 'DAM-ONN-250G', weightGrams: 250, mrp: 420, sellingPrice: 349, costPrice: 140, packagingCost: 18 },
      { name: '1kg Bulk Pouch', sku: 'DAM-ONN-1KG', weightGrams: 1000, mrp: 1250, sellingPrice: 999, costPrice: 410, packagingCost: 38 },
    ],
  },
  {
    name: 'DAMIRA Sun-Dried Tangy Tomato Powder',
    sku: 'DAM-TMT-PWD',
    categoryName: 'Spice & Condiment Powders',
    categoryCode: 'SPICE_POWDERS',
    description: 'Rich umami-packed spray-dried red tomato powder for sauces, soups, and seasonings.',
    variants: [
      { name: '100g Pouch', sku: 'DAM-TMT-100G', weightGrams: 100, mrp: 220, sellingPrice: 179, costPrice: 72, packagingCost: 16 },
      { name: '250g Pouch', sku: 'DAM-TMT-250G', weightGrams: 250, mrp: 470, sellingPrice: 389, costPrice: 155, packagingCost: 20 },
    ],
  },
  {
    name: 'DAMIRA Organic Wild Amla (Indian Gooseberry) Powder',
    sku: 'DAM-AML-PWD',
    categoryName: 'Superfood Powders',
    categoryCode: 'SUPERFOOD_POWDERS',
    description: 'Cold-processed wild forest amla powder packed with natural Vitamin C and bioflavonoids.',
    variants: [
      { name: '100g Herbal Pouch', sku: 'DAM-AML-100G', weightGrams: 100, mrp: 299, sellingPrice: 249, costPrice: 98, packagingCost: 18 },
      { name: '250g Value Pack', sku: 'DAM-AML-250G', weightGrams: 250, mrp: 620, sellingPrice: 499, costPrice: 198, packagingCost: 22 },
      { name: '500g Family Pack', sku: 'DAM-AML-500G', weightGrams: 500, mrp: 1100, sellingPrice: 899, costPrice: 360, packagingCost: 32 },
    ],
  },
];

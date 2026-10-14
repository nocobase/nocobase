/** Mock data for the Product form example. Nothing here reaches a server. */

export type ProductCategory =
  'furniture' | 'electronics' | 'lighting' | 'accessories' | 'storage';

export type PricingModel = 'one-time' | 'subscription' | 'usage';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface Warehouse {
  readonly id: string;
  readonly name: string;
  readonly city: string;
}

export interface ProductCollection {
  readonly id: string;
  readonly name: string;
  readonly count: number;
}

export interface UploadedFile {
  readonly id: string;
  readonly name: string;
  /** Size in bytes. */
  readonly size: number;
  readonly kind: 'image' | 'document';
}

/**
 * Every field the form edits. Numeric inputs are kept as strings so the user
 * can type freely; `validateProduct` decides whether they parse.
 */
export interface ProductDraft {
  readonly name: string;
  readonly description: string;
  readonly category: ProductCategory | '';
  readonly brand: string | null;
  readonly sku: string;
  readonly tags: readonly string[];
  readonly price: string;
  readonly compareAtPrice: string;
  readonly discount: number;
  readonly taxInclusive: boolean;
  readonly pricingModel: PricingModel;
  readonly quantity: string;
  readonly warehouse: string;
  readonly trackStock: boolean;
  readonly lowStockThreshold: string;
  readonly status: ProductStatus;
  readonly publishAt: Date | undefined;
  readonly collections: readonly string[];
}

export type ProductErrorField = 'name' | 'price' | 'quantity';

export type ProductErrorCode = 'required' | 'invalid';

export type ProductErrors = Partial<
  Record<ProductErrorField, ProductErrorCode>
>;

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'furniture',
  'electronics',
  'lighting',
  'accessories',
  'storage',
];

export const PRICING_MODELS: readonly PricingModel[] = [
  'one-time',
  'subscription',
  'usage',
];

export const PRODUCT_STATUSES: readonly ProductStatus[] = [
  'draft',
  'active',
  'archived',
];

export const BRANDS: readonly string[] = [
  'Aalto Works',
  'Brightline',
  'Contoso Office',
  'Fabrikam',
  'Halden & Co.',
  'Lumen Studio',
  'Northwind',
  'Orbit Audio',
  'Relecloud',
  'Tailspin',
  'Vertex Ergonomics',
  'Woodgrove',
];

export const TAG_SUGGESTIONS: readonly string[] = [
  'bestseller',
  'ergonomic',
  'home office',
  'new arrival',
  'oak',
  'premium',
  'recycled',
  'sale',
  'wireless',
  'wood',
];

export const WAREHOUSES: readonly Warehouse[] = [
  { id: 'wh-rtm', name: 'Rotterdam Central', city: 'Rotterdam' },
  { id: 'wh-lax', name: 'Los Angeles West', city: 'Los Angeles' },
  { id: 'wh-sin', name: 'Singapore Hub', city: 'Singapore' },
  { id: 'wh-man', name: 'Manchester North', city: 'Manchester' },
];

export const PRODUCT_COLLECTIONS: readonly ProductCollection[] = [
  { id: 'col-new', name: 'New arrivals', count: 24 },
  { id: 'col-office', name: 'Home office essentials', count: 58 },
  { id: 'col-best', name: 'Best sellers', count: 31 },
  { id: 'col-sale', name: 'Autumn sale', count: 17 },
  { id: 'col-sustainable', name: 'Sustainable picks', count: 12 },
];

export const INITIAL_FILES: readonly UploadedFile[] = [
  { id: 'file_01', name: 'desk-oak-front.jpg', size: 1_842_230, kind: 'image' },
  {
    id: 'file_02',
    name: 'desk-oak-detail.jpg',
    size: 1_204_918,
    kind: 'image',
  },
  {
    id: 'file_03',
    name: 'assembly-guide.pdf',
    size: 3_512_004,
    kind: 'document',
  },
];

/** Files the mock upload button hands back, one per click. */
export const UPLOAD_QUEUE: readonly UploadedFile[] = [
  { id: 'file_04', name: 'desk-oak-side.jpg', size: 1_398_112, kind: 'image' },
  {
    id: 'file_05',
    name: 'desk-oak-lifestyle.jpg',
    size: 2_610_754,
    kind: 'image',
  },
  { id: 'file_06', name: 'spec-sheet.pdf', size: 842_330, kind: 'document' },
];

export const EMPTY_PRODUCT: ProductDraft = {
  name: '',
  description: '',
  category: '',
  brand: null,
  sku: '',
  tags: [],
  price: '',
  compareAtPrice: '',
  discount: 0,
  taxInclusive: false,
  pricingModel: 'one-time',
  quantity: '0',
  warehouse: 'wh-rtm',
  trackStock: true,
  lowStockThreshold: '5',
  status: 'draft',
  publishAt: undefined,
  collections: ['col-new'],
};

/** A draft with a few fields filled, so the page does not open empty. */
export const SAMPLE_PRODUCT: ProductDraft = {
  ...EMPTY_PRODUCT,
  name: 'Oak standing desk 140 cm',
  description:
    'Solid oak top on a dual-motor frame with three memory presets. Cable tray and anti-collision sensor included.',
  category: 'furniture',
  brand: 'Aalto Works',
  sku: 'DSK-OAK-140',
  tags: ['ergonomic', 'oak', 'home office'],
  price: '649',
  compareAtPrice: '749',
  discount: 10,
  quantity: '42',
  warehouse: 'wh-rtm',
  collections: ['col-new', 'col-office'],
};

export function validateProduct(draft: ProductDraft): ProductErrors {
  const errors: { -readonly [K in ProductErrorField]?: ProductErrorCode } = {};
  if (!draft.name.trim()) errors.name = 'required';
  if (!draft.price.trim()) {
    errors.price = 'required';
  } else {
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) errors.price = 'invalid';
  }
  const quantity = Number(draft.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) errors.quantity = 'invalid';
  return errors;
}

/** `649` with a 10% discount → `584.1`; `NaN` while the price is unparsable. */
export function discountedPrice(draft: ProductDraft): number {
  const price = Number(draft.price);
  if (!Number.isFinite(price)) return Number.NaN;
  return Math.round(price * (1 - draft.discount / 100) * 100) / 100;
}

/** `DSK-OAK-140` from `Oak standing desk 140 cm`: category prefix, then the first two words and any number. */
export function suggestSku(
  name: string,
  category: ProductCategory | '',
): string {
  const prefix: Record<ProductCategory | '', string> = {
    furniture: 'FRN',
    electronics: 'ELC',
    lighting: 'LGT',
    accessories: 'ACC',
    storage: 'STO',
    '': 'PRD',
  };
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const letters = words
    .filter((word) => !/^\d+$/.test(word))
    .slice(0, 2)
    .map((word) => word.slice(0, 3));
  const digits = words.find((word) => /^\d+$/.test(word));
  return [prefix[category], ...letters, digits].filter(Boolean).join('-');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

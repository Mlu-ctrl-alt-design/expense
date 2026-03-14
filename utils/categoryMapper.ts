/**
 * Maps vendor names and keywords to ERPNext expense types.
 * Default expense types align with standard ERPNext chart of accounts.
 */

// Default ERPNext expense types (customizable in settings)
export const DEFAULT_EXPENSE_TYPES = [
  'Meals',
  'Travel',
  'Accommodation',
  'Office Supplies',
  'Medical',
  'Entertainment',
  'Utilities',
  'Communication',
  'Professional Services',
  'General',
] as const;

export type ExpenseType = (typeof DEFAULT_EXPENSE_TYPES)[number];

// Keyword-to-expense-type mapping (case-insensitive substring match)
const KEYWORD_MAPPINGS: Array<{ keywords: string[]; type: ExpenseType }> = [
  {
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald',
      'subway', 'pizza', 'burger', 'grill', 'diner', 'bistro',
      'bar', 'pub', 'tavern', 'eatery', 'food', 'kitchen',
      'catering', 'lunch', 'dinner', 'breakfast', 'donut',
      'bakery', 'sushi', 'thai', 'chinese', 'italian', 'mexican',
      'panera', 'chipotle', 'wendy', 'taco', 'chick-fil',
      'dunkin', 'tim horton',
    ],
    type: 'Meals',
  },
  {
    keywords: [
      'uber', 'lyft', 'taxi', 'cab', 'transit', 'metro',
      'airline', 'air canada', 'united', 'delta', 'southwest',
      'american airlines', 'jetblue', 'spirit', 'flight',
      'airport', 'parking', 'garage', 'valet', 'toll',
      'greyhound', 'amtrak', 'train', 'bus', 'ferry',
      'rental car', 'hertz', 'avis', 'budget', 'enterprise',
      'zipcar', 'gas station', 'shell', 'chevron', 'exxon',
      'bp', 'sunoco', 'citgo', 'fuel',
    ],
    type: 'Travel',
  },
  {
    keywords: [
      'hotel', 'motel', 'inn', 'resort', 'airbnb', 'vrbo',
      'marriott', 'hilton', 'hyatt', 'sheraton', 'westin',
      'holiday inn', 'best western', 'radisson', 'lodging',
      'accommodation', 'suites', 'bed and breakfast',
    ],
    type: 'Accommodation',
  },
  {
    keywords: [
      'office depot', 'staples', 'officemax', 'amazon', 'best buy',
      'supplies', 'printer', 'paper', 'ink', 'toner', 'stationery',
      'pen', 'notebook', 'binder', 'folder', 'desk', 'chair',
      'computer', 'keyboard', 'mouse', 'monitor', 'usb', 'cable',
      'software', 'license',
    ],
    type: 'Office Supplies',
  },
  {
    keywords: [
      'pharmacy', 'walgreens', 'cvs', 'rite aid', 'hospital',
      'clinic', 'doctor', 'medical', 'dental', 'vision', 'health',
      'prescription', 'drug store',
    ],
    type: 'Medical',
  },
  {
    keywords: [
      'theater', 'theatre', 'cinema', 'movie', 'concert', 'show',
      'event', 'ticket', 'entertainment', 'amusement', 'museum',
      'gallery', 'sport', 'game', 'netflix', 'spotify', 'apple music',
    ],
    type: 'Entertainment',
  },
  {
    keywords: [
      'electric', 'utility', 'water', 'gas', 'internet', 'broadband',
      'cable', 'satellite', 'at&t', 'verizon', 'comcast', 'spectrum',
      't-mobile', 'sprint', 'phone bill', 'hydro',
    ],
    type: 'Utilities',
  },
  {
    keywords: [
      'phone', 'mobile', 'cellular', 'telecom', 'postage', 'mail',
      'fedex', 'ups', 'dhl', 'usps', 'courier', 'shipping',
    ],
    type: 'Communication',
  },
  {
    keywords: [
      'consultant', 'legal', 'attorney', 'lawyer', 'accountant',
      'cpa', 'audit', 'notary', 'contractor', 'freelance',
      'professional', 'advisory', 'coaching',
    ],
    type: 'Professional Services',
  },
];

/**
 * Maps a vendor name to an ERPNext expense type.
 * Returns 'General' if no match found.
 */
export function mapVendorToExpenseType(vendorName: string): ExpenseType {
  const lowerVendor = vendorName.toLowerCase();

  for (const mapping of KEYWORD_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (lowerVendor.includes(keyword)) {
        return mapping.type;
      }
    }
  }

  return 'General';
}

/**
 * Maps raw OCR text to an expense type by scanning the full receipt text.
 * Falls back to vendor-based mapping if provided.
 */
export function mapReceiptToExpenseType(
  rawText: string,
  vendorName?: string,
): ExpenseType {
  const lowerText = rawText.toLowerCase();

  for (const mapping of KEYWORD_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (lowerText.includes(keyword)) {
        return mapping.type;
      }
    }
  }

  if (vendorName) {
    return mapVendorToExpenseType(vendorName);
  }

  return 'General';
}

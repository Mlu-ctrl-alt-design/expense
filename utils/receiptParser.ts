/**
 * Parses OCR text output into structured receipt data.
 * Handles common receipt formats from restaurants, retailers, etc.
 */

import { ReceiptItem } from '../types';
import { mapReceiptToExpenseType } from './categoryMapper';
import { parseDateFromText, getTodayISO } from './dateParser';

export interface ParsedReceiptData {
  vendor: string;
  date: string;
  totalAmount: number;
  items: ReceiptItem[];
  rawText: string;
}

// Patterns that indicate a total amount line
const TOTAL_PATTERNS = [
  /(?:total|amount due|balance due|grand total|total due|amount payable|subtotal)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i,
  /\$\s*([\d,]+\.\d{2})\s*(?:total|due|usd)?/i,
];

// Patterns for individual line items with prices
const LINE_ITEM_PATTERN =
  /^(.+?)\s+\$?\s*([\d,]+\.\d{2})\s*$/;

// Patterns to skip (tax, gratuity header lines, etc.)
const SKIP_LINE_PATTERNS = [
  /^\s*$/,
  /^[-=*]+$/,
  /thank you/i,
  /receipt/i,
  /cashier/i,
  /register/i,
  /transaction/i,
  /approved/i,
  /authorization/i,
  /card ending/i,
  /visa|mastercard|amex|discover/i,
];

/**
 * Extracts vendor name from OCR text.
 * Usually the first non-empty, non-address line at the top.
 */
function extractVendor(lines: string[]): string {
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    // Skip lines that look like addresses or phone numbers
    if (
      trimmed.length > 2 &&
      trimmed.length < 60 &&
      !/^\d{5}(-\d{4})?$/.test(trimmed) && // zip code
      !/^\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/.test(trimmed) && // phone
      !/^\d+\s+\w+\s+(st|ave|blvd|rd|dr|ln|way|ct)/i.test(trimmed) && // street address
      !/^(tel|phone|fax|www|http)/i.test(trimmed)
    ) {
      return trimmed;
    }
  }
  return 'Unknown Vendor';
}

/**
 * Extracts total amount from receipt text.
 * Returns 0 if not found.
 */
function extractTotalAmount(text: string, lines: string[]): number {
  // Try explicit total patterns
  for (const pattern of TOTAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(',', ''));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  // Fallback: find the largest dollar amount on any line
  let maxAmount = 0;
  for (const line of lines) {
    const match = line.match(/\$?\s*([\d,]+\.\d{2})/);
    if (match) {
      const amount = parseFloat(match[1].replace(',', ''));
      if (!isNaN(amount) && amount > maxAmount) {
        maxAmount = amount;
      }
    }
  }

  return maxAmount;
}

/**
 * Extracts individual line items from receipt text.
 */
function extractLineItems(lines: string[], expenseType: string): ReceiptItem[] {
  const items: ReceiptItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip irrelevant lines
    if (SKIP_LINE_PATTERNS.some((p) => p.test(trimmed))) {
      continue;
    }

    const match = trimmed.match(LINE_ITEM_PATTERN);
    if (match) {
      const description = match[1].trim();
      const amount = parseFloat(match[2].replace(',', ''));

      // Skip likely tax/tip lines that are small modifiers
      if (
        description.length > 1 &&
        !isNaN(amount) &&
        amount > 0 &&
        amount < 10000
      ) {
        items.push({
          description,
          amount,
          expenseType,
        });
      }
    }
  }

  return items;
}

/**
 * Main receipt parser: converts raw OCR text to structured data.
 */
export function parseReceiptText(rawText: string): ParsedReceiptData {
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);

  const vendor = extractVendor(lines);
  const date = parseDateFromText(rawText);
  const expenseType = mapReceiptToExpenseType(rawText, vendor);
  const totalAmount = extractTotalAmount(rawText, lines);
  const items = extractLineItems(lines, expenseType);

  // If no line items found but we have a total, create a single line item
  if (items.length === 0 && totalAmount > 0) {
    items.push({
      description: vendor,
      amount: totalAmount,
      expenseType,
    });
  }

  return {
    vendor,
    date,
    totalAmount,
    items,
    rawText,
  };
}

/**
 * Calculates confidence score (0-100) for OCR extraction quality.
 * Based on presence of key fields.
 */
export function calculateConfidence(data: ParsedReceiptData): number {
  let score = 0;

  // Vendor found and not generic
  if (data.vendor && data.vendor !== 'Unknown Vendor') score += 25;

  // Valid date found (not today's default)
  if (data.date && data.date !== getTodayISO()) score += 25;

  // Total amount found
  if (data.totalAmount > 0) score += 30;

  // Line items found
  if (data.items.length > 0) score += 10;

  // Multiple items indicate detailed extraction
  if (data.items.length > 1) score += 10;

  return Math.min(score, 100);
}

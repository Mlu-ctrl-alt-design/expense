import { parseReceiptText, calculateConfidence } from '../utils/receiptParser';

const SAMPLE_RECEIPT = `
THE CAPITAL GRILLE
633 N Saint Clair St
Chicago, IL 60611
Tel: (312) 337-9400

Date: 01/15/2024  6:45 PM
Server: Michael

Filet Mignon 8oz         45.00
Caesar Salad             12.00
Cabernet Sauvignon       18.50

Subtotal                 75.50
Tax (9.5%)                7.17
Gratuity                  5.00

TOTAL                    87.67

Thank you for dining with us!
`;

describe('parseReceiptText', () => {
  it('extracts vendor name', () => {
    const result = parseReceiptText(SAMPLE_RECEIPT);
    expect(result.vendor).toBe('THE CAPITAL GRILLE');
  });

  it('extracts total amount', () => {
    const result = parseReceiptText(SAMPLE_RECEIPT);
    expect(result.totalAmount).toBeGreaterThan(0);
  });

  it('extracts a date', () => {
    const result = parseReceiptText(SAMPLE_RECEIPT);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('extracts line items', () => {
    const result = parseReceiptText(SAMPLE_RECEIPT);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('handles empty receipt text', () => {
    const result = parseReceiptText('');
    expect(result.vendor).toBe('Unknown Vendor');
    expect(result.totalAmount).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('creates a single item from total when no items found', () => {
    const simpleReceipt = 'ACME STORE\nTotal $25.00';
    const result = parseReceiptText(simpleReceipt);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].amount).toBe(25);
  });
});

describe('calculateConfidence', () => {
  it('returns high confidence for complete data', () => {
    const result = parseReceiptText(SAMPLE_RECEIPT);
    const confidence = calculateConfidence(result);
    expect(confidence).toBeGreaterThan(60);
  });

  it('returns low confidence for empty data', () => {
    const emptyResult = parseReceiptText('');
    const confidence = calculateConfidence(emptyResult);
    expect(confidence).toBeLessThan(40);
  });

  it('caps at 100', () => {
    const result = parseReceiptText(SAMPLE_RECEIPT);
    const confidence = calculateConfidence(result);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it('is non-negative', () => {
    const result = parseReceiptText('');
    const confidence = calculateConfidence(result);
    expect(confidence).toBeGreaterThanOrEqual(0);
  });
});

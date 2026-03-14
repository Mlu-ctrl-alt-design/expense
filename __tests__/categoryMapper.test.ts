import { mapVendorToExpenseType, mapReceiptToExpenseType } from '../utils/categoryMapper';

describe('mapVendorToExpenseType', () => {
  it('maps restaurant to Meals', () => {
    expect(mapVendorToExpenseType('The Capital Grille Restaurant')).toBe('Meals');
  });

  it('maps Starbucks to Meals', () => {
    expect(mapVendorToExpenseType('Starbucks Coffee')).toBe('Meals');
  });

  it('maps Uber to Travel', () => {
    expect(mapVendorToExpenseType('Uber Technologies')).toBe('Travel');
  });

  it('maps hotel to Accommodation', () => {
    expect(mapVendorToExpenseType('Marriott Hotel & Suites')).toBe('Accommodation');
  });

  it('maps pharmacy to Medical', () => {
    expect(mapVendorToExpenseType('CVS Pharmacy')).toBe('Medical');
  });

  it('maps Staples to Office Supplies', () => {
    expect(mapVendorToExpenseType('Staples Business Center')).toBe('Office Supplies');
  });

  it('returns General for unknown vendors', () => {
    expect(mapVendorToExpenseType('XYZ Corp Unknown')).toBe('General');
  });

  it('is case-insensitive', () => {
    expect(mapVendorToExpenseType('STARBUCKS')).toBe('Meals');
    expect(mapVendorToExpenseType('uber')).toBe('Travel');
  });
});

describe('mapReceiptToExpenseType', () => {
  it('detects Meals from receipt text', () => {
    const text = 'THE CAPITAL GRILLE\nDinner for 2\nTotal: $87.50';
    expect(mapReceiptToExpenseType(text)).toBe('Meals');
  });

  it('detects Travel from receipt text', () => {
    const text = 'Uber Trip Receipt\nFrom: Office\nTo: Airport\n$24.50';
    expect(mapReceiptToExpenseType(text)).toBe('Travel');
  });

  it('falls back to vendor matching', () => {
    const text = 'Random receipt text without clear category';
    expect(mapReceiptToExpenseType(text, 'Hilton Hotel')).toBe('Accommodation');
  });

  it('returns General for unknown text', () => {
    const text = 'Unknown Store\nItem 1\n$10.00';
    expect(mapReceiptToExpenseType(text)).toBe('General');
  });
});

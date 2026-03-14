import { parseDateFromText, formatDateForDisplay, getTodayISO } from '../utils/dateParser';

describe('parseDateFromText', () => {
  it('parses ISO format', () => {
    expect(parseDateFromText('Date: 2024-01-15')).toBe('2024-01-15');
  });

  it('parses US long month format', () => {
    expect(parseDateFromText('January 15, 2024')).toBe('2024-01-15');
  });

  it('parses abbreviated month', () => {
    expect(parseDateFromText('Jan 15, 2024')).toBe('2024-01-15');
  });

  it('parses US slash format MM/DD/YYYY', () => {
    expect(parseDateFromText('01/15/2024', true)).toBe('2024-01-15');
  });

  it('parses international format DD/MM/YYYY when first value > 12', () => {
    // 15/01/2024 — first value > 12, so must be day
    expect(parseDateFromText('15/01/2024')).toBe('2024-01-15');
  });

  it('parses two-digit year', () => {
    expect(parseDateFromText('01/15/24', true)).toBe('2024-01-15');
  });

  it('parses dot-separated European format', () => {
    expect(parseDateFromText('15.01.2024')).toBe('2024-01-15');
  });

  it('parses day-month-year text format', () => {
    expect(parseDateFromText('15th January 2024')).toBe('2024-01-15');
  });

  it('falls back to today for unparseable input', () => {
    const result = parseDateFromText('no dates here');
    expect(result).toBe(getTodayISO());
  });
});

describe('formatDateForDisplay', () => {
  it('formats ISO date for display', () => {
    const result = formatDateForDisplay('2024-01-15');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('handles invalid date gracefully', () => {
    const result = formatDateForDisplay('invalid');
    expect(result).toBe('invalid');
  });
});

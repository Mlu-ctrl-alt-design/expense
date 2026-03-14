/**
 * Parses various date formats from receipt OCR text into ISO YYYY-MM-DD format.
 * Handles ambiguity between US (MM/DD/YYYY) and international (DD/MM/YYYY) formats
 * using device locale as hint.
 */

// Common date format patterns
const DATE_PATTERNS = [
  // ISO: 2024-01-15
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  // US long: January 15, 2024 or Jan 15, 2024
  /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/i,
  // Slash US: 01/15/2024 or 01/15/24
  /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/,
  // Dash US: 01-15-2024
  /\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/,
  // Dot European: 15.01.2024
  /\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/,
  // Long with ordinal: 15th January 2024
  /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i,
];

const MONTH_MAP: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function normalizeYear(year: string): number {
  const y = parseInt(year, 10);
  if (y < 100) {
    return y < 50 ? 2000 + y : 1900 + y;
  }
  return y;
}

/**
 * Parses a date from OCR text.
 * @param text Raw OCR text from receipt
 * @param preferUSFormat If true, ambiguous MM/DD vs DD/MM defaults to US format
 * @returns ISO date string YYYY-MM-DD or today's date if parsing fails
 */
export function parseDateFromText(
  text: string,
  preferUSFormat = true,
): string {
  // Try ISO format first
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }

  // Try named month formats
  const longMonthMatch = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/i,
  );
  if (longMonthMatch) {
    const [, monthStr, day, year] = longMonthMatch;
    const month = MONTH_MAP[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${pad(month)}-${pad(parseInt(day, 10))}`;
    }
  }

  // Try DD Month YYYY
  const dayMonthYearMatch = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i,
  );
  if (dayMonthYearMatch) {
    const [, day, monthStr, year] = dayMonthYearMatch;
    const month = MONTH_MAP[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${pad(month)}-${pad(parseInt(day, 10))}`;
    }
  }

  // Try numeric formats: MM/DD/YYYY or DD/MM/YYYY
  const numericSlashMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (numericSlashMatch) {
    const [, first, second, yearStr] = numericSlashMatch;
    const year = normalizeYear(yearStr);
    const a = parseInt(first, 10);
    const b = parseInt(second, 10);

    // If second value > 12, it must be a day (international format)
    if (b > 12) {
      return `${year}-${pad(a)}-${pad(b)}`;
    }
    // If first value > 12, it must be a day (non-US)
    if (a > 12) {
      return `${year}-${pad(b)}-${pad(a)}`;
    }
    // Ambiguous: use locale preference
    if (preferUSFormat) {
      return `${year}-${pad(a)}-${pad(b)}`; // MM/DD
    } else {
      return `${year}-${pad(b)}-${pad(a)}`; // DD/MM
    }
  }

  // Try dot format: DD.MM.YYYY (European)
  const dotMatch = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
  if (dotMatch) {
    const [, day, month, yearStr] = dotMatch;
    const year = normalizeYear(yearStr);
    return `${year}-${pad(parseInt(month, 10))}-${pad(parseInt(day, 10))}`;
  }

  // Default to today
  return getTodayISO();
}

export function getTodayISO(): string {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

/**
 * Formats an ISO date string for display: "January 15, 2024"
 */
export function formatDateForDisplay(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

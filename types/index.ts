// ERPNext configuration stored on device
export interface ERPNextConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  employeeId: string;
  company: string;
  googleVisionApiKey?: string;
}

// A single line item extracted from a receipt
export interface ReceiptItem {
  description: string;
  amount: number;
  expenseType: string;
}

// Data extracted from a receipt via OCR
export interface ExtractedReceipt {
  vendor: string;
  date: string; // ISO format: YYYY-MM-DD
  totalAmount: number;
  items: ReceiptItem[];
  category: string;
  rawText: string;
  confidence: number; // 0-100
  imageUri: string;
}

// ERPNext Expense Claim line item payload
export interface ExpenseClaimItem {
  expense_date: string; // YYYY-MM-DD
  expense_type: string;
  description: string;
  amount: number;
  sanctioned_amount?: number;
}

// ERPNext Expense Claim payload
export interface ExpenseClaimPayload {
  employee: string;
  company: string;
  expenses: ExpenseClaimItem[];
  total_claimed_amount: number;
  remark?: string;
}

// Result from ERPNext after successful submission
export interface ExpenseClaimResult {
  name: string; // e.g. "EC-00145"
  doctype: string;
  status: string;
}

// A pending expense queued for offline submission
export interface PendingExpense {
  id: string; // local UUID
  extractedReceipt: ExtractedReceipt;
  payload: ExpenseClaimPayload;
  createdAt: string; // ISO timestamp
  status: 'pending' | 'submitting' | 'failed';
  errorMessage?: string;
  retryCount: number;
}

// App-wide navigation params
export type RootStackParamList = {
  index: undefined;
  scan: undefined;
  review: { imageUri: string };
  confirm: { claimId: string; vendor: string; amount: number };
  settings: undefined;
};

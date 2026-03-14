/**
 * Local storage service wrapping AsyncStorage.
 * Manages ERPNext config, pending expenses, and app settings.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERPNextConfig, PendingExpense } from '../types';

const KEYS = {
  ERPNEXT_CONFIG: 'erpnext_config',
  PENDING_EXPENSES: 'pending_expenses',
} as const;

// ── ERPNext Config ─────────────────────────────────────────────────────────────

export async function saveERPNextConfig(config: ERPNextConfig): Promise<void> {
  await AsyncStorage.setItem(KEYS.ERPNEXT_CONFIG, JSON.stringify(config));
}

export async function loadERPNextConfig(): Promise<ERPNextConfig | null> {
  const raw = await AsyncStorage.getItem(KEYS.ERPNEXT_CONFIG);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ERPNextConfig;
  } catch {
    return null;
  }
}

export async function clearERPNextConfig(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ERPNEXT_CONFIG);
}

// ── Pending Expenses Queue ─────────────────────────────────────────────────────

export async function loadPendingExpenses(): Promise<PendingExpense[]> {
  const raw = await AsyncStorage.getItem(KEYS.PENDING_EXPENSES);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingExpense[];
  } catch {
    return [];
  }
}

export async function savePendingExpense(expense: PendingExpense): Promise<void> {
  const expenses = await loadPendingExpenses();
  const existing = expenses.findIndex((e) => e.id === expense.id);
  if (existing >= 0) {
    expenses[existing] = expense;
  } else {
    expenses.push(expense);
  }
  await AsyncStorage.setItem(KEYS.PENDING_EXPENSES, JSON.stringify(expenses));
}

export async function updatePendingExpenseStatus(
  id: string,
  status: PendingExpense['status'],
  errorMessage?: string,
): Promise<void> {
  const expenses = await loadPendingExpenses();
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx >= 0) {
    expenses[idx].status = status;
    if (errorMessage !== undefined) {
      expenses[idx].errorMessage = errorMessage;
    }
    expenses[idx].retryCount = (expenses[idx].retryCount || 0) + 1;
    await AsyncStorage.setItem(KEYS.PENDING_EXPENSES, JSON.stringify(expenses));
  }
}

export async function removePendingExpense(id: string): Promise<void> {
  const expenses = await loadPendingExpenses();
  const filtered = expenses.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEYS.PENDING_EXPENSES, JSON.stringify(filtered));
}

export async function clearAllPendingExpenses(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.PENDING_EXPENSES);
}

// ── Utility ────────────────────────────────────────────────────────────────────

/** Generates a simple UUID v4 for local IDs */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

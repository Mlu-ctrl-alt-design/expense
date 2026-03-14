/**
 * ERPNext REST API service.
 * Handles authentication and expense claim submission.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ERPNextConfig,
  ExpenseClaimPayload,
  ExpenseClaimResult,
  ExtractedReceipt,
} from '../types';

/**
 * Creates an authenticated axios instance for the given ERPNext config.
 */
function createERPNextClient(config: ERPNextConfig): AxiosInstance {
  const baseURL = config.baseUrl.replace(/\/$/, ''); // remove trailing slash
  return axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 20000,
  });
}

/**
 * Tests connection to ERPNext and verifies credentials.
 * Returns the employee's name if successful.
 */
export async function testERPNextConnection(
  config: ERPNextConfig,
): Promise<{ success: boolean; employeeName?: string; error?: string }> {
  try {
    const client = createERPNextClient(config);
    const response = await client.get(
      `/resource/Employee/${encodeURIComponent(config.employeeId)}`,
    );
    const employee = response.data?.data;
    return {
      success: true,
      employeeName: employee?.employee_name || config.employeeId,
    };
  } catch (err) {
    const error = err as AxiosError<{ message?: string; exc?: string }>;
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        error: 'Invalid API credentials. Please check your API key and secret.',
      };
    }
    if (error.response?.status === 404) {
      return {
        success: false,
        error: `Employee ID "${config.employeeId}" not found in ERPNext.`,
      };
    }
    return {
      success: false,
      error: error.message || 'Could not connect to ERPNext. Check the URL.',
    };
  }
}

/**
 * Fetches available expense types from ERPNext.
 * Returns an array of expense type names.
 */
export async function fetchExpenseTypes(
  config: ERPNextConfig,
): Promise<string[]> {
  try {
    const client = createERPNextClient(config);
    const response = await client.get('/resource/Expense Claim Type', {
      params: {
        fields: JSON.stringify(['name']),
        limit_page_length: 100,
      },
    });
    return (response.data?.data || []).map(
      (item: { name: string }) => item.name,
    );
  } catch {
    // Return defaults if ERPNext fetch fails
    return [
      'Travel',
      'Meals',
      'Accommodation',
      'Office Supplies',
      'Medical',
      'Entertainment',
      'General',
    ];
  }
}

/**
 * Builds an ERPNext Expense Claim payload from extracted receipt data.
 */
export function buildExpenseClaimPayload(
  receipt: ExtractedReceipt,
  config: ERPNextConfig,
): ExpenseClaimPayload {
  const expenses = receipt.items.map((item) => ({
    expense_date: receipt.date,
    expense_type: item.expenseType,
    description: item.description,
    amount: item.amount,
    sanctioned_amount: item.amount,
  }));

  // If no items, create a single line from total
  if (expenses.length === 0) {
    expenses.push({
      expense_date: receipt.date,
      expense_type: receipt.category,
      description: receipt.vendor,
      amount: receipt.totalAmount,
      sanctioned_amount: receipt.totalAmount,
    });
  }

  const totalClaimedAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    employee: config.employeeId,
    company: config.company,
    expenses,
    total_claimed_amount: totalClaimedAmount,
    remark: `Receipt from ${receipt.vendor} on ${receipt.date}`,
  };
}

/**
 * Submits an expense claim to ERPNext.
 * Returns the created expense claim name (e.g. "EC-00145").
 */
export async function submitExpenseClaim(
  payload: ExpenseClaimPayload,
  config: ERPNextConfig,
): Promise<ExpenseClaimResult> {
  const client = createERPNextClient(config);

  const erpNextPayload = {
    doctype: 'Expense Claim',
    employee: payload.employee,
    company: payload.company,
    expenses: payload.expenses,
    total_claimed_amount: payload.total_claimed_amount,
    remark: payload.remark,
  };

  try {
    const response = await client.post(
      '/resource/Expense Claim',
      erpNextPayload,
    );
    const data = response.data?.data;
    return {
      name: data.name,
      doctype: 'Expense Claim',
      status: data.status || 'Draft',
    };
  } catch (err) {
    const error = err as AxiosError<{
      message?: string;
      exc?: string;
      _server_messages?: string;
    }>;

    // Parse ERPNext error messages
    let errorMessage = 'Failed to submit expense claim.';

    if (error.response?.data) {
      const data = error.response.data;
      if (data._server_messages) {
        try {
          const msgs = JSON.parse(data._server_messages);
          const parsed = JSON.parse(msgs[0]);
          errorMessage = parsed.message || errorMessage;
        } catch {
          errorMessage = data.message || errorMessage;
        }
      } else if (data.message) {
        errorMessage = data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Attaches a receipt image to an expense claim document in ERPNext.
 */
export async function attachReceiptImage(
  expenseClaimName: string,
  imageBase64: string,
  fileName: string,
  config: ERPNextConfig,
): Promise<void> {
  const client = createERPNextClient(config);

  await client.post('/method/upload_file', {
    filename: fileName,
    doctype: 'Expense Claim',
    docname: expenseClaimName,
    filedata: imageBase64,
    is_private: 1,
  });
}

/**
 * Returns the URL to view an expense claim in ERPNext.
 */
export function getExpenseClaimUrl(
  expenseClaimName: string,
  config: ERPNextConfig,
): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  return `${baseUrl}/app/expense-claim/${encodeURIComponent(expenseClaimName)}`;
}

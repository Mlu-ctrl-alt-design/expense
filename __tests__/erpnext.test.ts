import { buildExpenseClaimPayload, getExpenseClaimUrl } from '../services/erpnext';
import { ExtractedReceipt, ERPNextConfig } from '../types';

const MOCK_CONFIG: ERPNextConfig = {
  baseUrl: 'https://demo.erpnext.com',
  apiKey: 'test-key',
  apiSecret: 'test-secret',
  employeeId: 'HR-EMP-00001',
  company: 'Test Company',
};

const MOCK_RECEIPT: ExtractedReceipt = {
  vendor: 'The Capital Grille',
  date: '2024-01-15',
  totalAmount: 87.67,
  items: [
    { description: 'Filet Mignon', amount: 45.0, expenseType: 'Meals' },
    { description: 'Caesar Salad', amount: 12.0, expenseType: 'Meals' },
    { description: 'Cabernet Sauvignon', amount: 18.5, expenseType: 'Meals' },
  ],
  category: 'Meals',
  rawText: '',
  confidence: 90,
  imageUri: 'file:///test/image.jpg',
};

describe('buildExpenseClaimPayload', () => {
  it('maps employee from config', () => {
    const payload = buildExpenseClaimPayload(MOCK_RECEIPT, MOCK_CONFIG);
    expect(payload.employee).toBe(MOCK_CONFIG.employeeId);
  });

  it('maps company from config', () => {
    const payload = buildExpenseClaimPayload(MOCK_RECEIPT, MOCK_CONFIG);
    expect(payload.company).toBe(MOCK_CONFIG.company);
  });

  it('maps expense items', () => {
    const payload = buildExpenseClaimPayload(MOCK_RECEIPT, MOCK_CONFIG);
    expect(payload.expenses).toHaveLength(3);
  });

  it('sets expense_date on all items', () => {
    const payload = buildExpenseClaimPayload(MOCK_RECEIPT, MOCK_CONFIG);
    payload.expenses.forEach((item) => {
      expect(item.expense_date).toBe('2024-01-15');
    });
  });

  it('sets sanctioned_amount equal to amount', () => {
    const payload = buildExpenseClaimPayload(MOCK_RECEIPT, MOCK_CONFIG);
    payload.expenses.forEach((item) => {
      expect(item.sanctioned_amount).toBe(item.amount);
    });
  });

  it('calculates total_claimed_amount', () => {
    const payload = buildExpenseClaimPayload(MOCK_RECEIPT, MOCK_CONFIG);
    const expectedTotal = 45.0 + 12.0 + 18.5;
    expect(payload.total_claimed_amount).toBeCloseTo(expectedTotal, 2);
  });

  it('creates single item from total when no items', () => {
    const receiptNoItems = { ...MOCK_RECEIPT, items: [] };
    const payload = buildExpenseClaimPayload(receiptNoItems, MOCK_CONFIG);
    expect(payload.expenses).toHaveLength(1);
    expect(payload.expenses[0].amount).toBe(87.67);
  });

  it('includes a remark', () => {
    const payload = buildExpenseClaimPayload(MOCK_RECEIPT, MOCK_CONFIG);
    expect(payload.remark).toContain('The Capital Grille');
  });
});

describe('getExpenseClaimUrl', () => {
  it('builds correct ERPNext URL', () => {
    const url = getExpenseClaimUrl('EC-00145', MOCK_CONFIG);
    expect(url).toBe('https://demo.erpnext.com/app/expense-claim/EC-00145');
  });

  it('handles trailing slash in base URL', () => {
    const configWithSlash = { ...MOCK_CONFIG, baseUrl: 'https://demo.erpnext.com/' };
    const url = getExpenseClaimUrl('EC-00145', configWithSlash);
    expect(url).toBe('https://demo.erpnext.com/app/expense-claim/EC-00145');
  });
});

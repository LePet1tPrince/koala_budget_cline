import {
  bulkUpdateTransactions,
  createTransaction,
  deleteTransaction,
  getTransactions,
  getTransactionsByAccount,
  updateTransaction,
  updateTransactionStatus,
  uploadCSVTransactions
} from '../../services/transactionService';

import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Transaction Service', () => {
  // Mock localStorage
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    axios.create.mockReturnValue(axios);
    axios.interceptors = {
      request: { use: jest.fn() }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get all transactions', async () => {
    const mockTransactions = [
      { id: 1, amount: '100.00', notes: 'Test transaction 1' },
      { id: 2, amount: '200.00', notes: 'Test transaction 2' }
    ];

    axios.get.mockResolvedValue({ data: mockTransactions });

    const result = await getTransactions();

    expect(axios.get).toHaveBeenCalledWith('/transactions/');
    expect(result).toEqual(mockTransactions);
  });

  it('should get transactions by account', async () => {
    const accountId = 1;
    const mockTransactions = [
      { id: 1, amount: '100.00', notes: 'Test transaction 1', debit: accountId },
      { id: 2, amount: '200.00', notes: 'Test transaction 2', credit: accountId }
    ];

    axios.get.mockResolvedValue({ data: mockTransactions });

    const result = await getTransactionsByAccount(accountId);

    expect(axios.get).toHaveBeenCalledWith(`/transactions/?account=${accountId}`);
    expect(result).toEqual(mockTransactions);
  });

  it('should create a transaction', async () => {
    const transactionData = {
      date: '2023-01-01',
      amount: '100.00',
      debit: 1,
      credit: 2,
      notes: 'New transaction'
    };

    const mockResponse = { ...transactionData, id: 1 };
    axios.post.mockResolvedValue({ data: mockResponse });

    const result = await createTransaction(transactionData);

    expect(axios.post).toHaveBeenCalledWith('/transactions/', transactionData);
    expect(result).toEqual(mockResponse);
  });

  it('should update a transaction', async () => {
    const id = 1;
    const transactionData = {
      date: '2023-01-01',
      amount: '150.00',
      debit: 1,
      credit: 2,
      notes: 'Updated transaction'
    };

    const mockResponse = { ...transactionData, id };
    axios.put.mockResolvedValue({ data: mockResponse });

    const result = await updateTransaction(id, transactionData);

    expect(axios.put).toHaveBeenCalledWith(`/transactions/${id}/`, transactionData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete a transaction', async () => {
    const id = 1;

    axios.delete.mockResolvedValue({});

    const result = await deleteTransaction(id);

    expect(axios.delete).toHaveBeenCalledWith(`/transactions/${id}/`);
    expect(result).toBe(true);
  });

  it('should update transaction status', async () => {
    const id = 1;
    const status = 'reconciled';

    const mockResponse = { id, status };
    axios.patch.mockResolvedValue({ data: mockResponse });

    const result = await updateTransactionStatus(id, status);

    expect(axios.patch).toHaveBeenCalledWith(`/transactions/${id}/update_status/`, { status });
    expect(result).toEqual(mockResponse);
  });

  it('should bulk update transactions', async () => {
    const ids = [1, 2, 3];
    const updateData = { notes: 'Bulk updated', status: 'categorized' };
    const selectedAccountId = 1;

    const mockResponse = { detail: 'Successfully updated 3 transactions' };
    axios.post.mockResolvedValue({ data: mockResponse });

    const result = await bulkUpdateTransactions(ids, updateData, selectedAccountId);

    expect(axios.post).toHaveBeenCalledWith(
      `/transactions/bulk_update/?account=${selectedAccountId}`,
      {
        ids: ids.map(Number),
        selectedAccountId: Number(selectedAccountId),
        ...updateData
      }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle bulk update with category', async () => {
    const ids = [1, 2];
    const updateData = { category: 5 };
    const selectedAccountId = 1;

    const mockResponse = { detail: 'Successfully updated 2 transactions' };
    axios.post.mockResolvedValue({ data: mockResponse });

    const result = await bulkUpdateTransactions(ids, updateData, selectedAccountId);

    expect(axios.post).toHaveBeenCalledWith(
      `/transactions/bulk_update/?account=${selectedAccountId}`,
      {
        ids: ids.map(Number),
        selectedAccountId: Number(selectedAccountId),
        category: Number(updateData.category)
      }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should upload CSV transactions', async () => {
    const fileContent = 'date,amount,description\n2023-01-01,100.00,Test';
    const columnMapping = { date: 0, amount: 1, description: 2 };
    const selectedAccountId = 1;

    const mockResponse = {
      created: 1,
      errors: [],
      message: 'Successfully imported 1 transaction'
    };
    axios.post.mockResolvedValue({ data: mockResponse });

    const result = await uploadCSVTransactions(fileContent, columnMapping, selectedAccountId);

    expect(axios.post).toHaveBeenCalledWith('/transactions/upload_csv/', {
      file_content: fileContent,
      column_mapping: columnMapping,
      selected_account_id: selectedAccountId
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when fetching transactions', async () => {
    const error = new Error('Network error');
    axios.get.mockRejectedValue(error);

    await expect(getTransactions()).rejects.toThrow('Network error');
    expect(axios.get).toHaveBeenCalledWith('/transactions/');
  });

  it('should handle errors when creating transactions', async () => {
    const error = new Error('Validation error');
    axios.post.mockRejectedValue(error);

    const transactionData = {
      date: '2023-01-01',
      amount: '100.00',
      debit: 1,
      credit: 2,
      notes: 'New transaction'
    };

    await expect(createTransaction(transactionData)).rejects.toThrow('Validation error');
    expect(axios.post).toHaveBeenCalledWith('/transactions/', transactionData);
  });

  it('should validate bulk update inputs', async () => {
    // Test with empty IDs
    await expect(bulkUpdateTransactions([], { notes: 'test' }, 1))
      .rejects.toThrow('Transaction IDs must be a non-empty array');

    // Test with empty update data
    await expect(bulkUpdateTransactions([1, 2], {}, 1))
      .rejects.toThrow('Update data is required');
  });
});

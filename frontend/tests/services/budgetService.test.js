import {
  createBudget,
  deleteBudget,
  getBudgets,
  getBudgetsByMonth,
  updateBudget
} from '../../services/budgetService';

import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Budget Service', () => {
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

  it('should get all budgets', async () => {
    const mockBudgets = [
      { id: 1, month: '2023-01-01', account: 1, budgeted_amount: '1000.00', actual_amount: '950.00' },
      { id: 2, month: '2023-01-01', account: 2, budgeted_amount: '3000.00', actual_amount: '3200.00' }
    ];

    axios.get.mockResolvedValue({ data: mockBudgets });

    const result = await getBudgets();

    expect(axios.get).toHaveBeenCalledWith('/budgets/');
    expect(result).toEqual(mockBudgets);
  });

  it('should get budgets by month', async () => {
    const month = '2023-01-01';
    const mockBudgets = [
      { id: 1, month, account: 1, budgeted_amount: '1000.00', actual_amount: '950.00' },
      { id: 2, month, account: 2, budgeted_amount: '3000.00', actual_amount: '3200.00' }
    ];

    axios.get.mockResolvedValue({ data: mockBudgets });

    const result = await getBudgetsByMonth(month);

    expect(axios.get).toHaveBeenCalledWith(`/budgets/?month=${month}`);
    expect(result).toEqual(mockBudgets);
  });

  it('should create a budget', async () => {
    const budgetData = {
      month: '2023-02-01',
      account: 1,
      budgeted_amount: '1200.00'
    };

    const mockResponse = { ...budgetData, id: 3, actual_amount: '0.00' };
    axios.post.mockResolvedValue({ data: mockResponse });

    const result = await createBudget(budgetData);

    expect(axios.post).toHaveBeenCalledWith('/budgets/', budgetData);
    expect(result).toEqual(mockResponse);
  });

  it('should update a budget', async () => {
    const id = 1;
    const budgetData = {
      month: '2023-01-01',
      account: 1,
      budgeted_amount: '1500.00'
    };

    const mockResponse = { ...budgetData, id, actual_amount: '950.00' };
    axios.put.mockResolvedValue({ data: mockResponse });

    const result = await updateBudget(id, budgetData);

    expect(axios.put).toHaveBeenCalledWith(`/budgets/${id}/`, budgetData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete a budget', async () => {
    const id = 3;

    axios.delete.mockResolvedValue({});

    const result = await deleteBudget(id);

    expect(axios.delete).toHaveBeenCalledWith(`/budgets/${id}/`);
    expect(result).toBe(true);
  });

  it('should handle errors when fetching budgets', async () => {
    const error = new Error('Network error');
    axios.get.mockRejectedValue(error);

    await expect(getBudgets()).rejects.toThrow('Network error');
    expect(axios.get).toHaveBeenCalledWith('/budgets/');
  });

  it('should handle errors when creating budgets', async () => {
    const error = new Error('Validation error');
    axios.post.mockRejectedValue(error);

    const budgetData = {
      month: '2023-02-01',
      account: 1,
      budgeted_amount: '1200.00'
    };

    await expect(createBudget(budgetData)).rejects.toThrow('Validation error');
    expect(axios.post).toHaveBeenCalledWith('/budgets/', budgetData);
  });

  it('should handle errors when updating budgets', async () => {
    const id = 1;
    const error = new Error('Not found');
    axios.put.mockRejectedValue(error);

    const budgetData = {
      month: '2023-01-01',
      account: 1,
      budgeted_amount: '1500.00'
    };

    await expect(updateBudget(id, budgetData)).rejects.toThrow('Not found');
    expect(axios.put).toHaveBeenCalledWith(`/budgets/${id}/`, budgetData);
  });

  it('should handle errors when deleting budgets', async () => {
    const id = 3;
    const error = new Error('Not found');
    axios.delete.mockRejectedValue(error);

    await expect(deleteBudget(id)).rejects.toThrow('Not found');
    expect(axios.delete).toHaveBeenCalledWith(`/budgets/${id}/`);
  });

  it('should handle invalid month format', async () => {
    const invalidMonth = 'January 2023';

    await expect(getBudgetsByMonth(invalidMonth)).rejects.toThrow();
  });
});

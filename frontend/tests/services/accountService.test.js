import {
  checkSubtypeHasAccounts,
  createAccount,
  createSubAccountType,
  deleteAccount,
  deleteSubAccountType,
  getAccountById,
  getAccounts,
  getBankFeedAccounts,
  getSubAccountTypes,
  updateAccount,
  updateSubAccountType
} from '../../services/accountService';

import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Account Service', () => {
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

  it('should get all accounts', async () => {
    const mockAccounts = [
      { id: 1, name: 'Checking', type: 'Asset' },
      { id: 2, name: 'Rent', type: 'Expense' }
    ];

    axios.get.mockResolvedValue({ data: mockAccounts });

    const result = await getAccounts();

    expect(axios.get).toHaveBeenCalledWith('/accounts/');
    expect(result).toEqual(mockAccounts);
  });

  it('should get sub-account types', async () => {
    const mockSubTypes = [
      { id: 1, sub_type: 'Checking', account_type: 'Asset' },
      { id: 2, sub_type: 'Housing', account_type: 'Expense' }
    ];

    axios.get.mockResolvedValue({ data: mockSubTypes });

    const result = await getSubAccountTypes();

    expect(axios.get).toHaveBeenCalledWith('/subaccounttypes/');
    expect(result).toEqual(mockSubTypes);
  });

  it('should create a sub-account type', async () => {
    const subtypeData = {
      sub_type: 'Entertainment',
      account_type: 'Expense'
    };

    const mockResponse = { ...subtypeData, id: 3 };
    axios.post.mockResolvedValue({ data: mockResponse });

    const result = await createSubAccountType(subtypeData);

    expect(axios.post).toHaveBeenCalledWith('/subaccounttypes/', subtypeData);
    expect(result).toEqual(mockResponse);
  });

  it('should update a sub-account type', async () => {
    const id = 2;
    const subtypeData = {
      sub_type: 'Utilities',
      account_type: 'Expense'
    };

    const mockResponse = { ...subtypeData, id };
    axios.put.mockResolvedValue({ data: mockResponse });

    const result = await updateSubAccountType(id, subtypeData);

    expect(axios.put).toHaveBeenCalledWith(`/subaccounttypes/${id}/`, subtypeData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete a sub-account type', async () => {
    const id = 3;

    axios.delete.mockResolvedValue({});

    const result = await deleteSubAccountType(id);

    expect(axios.delete).toHaveBeenCalledWith(`/subaccounttypes/${id}/`);
    expect(result).toBe(true);
  });

  it('should check if a subtype has accounts', async () => {
    const id = 2;
    const mockAccounts = [
      { id: 5, name: 'Rent', type: 'Expense', sub_type: id }
    ];

    axios.get.mockResolvedValue({ data: mockAccounts });

    const result = await checkSubtypeHasAccounts(id);

    expect(axios.get).toHaveBeenCalledWith(`/accounts/?sub_type_id=${id}`);
    expect(result).toBe(true);
  });

  it('should return false if a subtype has no accounts', async () => {
    const id = 3;

    axios.get.mockResolvedValue({ data: [] });

    const result = await checkSubtypeHasAccounts(id);

    expect(axios.get).toHaveBeenCalledWith(`/accounts/?sub_type_id=${id}`);
    expect(result).toBe(false);
  });

  it('should create an account', async () => {
    const accountData = {
      name: 'Groceries',
      num: 4001,
      type: 'Expense',
      sub_type: 2,
      inBankFeed: false,
      icon: '🍎'
    };

    const mockResponse = { ...accountData, id: 6 };
    axios.post.mockResolvedValue({ data: mockResponse });

    const result = await createAccount(accountData);

    expect(axios.post).toHaveBeenCalledWith('/accounts/', accountData);
    expect(result).toEqual(mockResponse);
  });

  it('should update an account', async () => {
    const id = 6;
    const accountData = {
      name: 'Food & Groceries',
      num: 4001,
      type: 'Expense',
      sub_type: 2,
      inBankFeed: false,
      icon: '🍎'
    };

    const mockResponse = { ...accountData, id };
    axios.put.mockResolvedValue({ data: mockResponse });

    const result = await updateAccount(id, accountData);

    expect(axios.put).toHaveBeenCalledWith(`/accounts/${id}/`, accountData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete an account', async () => {
    const id = 6;

    axios.delete.mockResolvedValue({});

    const result = await deleteAccount(id);

    expect(axios.delete).toHaveBeenCalledWith(`/accounts/${id}/`);
    expect(result).toBe(true);
  });

  it('should get an account by ID', async () => {
    const id = 1;
    const mockAccount = {
      id,
      name: 'Checking',
      num: 1000,
      type: 'Asset',
      balance: '5000.00',
      reconciled_balance: '4500.00'
    };

    axios.get.mockResolvedValue({ data: mockAccount });

    const result = await getAccountById(id);

    expect(axios.get).toHaveBeenCalledWith(`/accounts/${id}/`);
    expect(result).toEqual(mockAccount);
  });

  it('should get bank feed accounts', async () => {
    const mockAccounts = [
      { id: 1, name: 'Checking', type: 'Asset', inBankFeed: true },
      { id: 3, name: 'Credit Card', type: 'Liability', inBankFeed: true }
    ];

    axios.get.mockResolvedValue({ data: mockAccounts });

    const result = await getBankFeedAccounts();

    expect(axios.get).toHaveBeenCalledWith('/accounts/?inBankFeed=true');
    expect(result).toEqual(mockAccounts);
  });

  it('should handle errors when fetching accounts', async () => {
    const error = new Error('Network error');
    axios.get.mockRejectedValue(error);

    await expect(getAccounts()).rejects.toThrow('Network error');
    expect(axios.get).toHaveBeenCalledWith('/accounts/');
  });

  it('should handle errors when creating accounts', async () => {
    const error = new Error('Validation error');
    axios.post.mockRejectedValue(error);

    const accountData = {
      name: 'Groceries',
      num: 4001,
      type: 'Expense',
      sub_type: 2
    };

    await expect(createAccount(accountData)).rejects.toThrow('Validation error');
    expect(axios.post).toHaveBeenCalledWith('/accounts/', accountData);
  });

  it('should handle errors when updating accounts', async () => {
    const id = 6;
    const error = new Error('Not found');
    axios.put.mockRejectedValue(error);

    const accountData = {
      name: 'Food & Groceries',
      num: 4001,
      type: 'Expense',
      sub_type: 2
    };

    await expect(updateAccount(id, accountData)).rejects.toThrow('Not found');
    expect(axios.put).toHaveBeenCalledWith(`/accounts/${id}/`, accountData);
  });
});

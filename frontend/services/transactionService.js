import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include the token in requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all transactions
export const getTransactions = async () => {
  try {
    const response = await apiClient.get('/transactions/');
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Get transactions for a specific account (either debit or credit)
export const getTransactionsByAccount = async (accountId) => {
  try {
    const response = await apiClient.get(`/transactions/?account=${accountId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching transactions for account ${accountId}:`, error);
    throw error;
  }
};

// Get bank feed accounts (accounts with inBankFeed=true)
// DEPRECATED: This function has been moved to accountService.js. Please import it from there instead.
export const getBankFeedAccounts = async () => {
  console.warn('DEPRECATED: getBankFeedAccounts in transactionService.js is deprecated. Please import it from accountService.js instead.');
  try {
    const response = await apiClient.get('/accounts/?inBankFeed=true');
    return response.data;
  } catch (error) {
    console.error('Error fetching bank feed accounts:', error);
    throw error;
  }
};

// Create a new transaction
export const createTransaction = async (transactionData) => {
  try {
    const response = await apiClient.post('/transactions/', transactionData);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Update an existing transaction
export const updateTransaction = async (id, transactionData) => {
  try {
    const response = await apiClient.put(`/transactions/${id}/`, transactionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error);
    throw error;
  }
};

// Delete a transaction
export const deleteTransaction = async (id) => {
  try {
    await apiClient.delete(`/transactions/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting transaction ${id}:`, error);
    throw error;
  }
};

// Update transaction status
export const updateTransactionStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/transactions/${id}/update_status/`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating transaction status: ${error}`);
    throw error;
  }
};

// Upload CSV file for transaction import
export const uploadCSVTransactions = async (fileContent, columnMapping, selectedAccountId) => {
  try {
    const response = await apiClient.post('/transactions/upload_csv/', {
      file_content: fileContent,
      column_mapping: columnMapping,
      selected_account_id: selectedAccountId
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading CSV transactions:', error);
    throw error;
  }
};

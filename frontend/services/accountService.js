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

// Get all accounts
export const getAccounts = async () => {
  try {
    const response = await apiClient.get('/accounts/');
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

// Get account types
export const getSubAccountTypes = async () => {
  try {
    const response = await apiClient.get('/subaccounttypes/');
    return response.data;
  } catch (error) {
    console.error('Error fetching account types:', error);
    throw error;
  }
};

// Create a new subtype
export const createSubAccountType = async (subtypeData) => {
  try {
    const response = await apiClient.post('/subaccounttypes/', subtypeData);
    return response.data;
  } catch (error) {
    console.error('Error creating subtype:', error);
    throw error;
  }
};

// Update an existing subtype
export const updateSubAccountType = async (id, subtypeData) => {
  try {
    const response = await apiClient.put(`/subaccounttypes/${id}/`, subtypeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating subtype ${id}:`, error);
    throw error;
  }
};

// Delete a subtype
export const deleteSubAccountType = async (id) => {
  try {
    await apiClient.delete(`/subaccounttypes/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting subtype ${id}:`, error);
    throw error;
  }
};

// Check if a subtype has accounts
export const checkSubtypeHasAccounts = async (id) => {
  try {
    console.log(`Checking if subtype ${id} has accounts via API...`);
    const response = await apiClient.get(`/accounts/?sub_type_id=${id}`);
    console.log(`API response for subtype ${id}:`, response.data);
    const hasAccounts = response.data.length > 0;
    console.log(`Subtype ${id} has accounts: ${hasAccounts}`);
    return hasAccounts;
  } catch (error) {
    console.error(`Error checking if subtype ${id} has accounts:`, error);
    throw error;
  }
};

// Create a new account
export const createAccount = async (accountData) => {
  try {
    const response = await apiClient.post('/accounts/', accountData);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

// Update an existing account
export const updateAccount = async (id, accountData) => {
  try {
    const response = await apiClient.put(`/accounts/${id}/`, accountData);
    return response.data;
  } catch (error) {
    console.error(`Error updating account ${id}:`, error);
    throw error;
  }
};

// Delete an account
export const deleteAccount = async (id) => {
  try {
    await apiClient.delete(`/accounts/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting account ${id}:`, error);
    throw error;
  }
};

// Get a specific account by ID (to refresh balance)
export const getAccountById = async (id) => {
  try {
    const response = await apiClient.get(`/accounts/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account ${id}:`, error);
    throw error;
  }
};

// Get bank feed accounts (accounts with inBankFeed=true)
export const getBankFeedAccounts = async () => {
  try {
    const response = await apiClient.get('/accounts/?inBankFeed=true');
    return response.data;
  } catch (error) {
    console.error('Error fetching bank feed accounts:', error);
    throw error;
  }
};

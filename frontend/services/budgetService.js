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

// Get all budgets
export const getBudgets = async () => {
  try {
    const response = await apiClient.get('/budgets/');
    return response.data;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
};

// Get budgets for a specific month
export const getBudgetsByMonth = async (month) => {
  try {
    const response = await apiClient.get(`/budgets/?month=${month}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching budgets for month ${month}:`, error);
    throw error;
  }
};

// Get budget for a specific account and month
export const getBudgetByAccountAndMonth = async (accountId, month) => {
  try {
    const response = await apiClient.get(`/budgets/?account=${accountId}&month=${month}`);
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error(`Error fetching budget for account ${accountId} and month ${month}:`, error);
    throw error;
  }
};

// Create a new budget
export const createBudget = async (budgetData) => {
  try {
    const response = await apiClient.post('/budgets/', budgetData);
    return response.data;
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
};

// Update an existing budget
export const updateBudget = async (id, budgetData) => {
  try {
    const response = await apiClient.put(`/budgets/${id}/`, budgetData);
    return response.data;
  } catch (error) {
    console.error(`Error updating budget ${id}:`, error);
    throw error;
  }
};

// Delete a budget
export const deleteBudget = async (id) => {
  try {
    await apiClient.delete(`/budgets/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting budget ${id}:`, error);
    throw error;
  }
};

// Create or update a budget
export const saveOrUpdateBudget = async (budgetData) => {
  try {
    // Check if a budget already exists for this account and month
    const existingBudgets = await getBudgetsByMonth(budgetData.month);
    const existingBudget = existingBudgets.find(b => b.account === budgetData.account);

    if (existingBudget) {
      // Update existing budget
      return await updateBudget(existingBudget.id, budgetData);
    } else {
      // Create new budget
      return await createBudget(budgetData);
    }
  } catch (error) {
    console.error('Error saving or updating budget:', error);
    throw error;
  }
};

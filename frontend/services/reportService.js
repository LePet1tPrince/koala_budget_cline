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

// Get transactions for a specific date range
export const getTransactionsByDateRange = async (startDate, endDate) => {
  try {
    // Ensure we have valid dates
    if (!startDate || !endDate) {
      console.warn('Missing date parameters in getTransactionsByDateRange');
      return [];
    }

    const response = await apiClient.get(`/transactions/?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching transactions for date range ${startDate} to ${endDate}:`, error);
    throw error;
  }
};

// Get transactions summed up to a specific date
export const getTransactionsSummedToDate = async (endDate) => {
  try {
    // Ensure we have a valid date
    if (!endDate) {
      console.warn('Missing date parameter in getTransactionsSummedToDate');
      return [];
    }

    const response = await apiClient.get(`/balances/?as_of_date=${endDate}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account balances as of ${endDate}:`, error);
    throw error;
  }
};

// Get flow report data
export const getFlowReportData = async (startDate, endDate) => {
  try {
    const response = await apiClient.get(`/reports/flow/?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching flow report data for ${startDate} to ${endDate}:`, error);
    throw error;
  }
};

// Get balance report data
export const getBalanceReportData = async (asOfDate) => {
  try {
    const response = await apiClient.get(`/reports/balance/?as_of_date=${asOfDate}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching balance report data as of ${asOfDate}:`, error);
    throw error;
  }
};

// Get saving goals report data
export const getSavingGoalsReport = async (asOfDate) => {
  try {
    // If no date is provided, the API will use today's date
    const dateParam = asOfDate ? `?as_of_date=${asOfDate}` : '';
    const response = await apiClient.get(`/reports/saving-goals/${dateParam}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching saving goals report data:', error);
    throw error;
  }
};

// Update saving goal target
export const updateSavingGoalTarget = async (savingId, target) => {
  try {
    const response = await apiClient.patch(`/savings/${savingId}/update_target/`, {
      target: target
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating saving goal target for ID ${savingId}:`, error);
    throw error;
  }
};

// Update saving goal balance
export const updateSavingGoalBalance = async (savingId, balance) => {
  try {
    const response = await apiClient.patch(`/savings/${savingId}/update_balance/`, {
      balance: balance
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating saving goal balance for ID ${savingId}:`, error);
    throw error;
  }
};

// Allocate remaining funds to a saving goal
export const allocateRemaining = async (savingId, leftToAssign) => {
  try {
    const response = await apiClient.patch(`/savings/${savingId}/allocate_remaining/`, {
      left_to_assign: leftToAssign
    });
    return response.data;
  } catch (error) {
    console.error(`Error allocating remaining funds to saving goal ID ${savingId}:`, error);
    throw error;
  }
};

// Get historical net worth data
export const getNetWorthHistory = async (startDate, endDate, interval = 'monthly') => {
  try {
    const response = await apiClient.get(
      `/reports/net-worth-history/?start_date=${startDate}&end_date=${endDate}&interval=${interval}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching net worth history:`, error);
    throw error;
  }
};

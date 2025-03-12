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

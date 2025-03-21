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

// Get all merchants
export const getMerchants = async () => {
  try {
    const response = await apiClient.get('/merchants/');
    return response.data;
  } catch (error) {
    console.error('Error fetching merchants:', error);
    throw error;
  }
};

// Get a specific merchant by ID
export const getMerchantById = async (id) => {
  try {
    const response = await apiClient.get(`/merchants/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching merchant ${id}:`, error);
    throw error;
  }
};

// Create a new merchant
export const createMerchant = async (merchantData) => {
  try {
    const response = await apiClient.post('/merchants/', merchantData);
    return response.data;
  } catch (error) {
    console.error('Error creating merchant:', error);
    throw error;
  }
};

// Update an existing merchant
export const updateMerchant = async (id, merchantData) => {
  try {
    const response = await apiClient.put(`/merchants/${id}/`, merchantData);
    return response.data;
  } catch (error) {
    console.error(`Error updating merchant ${id}:`, error);
    throw error;
  }
};

// Delete a merchant
export const deleteMerchant = async (id) => {
  try {
    await apiClient.delete(`/merchants/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting merchant ${id}:`, error);
    throw error;
  }
};

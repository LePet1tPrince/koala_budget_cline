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

// Create a Plaid Link token
export const createLinkToken = async (accountId) => {
  try {
    const response = await apiClient.post('/plaid/api/create_link_token/', {
      account_id: accountId
    });
    return response.data.link_token;
  } catch (error) {
    console.error('Error creating Plaid Link token:', error);
    throw error;
  }
};

// Exchange a public token for an access token
export const exchangePublicToken = async (publicToken, accountId, institutionId) => {
  try {
    const response = await apiClient.post('/plaid/api/exchange_public_token/', {
      public_token: publicToken,
      account_id: accountId,
      institution_id: institutionId
    });
    return response.data;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
};

// Get Plaid accounts for an access token
export const getPlaidAccounts = async (accessToken) => {
  try {
    const response = await apiClient.post('/plaid/api/get_plaid_accounts/', {
      access_token: accessToken
    });
    return response.data.accounts;
  } catch (error) {
    console.error('Error getting Plaid accounts:', error);
    throw error;
  }
};

// Map app accounts to Plaid accounts
export const mapAccounts = async (accessToken, itemId, institutionName, accountMapping) => {
  try {
    // Validate inputs
    if (!accessToken) throw new Error('Access token is required');
    if (!itemId) throw new Error('Item ID is required');
    if (!institutionName) throw new Error('Institution name is required');
    if (!accountMapping || Object.keys(accountMapping).length === 0) {
      throw new Error('Account mapping is required and must contain at least one mapping');
    }

    // Log the request for debugging
    console.log('Sending map_accounts request with:', {
      access_token: accessToken ? '[REDACTED]' : null,
      item_id: itemId,
      institution_name: institutionName,
      account_mapping: accountMapping
    });

    const response = await apiClient.post('/plaid/api/map_accounts/', {
      access_token: accessToken,
      item_id: itemId,
      institution_name: institutionName,
      account_mapping: accountMapping
    });

    // Log the response for debugging
    console.log('Received map_accounts response:', response.data);

    return response.data;
  } catch (error) {
    console.error('Error mapping accounts:', error);

    // Add more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);

      // Throw a more descriptive error
      if (error.response.data && error.response.data.detail) {
        throw new Error(`Server error: ${error.response.data.detail}`);
      }
    }

    throw error;
  }
};

// Sync transactions for a Plaid Item
export const syncTransactions = async (plaidItemId) => {
  try {
    const response = await apiClient.post('/plaid/api/sync_transactions/', {
      plaid_item_id: plaidItemId
    });
    return response.data;
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw error;
  }
};

// Get all Plaid Items for the current user
export const getPlaidItems = async () => {
  try {
    const response = await apiClient.get('/plaid/items/');
    return response.data;
  } catch (error) {
    console.error('Error fetching Plaid Items:', error);
    throw error;
  }
};

// Get a specific Plaid Item
export const getPlaidItem = async (id) => {
  try {
    const response = await apiClient.get(`/plaid/items/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Plaid Item ${id}:`, error);
    throw error;
  }
};

// Disconnect a Plaid Item
export const disconnectPlaidItem = async (id) => {
  try {
    const response = await apiClient.post(`/plaid/items/${id}/disconnect/`);
    return response.data;
  } catch (error) {
    console.error(`Error disconnecting Plaid Item ${id}:`, error);
    throw error;
  }
};

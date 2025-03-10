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

// Handle token refresh when we get 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error.response exists before accessing its status property
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('token', access);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Login function
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/token/`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Register function
export const register = async (email, password, first_name, last_name) => {
  try {
    console.log('Registering user with:', { email, password: '********', first_name, last_name });
    console.log('API URL:', API_URL);

    // Add timeout and additional headers for debugging
    const response = await axios.post(`${API_URL}/users/`, {
      email,
      password,
      first_name,
      last_name
    }, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    // Properly handle API errors without assuming response exists
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw error;
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server. Please try again later.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('An error occurred during registration: ' + error.message);
    }
  }
};

// Refresh token
export const refreshToken = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/token/refresh/`, {
      refresh: token
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  const response = await apiClient.get('/users/me/');
  return response.data;
};

// Logout function (client-side only)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

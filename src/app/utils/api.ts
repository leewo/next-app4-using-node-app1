import { useAuth } from '../components/authcontext';

const api = async (url: string, options: RequestInit = {}) => {
  const { refreshToken } = useAuth();
  
  const makeRequest = async () => {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    if (response.status === 401) {
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        // Retry the original request
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      } else {
        throw new Error('Authentication failed');
      }
    }

    return response;
  };

  return makeRequest();
};

export default api;

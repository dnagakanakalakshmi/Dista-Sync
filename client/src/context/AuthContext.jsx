import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if app is embedded (via source=embedded_app parameter)
  // and get the specific shop if provided
  const { isEmbedded, embedShop, embedEmail } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const shop = urlParams.get('shop');
    const email = urlParams.get('email');
    return {
      isEmbedded: source === 'embedded_app',
      embedShop: source === 'embedded_app' ? shop : null,
      embedEmail: source === 'embedded_app' ? email : null
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // If embedded app mode, authenticate with email from URL
      if (isEmbedded && embedEmail) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/embedded`, {
            email: embedEmail,
            shop: embedShop
          });
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
          console.error('Embedded authentication failed:', error);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Normal authentication flow - check localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [isEmbedded, embedEmail, embedShop]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isEmbedded, embedShop, embedEmail }}>
      {children}
    </AuthContext.Provider>
  );
};


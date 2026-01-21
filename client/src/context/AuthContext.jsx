import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const AuthContext = createContext();

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
  const { isEmbedded, embedShop } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const shop = urlParams.get('shop');
    return {
      isEmbedded: source === 'embedded_app',
      embedShop: source === 'embedded_app' ? shop : null
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isEmbedded, embedShop }}>
      {children}
    </AuthContext.Provider>
  );
};


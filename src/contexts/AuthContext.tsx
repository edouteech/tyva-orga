import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { env } from '../config/env';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Configuration d'Axios
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tyva_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tyva_token');
      localStorage.removeItem('tyva_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Propriétés du provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider d'authentification
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur est authentifié au chargement
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('tyva_token');
      const storedUser = localStorage.getItem('tyva_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Vérifier si le token est encore valide
          verifyToken(storedToken);
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          logout();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Vérifier la validité du token
  const verifyToken = async (token: string) => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('tyva_user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Token invalide:', error);
      logout();
    }
  };

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data.token && response.data.user) {
        const { token: authToken, user: authUser } = response.data;

        // Stocker les données d'authentification
        localStorage.setItem('tyva_token', authToken);
        localStorage.setItem('tyva_user', JSON.stringify(authUser));

        setToken(authToken);
        setUser(authUser);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    // Appeler l'API de déconnexion (optionnel)
    if (token) {
      api.post('/auth/logout').catch(() => {
        // Ignorer les erreurs de déconnexion
      });
    }

    // Nettoyer le stockage local
    localStorage.removeItem('tyva_token');
    localStorage.removeItem('tyva_user');

    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export de l'instance Axios configurée pour une utilisation dans d'autres composants
export { api };

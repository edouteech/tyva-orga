import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch, initializeAuth } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Initialiser l'authentification au chargement
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4A94E3]/20 via-[#4A94E3]/10 to-[#5F9EA0]/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#4A94E3] mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Chargement...</h2>
          <p className="text-gray-500">Vérification de l'authentification</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Afficher le contenu protégé si authentifié
  return <>{children}</>;
};

export default ProtectedRoute;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector, loginUser, clearError } from "../../store";
import { getEventManagementUrl } from "../../utils/eventIdentifier";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentEvent } = useAppSelector((state) => state.event);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname;
      const defaultPath = currentEvent
        ? getEventManagementUrl(currentEvent, "dashboard")
        : "/";

      navigate(from || defaultPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location, currentEvent]);

  // Nettoyer les erreurs au démontage
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // La gestion de l'état loading et error est faite via Redux
    await dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A94E3]/20 via-[#4A94E3]/10 to-[#5F9EA0]/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo et Titre */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/logo-horizontal.png"
              alt="Tyva Events"
              className="h-10 w-auto"
            />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Connexion
          </h3>
          <p className="text-gray-600">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Nettoyer l'erreur quand l'utilisateur tape
                  if (error) dispatch(clearError());
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A94E3] focus:border-transparent transition-all duration-200 outline-none"
                placeholder="admin@tyva.com"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Nettoyer l'erreur quand l'utilisateur tape
                  if (error) dispatch(clearError());
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A94E3] focus:border-transparent transition-all duration-200 outline-none"
                placeholder="••••••••"
              />
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#4A94E3] focus:ring-[#4A94E3] border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Se souvenir de moi
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  /* TODO: Implémenter mot de passe oublié */
                }}
                className="text-sm text-[#4A94E3] hover:text-[#3A7BC8] transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#4A94E3] to-[#5F9EA0] text-white py-3 px-4 rounded-xl font-semibold hover:from-[#3A7BC8] hover:to-[#4A94E3] transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Connexion en cours...
                </div>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 Tyva. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

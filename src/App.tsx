import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import EventManagementLayout from "./components/EventManagementLayout";
import Login from "./pages/auth/login";
import EventDashboard from "./pages/event-management/dashboard/index";
import EventUsersIndex from "./pages/event-management/users";
import Invitations from "./pages/event-management/invitations/index";
import { eventsAPI } from "./api";
import {
  useAppDispatch,
  useAppSelector,
  setCurrentEvent,
  clearCurrentEvent,
  logoutUser,
} from "./store/store";
import { getEventManagementUrl } from "./utils/eventIdentifier";

const RedirectToEventDashboard: React.FC = () => {
  const { currentEvent } = useAppSelector((state) => state.event);
  const { eventId } = useParams();

  const target = currentEvent
    ? getEventManagementUrl(currentEvent, "dashboard")
    : eventId
      ? `/gestion-evenement/${eventId}/dashboard`
      : "/";

  return <Navigate to={target} replace />;
};

const EventAutoSelect: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentEvent } = useAppSelector((state) => state.event);
  const { user } = useAppSelector((state) => state.auth);
  const currentEventRef = React.useRef(currentEvent);
  currentEventRef.current = currentEvent;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = async () => {
    dispatch(clearCurrentEvent());
    await dispatch(logoutUser());
    navigate("/login");
  };

  /** Charge la liste via `GET /events` (filtrage organisateur côté API) et choisit un événement valide. */
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const list = await eventsAPI.getAll();
        if (cancelled) return;

        const fromStore = currentEventRef.current;
        const stillAllowed =
          fromStore &&
          list.some((e) => e.event_id === fromStore.event_id)
            ? list.find((e) => e.event_id === fromStore.event_id)!
            : null;
        const picked = stillAllowed ?? list[0] ?? null;

        if (!picked) {
          setError("Aucun événement disponible.");
          return;
        }

        dispatch(setCurrentEvent(picked));
        navigate(getEventManagementUrl(picked, "dashboard"), { replace: true });
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les événements.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen bg-[#EDF7F7]">
      <header className="bg-gradient-to-r from-[#023C40] via-[#2BA85F] to-[#36CC76] shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-white">Gestion d’événement</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-green-100">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
                title="Se déconnecter"
              >
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {loading ? (
              <>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Chargement…
                </h1>
                <p className="text-gray-600 mb-6">
                  Nous récupérons vos événements.
                </p>
              </>
            ) : error ? (
              <>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Aucun événement disponible
                </h1>
                <p className="text-gray-600 mb-6">{error}</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Redirection…
                </h1>
                <p className="text-gray-600 mb-6">
                  Un événement a été sélectionné, redirection vers le dashboard.
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/", { replace: true })}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Rafraîchir
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 rounded-xl bg-[#36CC76] text-white hover:bg-[#2BA85F] transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la déconnexion
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex-1 px-4 py-2 bg-[#36CC76] text-white rounded-xl hover:bg-[#2BA85F] transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes publiques pour l'authentification */}
        <Route path="/login" element={<Login />} />

        {/* Route par défaut - redirection vers dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <EventAutoSelect />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées avec layout */}
        <Route
          path="/gestion-evenement/:eventId/ticket-product/:ruleId"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/dashboard"
          element={
            <ProtectedRoute>
              <EventManagementLayout>
                <EventDashboard />
              </EventManagementLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/activites"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/activites/:activityId"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/tickets"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/tickets/:ticketId"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/produits"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/produits/:productId"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/parkings"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/parkings/:parkingId"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/points-de-vente"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/points-de-vente/livraison/:deliveryPointId"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/points-de-vente/:id"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/points-livraison"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/points-livraison/:id"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/commandes"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/commandes/:orderId"
          element={
            <ProtectedRoute>
              <RedirectToEventDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/utilisateurs"
          element={
            <ProtectedRoute>
              <EventManagementLayout>
                <EventUsersIndex />
              </EventManagementLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-evenement/:eventId/invitations"
          element={
            <ProtectedRoute>
              <EventManagementLayout>
                <Invitations />
              </EventManagementLayout>
            </ProtectedRoute>
          }
        />

        {/* Route 404 - page non trouvée */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-[#4A94E3]/20 via-[#4A94E3]/10 to-[#5F9EA0]/20 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-6">Page non trouvée</p>
                  <a
                    href="/"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Retourner à l'accueil
                  </a>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

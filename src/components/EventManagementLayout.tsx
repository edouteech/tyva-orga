import React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useAppSelector,
  useAppDispatch,
  clearCurrentEvent,
  setCurrentEvent,
  logoutUser,
} from "../store/store";
import { eventsAPI } from "../api";
import type { Event } from "../lib";
import {
  getEventIdentifier,
  getEventManagementUrl,
} from "../utils/eventIdentifier";
import {
  LayoutDashboard,
  Users,
  LogOut,
} from "lucide-react";

interface EventManagementLayoutProps {
  children: React.ReactNode;
}

const EventManagementLayout: React.FC<EventManagementLayoutProps> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const dispatch = useAppDispatch();
  const { currentEvent } = useAppSelector((state) => state.event);
  const { user } = useAppSelector((state) => state.auth);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [bootstrapLoading, setBootstrapLoading] = React.useState(false);
  const [bootstrapError, setBootstrapError] = React.useState<string | null>(null);

  const handleLogout = async () => {
    // Nettoyer l'événement courant + token, puis rediriger
    dispatch(clearCurrentEvent());
    await dispatch(logoutUser());
    navigate("/login");
  };

  // Si on arrive directement sur /gestion-evenement/:eventId/... sans passer par "/",
  // on hydrate l'événement courant depuis l'API pour éviter un état "aucun événement" à tort.
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (currentEvent || !eventId) return;
      const parsedId = Number(eventId);
      if (!Number.isFinite(parsedId) || parsedId <= 0) return;

      try {
        setBootstrapLoading(true);
        setBootstrapError(null);
        const e = await eventsAPI.getById(parsedId);
        if (cancelled) return;
        dispatch(setCurrentEvent(e));
      } catch (err: unknown) {
        if (cancelled) return;
        setBootstrapError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l'événement.",
        );
      } finally {
        if (!cancelled) setBootstrapLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [currentEvent, dispatch, eventId]);

  React.useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    const params =
      currentEvent?.organizer_id != null
        ? { organizer_id: currentEvent.organizer_id }
        : undefined;
    eventsAPI
      .getAll(params)
      .then((list) => {
        if (cancelled) return;
        setEvents(list);
      })
      .catch(() => {
        if (cancelled) return;
        setEvents([]);
      })
      .finally(() => {
        if (cancelled) return;
        setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentEvent?.organizer_id]);

  const eventOptions = React.useMemo(() => {
    // Garantit que l'événement courant est présent dans la liste (même si la requête échoue)
    const map = new Map<number, Event>();
    for (const e of events) map.set(e.event_id, e);
    if (currentEvent) map.set(currentEvent.event_id, currentEvent as Event);
    return Array.from(map.values());
  }, [events, currentEvent]);

  const handleSwitchEvent = (identifier: string) => {
    const next = eventOptions.find((e) => getEventIdentifier(e) === identifier);
    if (!next) return;
    dispatch(setCurrentEvent(next));
    navigate(getEventManagementUrl(next, "dashboard"));
  };

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-[#EDF7F7]">
        <header className="bg-gradient-to-r from-[#023C40] via-[#2BA85F] to-[#36CC76] shadow-lg">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-white">
                    Gestion d’événement
                  </p>
                  <p className="text-xs text-white/80">
                    Aucun événement sélectionné
                  </p>
                </div>
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
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {bootstrapLoading ? (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Chargement de l’événement…
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Un instant, nous récupérons les informations de l’événement.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Aucun événement disponible
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {bootstrapError
                      ? bootstrapError
                      : "Votre compte n’a pour le moment accès à aucun événement. Si vous pensez que c’est une erreur, contactez un administrateur."}
                  </p>
                </>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/", { replace: true })}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Revenir à l’accueil
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
  }

  const menuItems = [
    {
      path: getEventManagementUrl(currentEvent, "dashboard"),
      label: "Dashboard",
      icon: LayoutDashboard,
    },
  ];

  const isActiveRoute = (path: string) => {
    // Consider nested pages (e.g., ticket details) as part of the parent section
    if (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    ) {
      return true;
    }

    // Special case: ticket-product pages belong to the tickets section
    if (
      path.includes("/tickets") &&
      location.pathname.includes("/ticket-product")
    ) {
      return true;
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-[#EDF7F7]">
      {/* Header horizontal avec gradient */}
      <header className="bg-gradient-to-r from-[#023C40] via-[#2BA85F] to-[#36CC76] shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Section gauche : Retour + Nom événement */}
            <div className="flex items-center gap-6">
              <button
                className="flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                <span className="text-sm font-medium">
                  Evénement
                </span>
              </button>

              <div className="h-8 w-px bg-white/20"></div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 mb-1">
                  <label
                    htmlFor="event-switcher"
                    className="text-xs text-white/80 font-medium"
                  >
                    Événement
                  </label>
                  <select
                    id="event-switcher"
                    value={getEventIdentifier(currentEvent)}
                    onChange={(e) => handleSwitchEvent(e.target.value)}
                    disabled={eventsLoading}
                    className="min-w-[260px] max-w-[420px] px-3 py-2 rounded-lg bg-white/15 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
                    aria-label="Changer d'événement"
                  >
                    {eventOptions.map((e) => (
                      <option
                        key={e.event_id}
                        value={getEventIdentifier(e)}
                        className="text-gray-900"
                      >
                        {e.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(getEventManagementUrl(currentEvent, "utilisateurs"))
                    }
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
                    title="Afficher les utilisateurs"
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Utilisateurs</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    {currentEvent.category}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentEvent.status === "published"
                        ? "bg-green-400/20 text-green-100"
                        : currentEvent.status === "draft"
                          ? "bg-yellow-400/20 text-yellow-100"
                          : "bg-gray-400/20 text-gray-100"
                    }`}
                  >
                    {currentEvent.status === "published"
                      ? "Publié"
                      : currentEvent.status === "draft"
                        ? "Brouillon"
                        : currentEvent.status === "cancelled"
                          ? "Annulé"
                          : "Archivé"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section droite : Info utilisateur */}
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
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation horizontale avec design amélioré */}
        <nav className="bg-white/5 backdrop-blur-sm border-t border-white/10">
          <div className="px-6">
            <div className="flex space-x-1">
              {menuItems.map((item) => {
                const isActive = isActiveRoute(item.path);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 py-4 px-6 rounded-t-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-[#36CC76] shadow-lg transform -translate-y-0.5"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${isActive ? "text-[#36CC76]" : ""}`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Contenu principal avec padding ajusté */}
      <main className="flex-1 p-8">
        <div className="mx-auto">{children}</div>
      </main>

      {/* Modal de confirmation de déconnexion */}
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

export default EventManagementLayout;

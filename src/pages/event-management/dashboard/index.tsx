import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/store";
import { Ticket, Package, ShoppingCart, TrendingUp, MapPin } from "lucide-react";
import { statisticsAPI, invitationsAPI, importFailuresAPI, accreditationsAPI } from "../../../api/api";

const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

const EventDashboard: React.FC = () => {
  const { currentEvent } = useAppSelector((state) => state.event);
  const [statsData, setStatsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [dbImportFailures, setDbImportFailures] = useState<any[]>([]);
  const [accreditations, setAccreditations] = useState<any[]>([]);

  const isUnlimitedValue = (value: unknown) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim().toLowerCase() === "unlimited") {
      return true;
    }
    return false;
  };

  const formatRemaining = (value: unknown) => {
    if (isUnlimitedValue(value)) return "Illimité";
    if (typeof value === "number") return value.toLocaleString("fr-FR");
    return String(value);
  };

  const formatTicketsRemainingSummary = () => {
    const details = statsData?.tickets?.details;

    if (!Array.isArray(details) || details.length === 0) {
      return formatRemaining(statsData?.tickets?.total_remaining ?? 0);
    }

    let unlimitedCount = 0;
    for (const t of details) {
      if (isUnlimitedValue(t?.quantity_remaining)) unlimitedCount += 1;
    }

    const allUnlimited = unlimitedCount === details.length;
    const hasUnlimited = unlimitedCount > 0;

    if (allUnlimited) return "Illimité";

    const totalRemaining = statsData?.tickets?.total_remaining;
    const knownTotal =
      typeof totalRemaining === "number" && Number.isFinite(totalRemaining)
        ? totalRemaining
        : 0;

    if (hasUnlimited) return `${knownTotal.toLocaleString("fr-FR")} + Illimité`;
    return knownTotal.toLocaleString("fr-FR");
  };

  useEffect(() => {
    if (!currentEvent) return;
    setLoading(true);
    setError(null);
    statisticsAPI
      .getByEvent(currentEvent.event_id || currentEvent.slug)
      .then((data) => {
        setStatsData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Erreur lors du chargement des statistiques");
        setLoading(false);
      });

    // Charger les invitations
    invitationsAPI.getAll({ event_id: currentEvent.event_id })
      .then((data) => {
        setInvitations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des invitations:", err);
      });

    // Charger les échecs d'importation
    importFailuresAPI.getAll({ event_id: currentEvent.event_id, status: "pending" })
      .then((data) => {
        setDbImportFailures(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des échecs d'importation:", err);
      });

    // Charger les accréditations
    accreditationsAPI.getAll({ event_id: currentEvent.event_id })
      .then((data) => {
        setAccreditations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des accréditations:", err);
      });
  }, [currentEvent]);

  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Séparation des stats en blocs distincts
  const globalStats = [
    {
      title: "Revenu total",
      value: statsData?.total_revenue?.toLocaleString() ?? "0",
      icon: TrendingUp,
      color: "bg-indigo-700",
      path: "revenu-total",
      description: "Somme des ventes tickets + produits",
    },
    {
      title: "Ventes totales",
      value: statsData?.total_sales?.toLocaleString() ?? "0",
      icon: ShoppingCart,
      color: "bg-indigo-500",
      path: "ventes-totales",
      description: "Nombre total de tickets et produits vendus",
    },
  ];

  const productStats = [
    {
      title: "Produits vendus",
      value: statsData?.products?.total_sales?.toLocaleString() ?? "0",
      icon: Package,
      color: "bg-[#023c40]",
      path: "produits-vendus",
      description: "Nombre de produits vendus",
    },
    {
      title: "Revenu produits",
      value: statsData?.products?.total_revenue?.toLocaleString() ?? "0",
      icon: Package,
      color: "bg-[#023c40]",
      path: "revenu-produits",
      description: "Revenu généré par les produits",
    },
    {
      title: "Produits restants",
      value: statsData?.products?.total_remaining?.toLocaleString() ?? "0",
      icon: Package,
      color: "bg-[#023c40]",
      path: "produits-restants",
      description: "Nombre de produits restants",
    },
  ];

  const parkingStats = [
    {
      title: "Revenu parking",
      value: statsData?.parking?.total_revenue?.toLocaleString() ?? "0",
      icon: MapPin,
      color: "bg-orange-600",
      path: "parking-revenu",
      description: "Chiffre d'affaires du parking",
    },
    {
      title: "Ventes parking",
      value: statsData?.parking?.total_sales?.toLocaleString() ?? "0",
      icon: MapPin,
      color: "bg-orange-500",
      path: "parking-ventes",
      description: "Nombre de places vendues",
    },
    {
      title: "Places restantes",
      value: statsData?.parking?.total_remaining?.toLocaleString() ?? "0",
      icon: MapPin,
      color: "bg-orange-400",
      path: "parking-restant",
      description: "Capacité restante",
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 md:px-4">
      {/* Statistiques globales */}
      <section className="py-1 md:py-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded bg-indigo-600 block" />
          <h2 className="text-xl font-semibold text-gray-700 tracking-tight">
            Vue d'ensemble
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {globalStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.path}
                className="relative bg-white rounded-xl shadow group p-4 flex flex-col justify-between min-h-[80px] border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <span
                  className={`absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`}
                >
                  <Icon
                    className={`w-12 h-12 ${stat.color.replace("bg-", "text-")}`}
                  />
                </span>
                <span className="text-xs text-gray-500 font-medium mb-1 z-10">
                  {stat.title}
                </span>
                <span className="text-2xl font-bold text-gray-800 z-10">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Statistiques billetterie */}
      <section className="py-1 md:py-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded bg-green-600 block" />
          <h2 className="text-xl font-semibold text-green-700 tracking-tight">
            Billetterie
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
            <span className="text-xs text-gray-500 font-medium mb-1">
              CA billetterie
            </span>
            <span className="text-xl font-bold text-gray-900">
              {statsData?.tickets?.total_revenue?.toLocaleString() ?? "0"} FCFA
            </span>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
            <span className="text-xs text-gray-500 font-medium mb-1">
              Tickets vendus
            </span>
            <span className="text-xl font-bold text-gray-900">
              {statsData?.tickets?.total_sales?.toLocaleString() ?? "0"}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
            <span className="text-xs text-gray-500 font-medium mb-1">
              Tickets restants
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatTicketsRemainingSummary()}
            </span>
          </div>
        </div>

        {/* Répartition par type de ticket */}
        {Array.isArray(statsData?.tickets?.details) &&
          statsData.tickets.details.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-green-400 block" /> Par
                type de ticket
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statsData.tickets.details.map((ticket: any) => (
                  <div
                    key={ticket.ticket_id}
                    className="bg-white rounded-xl p-4 shadow border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-green-50 rounded-full p-2">
                        <Ticket className="w-6 h-6 text-green-600" />
                      </span>
                      <span className="font-semibold text-green-700 text-base">
                        {ticket.ticket_name}
                      </span>
                      <span className="ml-2 text-gray-400 text-xs">
                        {ticket.price} FCFA
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <span className="bg-green-50 text-green-900 px-2 py-0.5 rounded-full font-semibold">
                        Vendus: {ticket.quantity_sold}
                      </span>
                      <span className="bg-green-50 text-green-900 px-2 py-0.5 rounded-full font-semibold">
                        Restants: {formatRemaining(ticket.quantity_remaining)}
                      </span>
                      <span className="bg-green-50 text-green-900 px-2 py-0.5 rounded-full font-semibold">
                        CA: {ticket.revenue} FCFA
                      </span>
                      <span className="bg-green-50 text-green-900 px-2 py-0.5 rounded-full font-semibold">
                        Présence: {ticket.participation_rate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Ventes par canal */}
        {Array.isArray(statsData?.tickets?.sales_by_source) &&
          statsData.tickets.sales_by_source.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-blue-400 block" /> Ventes
                par canal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statsData.tickets.sales_by_source.map(
                  (source: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-4 shadow border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 rounded-full p-2">
                          <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </span>
                        <span className="font-semibold text-blue-700 text-base">
                          {source.source}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center text-xs">
                        <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full font-semibold">
                          Cmdes: {source.orders_count}
                        </span>
                        <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full font-semibold">
                          Tickets: {source.tickets_sold}
                        </span>
                        <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full font-semibold">
                          CA: {source.revenue} FCFA
                        </span>
                        <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full font-semibold">
                          Présence: {source.participation_rate}%
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
      </section>

      {/* Statistiques invitations */}
      <section className="py-1 md:py-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded bg-purple-600 block" />
          <h2 className="text-xl font-semibold text-purple-700 tracking-tight">
            Invitations
          </h2>
        </div>

        {/* Niveau 1 : Totaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <Tooltip content="Nombre total d'invitations envoyées">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                Total Invitations
              </span>
              <span className="text-xl font-bold text-gray-900">
                {invitations.length}
              </span>
            </div>
          </Tooltip>
          <Tooltip content="Ensemble des invitations directes + celles nécessitant une validation (confirmée)">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                Places confirmées
              </span>
              <span className="text-xl font-bold text-gray-900">
                {invitations.filter((inv) => inv.type === "instant" || inv.type === "batch" || (inv.type === "pre_validation" && inv.status === "sent")).length}
              </span>
            </div>
          </Tooltip>
          <Tooltip content="Ensemble des invitations directes + celles nécessitant une validation (attente et confirmée)">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                Places à prévoir
              </span>
              <span className="text-xl font-bold text-gray-900">
                {invitations.filter((inv) => inv.type === "instant" || inv.type === "batch" || (inv.type === "pre_validation" && (inv.status === "sent" || inv.status === "pending_confirmation"))).length}
              </span>
            </div>
          </Tooltip>
          <Tooltip content="Nombre d'invitations scannées à l'entrée (invités présents)">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-medium">
                  Invités présents
                </span>
                {(() => {
                  const confirmedCount = invitations.filter((inv) => inv.type === "instant" || inv.type === "batch" || (inv.type === "pre_validation" && inv.status === "sent")).length;
                  const presentCount = invitations.filter((inv) => (inv.is_used && inv.is_used > 0) || (inv.verifications && inv.verifications.length > 0)).length;
                  const rate = confirmedCount > 0 ? Math.round((presentCount / confirmedCount) * 100) : 0;
                  return confirmedCount > 0 ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {rate}%
                    </span>
                  ) : null;
                })()}
              </div>
              <span className="text-xl font-bold text-emerald-600">
                {invitations.filter((inv) => (inv.is_used && inv.is_used > 0) || (inv.verifications && inv.verifications.length > 0)).length}
              </span>
            </div>
          </Tooltip>
          <Tooltip content="Nombre d'importations qui ont échoué">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                Échec
              </span>
              <span className="text-xl font-bold text-gray-900">
                {dbImportFailures.length}
              </span>
            </div>
          </Tooltip>
        </div>

        {/* Répartition par type d'invitation */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-4 rounded bg-purple-600 block" />
            Répartition par type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-purple-700 text-base">
                  Invitation Directe : {invitations.filter((inv) => inv.type === "instant" || inv.type === "batch").length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  Identifiable: {invitations.filter((inv) => inv.type === "instant").length}
                </span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  Non identifiable: {invitations.filter((inv) => inv.type === "batch").length}
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  Présents: {invitations.filter((inv) => (inv.type === "instant" || inv.type === "batch") && ((inv.is_used && inv.is_used > 0) || (inv.verifications && inv.verifications.length > 0))).length}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-purple-700 text-base">
                  Invitation avec validation : {invitations.filter((inv) => inv.type === "pre_validation").length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  En attente: {invitations.filter((inv) => inv.type === "pre_validation" && inv.status === "pending_confirmation").length}
                </span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  Confirmé: {invitations.filter((inv) => inv.type === "pre_validation" && inv.status === "sent").length}
                </span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  Rejeté: {invitations.filter((inv) => inv.type === "pre_validation" && inv.status === "rejected").length}
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  Présents: {invitations.filter((inv) => inv.type === "pre_validation" && ((inv.is_used && inv.is_used > 0) || (inv.verifications && inv.verifications.length > 0))).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques accréditations */}
      <section className="py-1 md:py-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded bg-[#023c40] block" />
          <h2 className="text-xl font-semibold text-[#023c40] tracking-tight">
            Accréditations
          </h2>
        </div>

        {/* Niveau 1 : Totaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <Tooltip content="Nombre total d'accréditations créées">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                Total Accréditations
              </span>
              <span className="text-xl font-bold text-gray-900">
                {accreditations.length}
              </span>
            </div>
          </Tooltip>

          <Tooltip content="Accréditations nominatives directes">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                Nominatives
              </span>
              <span className="text-xl font-bold text-blue-600">
                {accreditations.filter((acc) => acc.format === "nominative").length}
              </span>
            </div>
          </Tooltip>

          <Tooltip content="Badges de lots anonymes (sécurité, régie, etc.)">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                Lots (Non nominatifs)
              </span>
              <span className="text-xl font-bold text-purple-600">
                {accreditations.filter((acc) => acc.format === "non_nominative").length}
              </span>
            </div>
          </Tooltip>

          <Tooltip content="Nombre d'accrédités scannés à l'entrée (présents sur l'événement)">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-medium">
                  Accrédités présents
                </span>
                {(() => {
                  const total = accreditations.length;
                  const presentCount = accreditations.filter(
                    (acc) =>
                      (acc.is_used && acc.is_used > 0) ||
                      (acc.verifications && acc.verifications.length > 0)
                  ).length;
                  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
                  return total > 0 ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {rate}%
                    </span>
                  ) : null;
                })()}
              </div>
              <span className="text-xl font-bold text-emerald-600">
                {
                  accreditations.filter(
                    (acc) =>
                      (acc.is_used && acc.is_used > 0) ||
                      (acc.verifications && acc.verifications.length > 0)
                  ).length
                }
              </span>
            </div>
          </Tooltip>

          <Tooltip content="Demandes d'accréditations en attente de confirmation par le destinataire">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100 min-h-[80px]">
              <span className="text-xs text-gray-500 font-medium mb-1">
                En attente validation
              </span>
              <span className="text-xl font-bold text-amber-600">
                {
                  accreditations.filter(
                    (acc) =>
                      acc.type === "pre_validation" &&
                      acc.status === "pending_confirmation"
                  ).length
                }
              </span>
            </div>
          </Tooltip>
        </div>

        {/* Répartition par type d'accréditation */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-[#023c40] mb-2 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-4 rounded bg-[#023c40] block" />
            Répartition par type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#023c40] text-base">
                  Accréditation Directe & Lots :{" "}
                  {
                    accreditations.filter(
                      (acc) => acc.type === "direct" || acc.type === "batch"
                    ).length
                  }
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  Nominatives:{" "}
                  {
                    accreditations.filter(
                      (acc) => acc.type === "direct" && acc.format === "nominative"
                    ).length
                  }
                </span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  Lots anonymes:{" "}
                  {
                    accreditations.filter(
                      (acc) => acc.type === "batch" || acc.format === "non_nominative"
                    ).length
                  }
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  Présents:{" "}
                  {
                    accreditations.filter(
                      (acc) =>
                        (acc.type === "direct" || acc.type === "batch") &&
                        ((acc.is_used && acc.is_used > 0) ||
                          (acc.verifications && acc.verifications.length > 0))
                    ).length
                  }
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#023c40] text-base">
                  Pré-validations :{" "}
                  {
                    accreditations.filter((acc) => acc.type === "pre_validation")
                      .length
                  }
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                  En attente:{" "}
                  {
                    accreditations.filter(
                      (acc) =>
                        acc.type === "pre_validation" &&
                        acc.status === "pending_confirmation"
                    ).length
                  }
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  Validés:{" "}
                  {
                    accreditations.filter(
                      (acc) =>
                        acc.type === "pre_validation" &&
                        (acc.status === "confirmed" || acc.status === "sent")
                    ).length
                  }
                </span>
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                  Rejetés:{" "}
                  {
                    accreditations.filter(
                      (acc) =>
                        acc.type === "pre_validation" && acc.status === "rejected"
                    ).length
                  }
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  Présents:{" "}
                  {
                    accreditations.filter(
                      (acc) =>
                        acc.type === "pre_validation" &&
                        ((acc.is_used && acc.is_used > 0) ||
                          (acc.verifications && acc.verifications.length > 0))
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques produits */}
      <section className="py-1 md:py-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded bg-[#023c40] block" />
          <h2 className="text-xl font-semibold text-[#023c40] tracking-tight">
            Produits
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {productStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.path}
                className="relative bg-white rounded-xl shadow group p-4 flex flex-col justify-between min-h-[80px] border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <span
                  className={`absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`}
                >
                  <Icon
                    className={`w-12 h-12 ${stat.color.replace("bg-", "text-")}`}
                  />
                </span>
                <span className="text-xs text-gray-500 font-medium mb-1 z-10">
                  {stat.title}
                </span>
                <span className="text-2xl font-bold text-gray-800 z-10">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Répartition par catégorie de produits */}
        {Array.isArray(statsData?.products?.by_category) &&
          statsData.products.by_category.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-[#023c40] mb-2 uppercase tracking-wide flex items-center gap-2">
                <span
                  className="w-1.5 h-4 rounded"
                  style={{ background: "#023c40" }}
                />{" "}
                Répartition par catégorie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statsData.products.by_category.map((cat: any, idx: number) => (
                  <div
                    key={cat.category + idx}
                    className="bg-white rounded-xl p-4 shadow border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#023c40] text-base">
                        {cat.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {cat.products_count} produits
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                        Vendus: {cat.quantity_sold}
                      </span>
                      <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                        CA: {cat.revenue} FCFA
                      </span>
                      <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                        Retirés: {cat.quantity_withdrawn}
                      </span>
                      <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                        Stock: {cat.stock_remaining}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Top produits vendus (par quantité et CA) */}
        {Array.isArray(statsData?.products?.details) &&
          statsData.products.details.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-[#023c40] mb-2 uppercase tracking-wide flex items-center gap-2">
                <span
                  className="w-1.5 h-4 rounded"
                  style={{ background: "#023c40" }}
                />{" "}
                Top produits vendus
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {statsData.products.details
                  .slice()
                  .sort((a: any, b: any) => b.quantity_sold - a.quantity_sold)
                  .map((prod: any) => (
                    <div
                      key={prod.product_id}
                      className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-col gap-2 hover:shadow-md transition-shadow relative"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Package
                          className="w-6 h-6"
                          style={{ color: "#023c40" }}
                        />
                        <span className="font-semibold text-[#023c40] text-base">
                          {prod.product_name}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {prod.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                          Prix: {prod.price?.toLocaleString()} FCFA
                        </span>
                        <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                          Vendus: {prod.quantity_sold}
                        </span>
                        <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                          CA: {prod.revenue?.toLocaleString()} FCFA
                        </span>
                        <span className="bg-[#e6f2f1] text-[#023c40] px-2 py-0.5 rounded-full font-semibold">
                          Retirés: {prod.quantity_withdrawn}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${prod.stock_remaining === 0 ? "bg-red-100 text-red-700" : "bg-[#e6f2f1] text-[#023c40]"}`}
                        >
                          Stock:{" "}
                          {prod.stock_remaining === 0 ? (
                            <span className="font-bold">Rupture</span>
                          ) : (
                            prod.stock_remaining
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </section>

      {/* Statistiques parking */}
      <section className="py-1 md:py-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded bg-orange-600 block" />
          <h2 className="text-xl font-semibold text-orange-600 tracking-tight">
            Parking
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {parkingStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.path}
                className="relative bg-white rounded-xl shadow group p-4 flex flex-col justify-between min-h-[80px] border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <span
                  className={`absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`}
                >
                  <Icon className={`w-12 h-12 ${stat.color.replace('bg-', 'text-')}`} />
                </span>
                <span className="text-xs text-gray-500 font-medium mb-1 z-10">{stat.title}</span>
                <span className="text-2xl font-bold text-gray-800 z-10">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default EventDashboard;

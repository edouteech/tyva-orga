import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/store";
import { Ticket, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { statisticsAPI } from "../../../api/api";

const EventDashboard: React.FC = () => {
  const { currentEvent } = useAppSelector((state) => state.event);
  const [statsData, setStatsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              {statsData?.tickets?.total_remaining?.toLocaleString() ?? "0"}
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
                        Restants: {ticket.quantity_remaining}
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
    </div>
  );
};

export default EventDashboard;

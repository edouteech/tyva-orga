import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { DataTable } from "../../../components/global";
import type { Column, Action } from "../../../components/global";
import {
  ticketsAPI,
  productTicketAttributionRulesAPI,
  parkingRulesAPI,
} from "../../../api";
import type {
  Ticket,
  ProductTicketAttributionRule,
  ParkingRule,
} from "../../../lib/types";
import { formatPrice, formatBackendDate, formatBackendTime } from "../../../lib/utils";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import {
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Info,
  Car,
  EyeOff,
  CalendarDays,
} from "lucide-react";

const TicketsIndex: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<ProductTicketAttributionRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState<boolean>(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  // États pour les règles de parking
  const [parkingRules, setParkingRules] = useState<ParkingRule[]>([]);
  const [parkingRulesLoading, setParkingRulesLoading] =
    useState<boolean>(false);
  const [parkingRulesError, setParkingRulesError] = useState<string | null>(
    null
  );

  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);

  const loadData = useCallback(async () => {
    if (!currentEvent) return;

    try {
      setLoading(true);
      setError(null);

      const ticketsData = await ticketsAPI.getByEventId(currentEvent.event_id);
      setTickets(ticketsData);
      // Charger les règles ticket-produit de l'événement
      setRulesError(null);
      setRulesLoading(true);
      const rulesData = await productTicketAttributionRulesAPI.getAll({
        event_id: currentEvent.event_id,
        sort_by: "created_at",
        sort_order: "desc",
      });
      setRules(rulesData);
      // Charger les règles de parking de l'événement
      setParkingRulesError(null);
      setParkingRulesLoading(true);
      const parkingRulesData = await parkingRulesAPI.getAll({
        event_id: currentEvent.event_id,
      });
      setParkingRules(parkingRulesData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des tickets";
      setError(errorMessage);
      setRulesError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des règles"
      );
    } finally {
      setLoading(false);
      setRulesLoading(false);
      setParkingRulesLoading(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3 h-3" />;
      case "inactive":
        return <AlertCircle className="w-3 h-3" />;
      case "sold_out":
        return <XCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-yellow-100 text-yellow-700";
      case "sold_out":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-[#EDF7F7] text-[#023C40]";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "inactive":
        return "Inactif";
      case "sold_out":
        return "Épuisé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return {
      date: formatBackendDate(dateTime, "fr-FR"),
      time: formatBackendTime(dateTime, "fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const columns: Column<Ticket>[] = [
    {
      key: "name",
      label: "Ticket",
      sortable: true,
      render: (_, ticket) => (
        <div>
          <p className="font-medium text-gray-900">{ticket.name}</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">
            {ticket.description}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Prix",
      sortable: true,
      render: (_, ticket) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-green-600" />
          <span className="font-medium text-gray-900">
            {formatPrice(ticket.price, ticket.currency)}
          </span>
        </div>
      ),
    },
    {
      key: "sellable_stock",
      label: "Stock",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900 font-medium">{value}</span>
      ),
    },
    {
      key: "activities",
      label: "Activités",
      sortable: false,
      render: (_, ticket) => (
        <div>
          {ticket.activities && ticket.activities.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {ticket.activities.slice(0, 2).map((activity) => (
                <span
                  key={activity.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                  title={activity.description || activity.name}
                >
                  <CalendarDays className="w-3 h-3" />
                  {activity.name}
                </span>
              ))}
              {ticket.activities.length > 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                  +{ticket.activities.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: "sales_start_date",
      label: "Vente",
      sortable: true,
      render: (_, ticket) => {
        const startDate = formatDateTime(ticket.sales_start_date);
        const endDate = formatDateTime(ticket.sales_end_date);
        return (
          <div>
            <p className="text-sm text-gray-900">{startDate.date}</p>
            <p className="text-xs text-gray-500">
              {startDate.time} - {endDate.time}
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            value
          )}`}
        >
          {getStatusIcon(value)}
          {getStatusLabel(value)}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Créé le",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3 h-3" />
          {formatBackendDate(value, "fr-FR")}
        </span>
      ),
    },
  ];

  const actions: Action<Ticket>[] = [
    {
      label: "Voir",
      onClick: (ticket) =>
        navigate(
          `/gestion-evenement/${getEventIdentifier(currentEvent!)}/tickets/${
            ticket.id
          }`
        ),
      icon: Eye,
    },
  ];

  // Colonnes pour le tableau des règles
  const ruleColumns: Column<ProductTicketAttributionRule>[] = [
    {
      key: "name",
      label: "Règle",
      sortable: true,
      render: (_, rule) => (
        <div>
          <p className="font-medium text-gray-900">{rule.name}</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">
            {rule.description || "—"}
          </p>
          {(rule.valid_from || rule.valid_to) && (
            <div className="mt-1 text-[11px] text-gray-500">
              {rule.valid_from && (
                <span>
                  Du {formatBackendDate(rule.valid_from, "fr-FR")}
                </span>
              )}
              {rule.valid_from && rule.valid_to && <span> au </span>}
              {rule.valid_to && (
                <span>
                  {formatBackendDate(rule.valid_to, "fr-FR")}
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "threshold",
      label: "Seuil",
      sortable: true,
      render: (value, rule) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          <p className="text-xs text-gray-500">
            {rule.application_mode === "one_time" ? "1 fois" : "par paliers"}
          </p>
        </div>
      ),
    },
    {
      key: "tickets",
      label: "Tickets",
      sortable: false,
      render: (_, rule) => (
        <div>
          {rule.tickets && rule.tickets.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rule.tickets.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800"
                  title={t.description}
                >
                  {t.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: "products",
      label: "Produits",
      sortable: false,
      render: (_, rule) => (
        <div>
          {rule.products && rule.products.length > 0 ? (
            <div className="flex flex-col gap-1">
              {rule.products.map((p) => (
                <div key={p.id} className="text-xs text-gray-800">
                  <span className="font-medium">{p.name}</span>
                  <span className="mx-1">•</span>
                  <span className="text-gray-600">x{p.pivot.quantity}</span>
                  <span className="mx-1">•</span>
                  <span className="uppercase text-[10px] tracking-wide text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    {p.pivot.attribution_type === "free"
                      ? "offert"
                      : p.pivot.attribution_type === "discount"
                      ? "réduction"
                      : "option payante"}
                  </span>
                  {p.pivot.attribution_type === "discount" &&
                    p.pivot.discounted_price != null && (
                      <span className="ml-1 text-[11px] text-gray-600">
                        →{" "}
                        {formatPrice(
                          Number(p.pivot.discounted_price),
                          p.currency || currentEvent?.currency
                        )}
                      </span>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: "is_visible",
      label: "Statut",
      sortable: true,
      render: (_, rule) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            rule.is_visible
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {rule.is_visible ? "Visible" : "Masquée"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Créé le",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3 h-3" />
          {formatBackendDate(value, "fr-FR")}
        </span>
      ),
    },
  ];

  // Actions pour le tableau des règles
  const ruleActions: Action<ProductTicketAttributionRule>[] = [
    {
      label: "Voir",
      onClick: (rule) =>
        navigate(
          `/gestion-evenement/${currentEvent?.event_id}/ticket-product/${rule.id}`
        ),
      icon: Info,
    },
  ];

  const getAccessModeLabel = (mode: string) => {
    switch (mode) {
      case "free":
        return "Gratuit";
      case "discount":
        return "Réduction";
      case "paid_option":
        return "Option payante";
      default:
        return mode;
    }
  };

  const getAccessModeColor = (mode: string) => {
    switch (mode) {
      case "free":
        return "bg-green-100 text-green-800";
      case "discount":
        return "bg-blue-100 text-blue-800";
      case "paid_option":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApplicationModeLabel = (mode: string) => {
    switch (mode) {
      case "once_if_threshold":
        return "Une seule fois si seuil atteint";
      case "per_threshold":
        return "Par palier";
      default:
        return mode;
    }
  };

  // Colonnes pour le tableau des règles de parking
  const parkingRuleColumns: Column<ParkingRule>[] = [
    {
      key: "name",
      label: "Règle",
      sortable: true,
      render: (_, rule) => (
        <div>
          <p className="font-medium text-gray-900">{rule.name}</p>
          {rule.user_description && (
            <p className="text-xs text-gray-500 truncate max-w-xs">
              {rule.user_description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "threshold",
      label: "Seuil",
      sortable: true,
      render: (value, rule) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          <p className="text-xs text-gray-500">
            {getApplicationModeLabel(rule.application_mode)}
          </p>
        </div>
      ),
    },
    {
      key: "access_mode",
      label: "Accès",
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessModeColor(
            value
          )}`}
        >
          {getAccessModeLabel(value)}
        </span>
      ),
    },
    {
      key: "max_spaces_per_application",
      label: "Places max",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900 font-medium">{value}</span>
      ),
    },
    {
      key: "parkings",
      label: "Parkings",
      sortable: false,
      render: (_, rule) => (
        <div>
          {rule.parkings && rule.parkings.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rule.parkings.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800"
                >
                  {p.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: "tickets",
      label: "Tickets",
      sortable: false,
      render: (_, rule) => (
        <div>
          {rule.tickets && rule.tickets.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rule.tickets.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {t.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: "is_visible",
      label: "Visibilité",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          {value ? (
            <>
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Masquée</span>
            </>
          )}
        </span>
      ),
    },
  ];

  const parkingRuleActions: Action<ParkingRule>[] = [];

  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Aucun événement sélectionné</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 -mx-8 px-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Gestion des tickets
          </h1>
          <p className="text-gray-600">
            Gérez les tickets de l'événement "{currentEvent.name}"
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-600">Chargement des tickets...</p>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <DataTable
          data={tickets}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={true}
          exportable={true}
          exportFilename="billets"
          searchPlaceholder="Rechercher un ticket..."
          emptyMessage="Aucun ticket trouvé"
          pagination={true}
          itemsPerPage={10}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Règles d'attribution ticket-produit */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Règles d'attribution ticket-produit
          </h3>
        </div>

        {rulesLoading && (
          <div className="flex items-center justify-center">
            <p className="text-gray-600">Chargement des règles...</p>
          </div>
        )}
        {rulesError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-600 font-medium">{rulesError}</p>
          </div>
        )}

        {!rulesLoading && rules.length > 0 && (
          <div className="w-full overflow-x-auto">
            <DataTable
              data={rules}
              columns={ruleColumns}
              actions={ruleActions}
              loading={rulesLoading}
              searchable={true}
              exportable={true}
              exportFilename="regles-ticket-produit"
              searchPlaceholder="Rechercher une règle..."
              emptyMessage="Aucune règle trouvée"
              pagination={true}
              itemsPerPage={10}
              showPageSizeSelector={true}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Règles de parking */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Règles d'attribution de parking
          </h3>
        </div>

        {parkingRulesLoading && (
          <div className="flex items-center justify-center">
            <p className="text-gray-600">Chargement des règles...</p>
          </div>
        )}
        {parkingRulesError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-600 font-medium">{parkingRulesError}</p>
          </div>
        )}

        {!parkingRulesLoading && parkingRules.length > 0 && (
          <div className="w-full overflow-x-auto">
            <DataTable
              data={parkingRules}
              columns={parkingRuleColumns}
              actions={parkingRuleActions}
              loading={parkingRulesLoading}
              searchable={true}
              exportable={true}
              exportFilename="regles-parking"
              searchPlaceholder="Rechercher une règle..."
              emptyMessage="Aucune règle trouvée"
              pagination={true}
              itemsPerPage={10}
              showPageSizeSelector={true}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}

        {!parkingRulesLoading && parkingRules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Aucune règle de parking configurée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsIndex;

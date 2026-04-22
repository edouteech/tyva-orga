import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { ticketsAPI } from "../../../api";
import type { Ticket } from "../../../lib/types";
import { formatPrice, formatBackendDate, formatBackendTime } from "../../../lib/utils";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image,
  Tag,
  Building2,
  FileText,
  Info,
  CalendarDays,
  Warehouse,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";

const TicketShow: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      setError(null);
      const ticketData = await ticketsAPI.getById(parseInt(ticketId));
      setTicket(ticketData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement du ticket",
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4" />;
      case "archived":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const formatDateTime = (dateTime: string) => ({
    date: formatBackendDate(dateTime, "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: formatBackendTime(dateTime, "fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Chargement du ticket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => void loadTicket()}
            className="px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Ticket non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(
                `/gestion-evenement/${getEventIdentifier(currentEvent!)}/tickets`,
              )
            }
            className="flex items-center gap-2 text-[#36CC76] hover:text-[#2BA85F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux tickets
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {ticket.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    ticket.status,
                  )}`}
                >
                  {getStatusIcon(ticket.status)}
                  {getStatusLabel(ticket.status)}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                  <DollarSign className="w-6 h-6" />
                  {formatPrice(ticket.price, ticket.currency)}
                </div>
                <p className="text-sm text-gray-500">
                  {ticket.quantity_acquired !== null &&
                  ticket.quantity_acquired !== undefined
                    ? `${ticket.sellable_stock ?? 0} disponibles`
                    : "Stock illimité"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Description détaillée
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
          </div>

          {ticket.activities && ticket.activities.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Activités associées
                </h3>
              </div>
              <div className="space-y-3">
                {ticket.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {activity.name}
                        </h4>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatBackendDate(activity.start_datetime, "fr-FR")}{" "}
                              à{" "}
                              {formatBackendTime(activity.start_datetime, "fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {activity.end_datetime && (
                            <div className="flex items-center gap-1">
                              <span>→</span>
                              <span>
                                {formatBackendTime(activity.end_datetime, "fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === "active"
                            ? "bg-green-100 text-green-700"
                            : activity.status === "inactive"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {activity.status === "active"
                          ? "Active"
                          : activity.status === "inactive"
                            ? "Inactive"
                            : "Annulée"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(ticket.public_image_url || ticket.template_image_url) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">Images</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ticket.public_image_url && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Image publique
                    </h4>
                    <img
                      src={ticket.public_image_url}
                      alt="Image publique du ticket"
                      className="w-full object-contain rounded-lg border border-gray-200"
                      style={{ maxHeight: "500px" }}
                    />
                  </div>
                )}
                {ticket.template_image_url && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Image template
                    </h4>
                    <img
                      src={ticket.template_image_url}
                      alt="Image template du ticket"
                      className="w-full object-contain rounded-lg border border-gray-200"
                      style={{ maxHeight: "500px" }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Prix & Disponibilité
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prix</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(ticket.price, ticket.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Stock vendable</span>
                <span className="font-semibold text-gray-900">
                  {ticket.quantity_acquired !== null &&
                  ticket.quantity_acquired !== undefined
                    ? (ticket.sellable_stock ?? 0)
                    : "Illimité"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Devise</span>
                <span className="font-semibold text-gray-900">{ticket.currency}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Dates de vente
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Début de vente</span>
                <p className="font-medium text-gray-900">
                  {formatDateTime(ticket.sales_start_date).date}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDateTime(ticket.sales_start_date).time}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Fin de vente</span>
                <p className="font-medium text-gray-900">
                  {formatDateTime(ticket.sales_end_date).date}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDateTime(ticket.sales_end_date).time}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Événement parent</h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{ticket.event_name}</p>
              <p className="text-sm text-gray-600">
                Organisé par{" "}
                {ticket.event?.organizer?.company_name || "Organisateur non défini"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-[#36CC76]" />
                Gestion du stock
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Stock vendable
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {ticket.quantity_acquired !== null &&
                  ticket.quantity_acquired !== undefined
                    ? (ticket.sellable_stock ?? 0)
                    : "∞"}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Quantité acquise
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {ticket.quantity_acquired !== null &&
                  ticket.quantity_acquired !== undefined
                    ? ticket.quantity_acquired
                    : "∞"}
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Quantité vendue
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {ticket.quantity_sold ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Informations système
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Créé le</span>
                <span className="text-gray-900">
                  {formatBackendDate(ticket.created_at, "fr-FR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modifié le</span>
                <span className="text-gray-900">
                  {formatBackendDate(ticket.updated_at, "fr-FR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketShow;

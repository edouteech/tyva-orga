import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { ordersAPI } from "../../../api";
import type { Order, OrderedParking, OrderedTicket } from "../../../lib/types";
import { formatPrice } from "../../../lib/utils";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import ResendNotificationsModal from "./ResendNotificationsModal";
import {
  ArrowLeft,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Download,
  FileText,
  User,
  Calendar,
  CreditCard,
  Package,
  Send,
  Car,
  ExternalLink,
} from "lucide-react";

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendModalOpen, setResendModalOpen] = useState(false);

  const { currentEvent } = useAppSelector((state) => state.event);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId || !currentEvent) return;

      try {
        setLoading(true);
        setError(null);

        const foundOrder = await ordersAPI.getById(parseInt(orderId, 10));
        setOrder(foundOrder);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de la commande";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, currentEvent]);

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "processing":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return "Terminée";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulée";
      case "processing":
        return "En cours";
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return "Payé";
      case "pending":
        return "En attente";
      case "failed":
        return "Échoué";
      default:
        return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString("fr-FR"),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const handleDownloadInvoice = () => {
    if (!order || order.payment.statut !== "success") {
      alert("La confirmation de commande n'est disponible que pour les commandes payées");
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "");
    
    if (!baseUrl) {
      throw new Error("VITE_API_BASE_URL n'est pas définie dans les variables d'environnement");
    }
    
    const invoiceUrl = `${baseUrl}/invoices/${order.id}/download`;

    const link = document.createElement("a");
    link.href = invoiceUrl;
    link.download = `facture_${order.number}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTickets = async () => {
    if (!order || order.ordered_tickets.length === 0) {
      alert("Aucun ticket disponible pour cette commande");
      return;
    }

    for (let index = 0; index < order.ordered_tickets.length; index++) {
      const ticket = order.ordered_tickets[index];

      if (ticket.url_ticket) {
        const urlParts = ticket.url_ticket.split("/");
        const encryptedData = urlParts[urlParts.length - 1];

        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "");
        
        if (!baseUrl) {
          throw new Error("VITE_API_BASE_URL n'est pas définie dans les variables d'environnement");
        }
        
        const ticketUrl = `${baseUrl}/tickets/${encryptedData}/download`;

        const link = document.createElement("a");
        link.href = ticketUrl;
        link.download = `ticket_${ticket.number || order.number}_${
          index + 1
        }.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (index < order.ordered_tickets.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  };

  const handleDownloadSingleTicket = (ticket: OrderedTicket, index: number) => {
    if (!ticket.url_ticket) {
      alert("URL du ticket non disponible");
      return;
    }

    const urlParts = ticket.url_ticket.split("/");
    const encryptedData = urlParts[urlParts.length - 1];

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "");
    
    if (!baseUrl) {
      throw new Error("VITE_API_BASE_URL n'est pas définie dans les variables d'environnement");
    }
    
    const ticketUrl = `${baseUrl}/tickets/${encryptedData}/download`;

    const link = document.createElement("a");
    link.href = ticketUrl;
    link.download = `ticket_${ticket.number || order?.number}_${index + 1}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getParkingStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "cancelled":
        return "Annulé";
      case "used":
        return "Utilisé";
      default:
        return status;
    }
  };

  const handleDownloadParkings = async () => {
    const parkings = order?.ordered_parkings ?? [];
    if (!order || parkings.length === 0) {
      alert("Aucun parking disponible pour cette commande");
      return;
    }

    for (let index = 0; index < parkings.length; index++) {
      const p = parkings[index];
      if (p.url_parking_download) {
        const link = document.createElement("a");
        link.href = p.url_parking_download;
        link.download = `parking_${p.number || order.number}_${index + 1}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (index < parkings.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  };

  const handleDownloadSingleParking = (
    parking: OrderedParking,
    index: number
  ) => {
    if (!parking.url_parking_download) {
      alert("URL de téléchargement du parking non disponible");
      return;
    }

    const link = document.createElement("a");
    link.href = parking.url_parking_download;
    link.download = `parking_${parking.number || order?.number}_${
      index + 1
    }.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Aucun événement sélectionné</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">
          Chargement des détails de la commande...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6 -mx-8 px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(
                `/gestion-evenement/${getEventIdentifier(
                  currentEvent!
                )}/commandes`
              )
            }
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux commandes
          </button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">
            {error || "Commande non trouvée"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 -mx-8 px-8">
      <ResendNotificationsModal
        isOpen={resendModalOpen}
        onClose={() => setResendModalOpen(false)}
        order={order}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(
                `/gestion-evenement/${getEventIdentifier(
                  currentEvent!
                )}/commandes`
              )
            }
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux commandes
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Commande #{order.number}
            </h1>
            <p className="text-gray-600">
              Détails de la commande pour l'événement "{currentEvent.name}"
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {order.payment.statut === "success" && (
            <>
              <button
                onClick={() => setResendModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Send className="w-4 h-4" />
                Renvoyer les notifications
              </button>
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                Télécharger facture
              </button>
            </>
          )}
          {order.ordered_tickets.length > 0 && (
            <button
              onClick={handleDownloadTickets}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Télécharger tickets
            </button>
          )}
          {(order.ordered_parkings?.length ?? 0) > 0 && (
            <button
              onClick={handleDownloadParkings}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
            >
              <Download className="w-4 h-4" />
              Télécharger parkings
            </button>
          )}
        </div>
      </div>

      {/* Order Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Statut de la commande
            </h2>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(
                order.order_status
              )}`}
            >
              {getOrderStatusIcon(order.order_status)}
              {getOrderStatusLabel(order.order_status)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Montant total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(order.amount, order.payment.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">
              Informations client
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="font-medium text-gray-900">
                {order.client.full_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="text-gray-900">{order.client.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-gray-900">{order.client.phone}</p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">
              Informations de paiement
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Statut du paiement</p>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                  order.payment.statut
                )}`}
              >
                {getPaymentStatusLabel(order.payment.statut)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Méthode de paiement</p>
              <p className="font-medium text-gray-900">
                {order.payment.payment_method}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant</p>
              <p className="font-medium text-gray-900">
                {formatPrice(order.payment.montant, order.payment.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">
            Articles commandés
          </h2>
        </div>
        <div className="space-y-4">
          {order.order_items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{item.item_name}</p>
                <p className="text-sm text-gray-500">
                  Quantité: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatPrice(item.price, order.payment.currency)}
                </p>
                <p className="text-sm text-gray-500">
                  Total: {formatPrice(item.amount, order.payment.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tickets */}
      {order.ordered_tickets.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">
              Tickets générés ({order.ordered_tickets.length})
            </h2>
          </div>
          <div className="space-y-3">
            {order.ordered_tickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Ticket #{ticket.number}
                  </p>
                  <p className="text-sm text-gray-500">
                    Statut: {ticket.statut}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <button
                    onClick={() => handleDownloadSingleTicket(ticket, index)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    title="Télécharger ce ticket"
                  >
                    <Download className="w-3 h-3" />
                    Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parkings générés */}
      {(order.ordered_parkings?.length ?? 0) > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">
              Parkings générés ({order.ordered_parkings?.length ?? 0})
            </h2>
          </div>
          <div className="space-y-3">
            {(order.ordered_parkings ?? []).map((parking, index) => (
              <div
                key={parking.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-4 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    Parking #{parking.number}
                  </p>
                  <p className="text-sm text-gray-500">
                    Statut : {getParkingStatusLabel(parking.status)}
                  </p>
                  {parking.license_plate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Plaque : {parking.license_plate}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <a
                    href={parking.url_parking}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    title="Ouvrir la page du parking"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadSingleParking(parking, index)
                    }
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    title="Télécharger ce parking"
                  >
                    <Download className="w-3 h-3" />
                    Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">
            Chronologie de la commande
          </h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">Commande créée</p>
              <p className="text-sm text-gray-500">
                {formatDateTime(order.created_at).date} à{" "}
                {formatDateTime(order.created_at).time}
              </p>
            </div>
          </div>
          {order.updated_at !== order.created_at && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Dernière mise à jour
                </p>
                <p className="text-sm text-gray-500">
                  {formatDateTime(order.updated_at).date} à{" "}
                  {formatDateTime(order.updated_at).time}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { DataTable } from "../../../components/global";
import type { Column, Action } from "../../../components/global";
import { ordersAPI } from "../../../api";
import type { Order } from "../../../lib/types";
import { formatPrice } from "../../../lib/utils";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import {
  ShoppingCart,
  Ticket,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  Phone,
  Mail,
  Download,
  FileText,
} from "lucide-react";

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentEvent } = useAppSelector((state) => state.event);

  const loadData = useCallback(async () => {
    if (!currentEvent) return;

    try {
      setLoading(true);
      setError(null);

      const ordersData = await ordersAPI.getByEventId(currentEvent.event_id);
      setOrders(ordersData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des commandes";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      case "processing":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
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

  const getApiWebBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "");

    if (!baseUrl) {
      throw new Error(
        "VITE_API_BASE_URL n'est pas définie dans les variables d'environnement"
      );
    }

    return baseUrl;
  };

  const columns: Column<Order>[] = [
    {
      key: "number",
      label: "Commande",
      sortable: true,
      render: (_, order) => (
        <div>
          <p className="font-medium text-gray-900">{order.number}</p>
          <p className="text-xs text-gray-500">
            {formatDateTime(order.created_at).date} à{" "}
            {formatDateTime(order.created_at).time}
          </p>
        </div>
      ),
    },
    {
      key: "client",
      label: "Client",
      sortable: false,
      render: (_, order) => (
        <div>
          <p className="font-medium text-gray-900">{order.client.full_name}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Mail className="w-3 h-3" />
            {order.client.email}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone className="w-3 h-3" />
            {order.client.phone}
          </div>
        </div>
      ),
    },
    {
      key: "order_items",
      label: "Articles",
      sortable: false,
      render: (_, order) => (
        <div className="space-y-1">
          {order.order_items.map((item, index) => (
            <div key={index} className="text-sm">
              <p className="font-medium text-gray-900">{item.item_name}</p>
              <p className="text-xs text-gray-500">
                {item.quantity}x{" "}
                {formatPrice(item.price, order.payment.currency)}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      sortable: true,
      render: (_, order) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-green-600" />
          <span className="font-medium text-gray-900">
            {formatPrice(order.amount, order.payment.currency)}
          </span>
        </div>
      ),
    },
    {
      key: "payment",
      label: "Paiement",
      sortable: false,
      render: (_, order) => (
        <div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
              order.payment.statut
            )}`}
          >
            {getPaymentStatusLabel(order.payment.statut)}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {order.payment.payment_method}
          </p>
        </div>
      ),
    },
    {
      key: "order_status",
      label: "Statut",
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(
            value
          )}`}
        >
          {getOrderStatusIcon(value)}
          {getOrderStatusLabel(value)}
        </span>
      ),
    },
    {
      key: "ordered_tickets",
      label: "Tickets",
      sortable: false,
      render: (_, order) => (
        <div className="flex items-center gap-1">
          <Ticket className="w-3 h-3 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            {order.ordered_tickets.length}
          </span>
        </div>
      ),
    },
  ];

  const handleDownloadInvoice = (order: Order) => {
    if (order.payment.statut !== "success") {
      alert("La confirmation de commande n'est disponible que pour les commandes payées");
      return;
    }

    const baseUrl = getApiWebBaseUrl();
    const invoiceUrl = `${baseUrl}/invoices/${order.id}/download`;

    // Créer un lien temporaire pour forcer le téléchargement
    const link = document.createElement("a");
    link.href = invoiceUrl;
    link.download = `facture_${order.number}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTickets = (order: Order) => {
    if (order.ordered_tickets.length === 0) {
      alert("Aucun ticket disponible pour cette commande");
      return;
    }

    // Télécharger chaque ticket individuellement
    order.ordered_tickets.forEach((ticket, index) => {
      if (ticket.url_ticket) {
        // Extraire l'ID crypté de l'URL complète
        const urlParts = ticket.url_ticket.split("/");
        const encryptedData = urlParts[urlParts.length - 1];

        const baseUrl = getApiWebBaseUrl();
        const ticketUrl = `${baseUrl}/tickets/${encryptedData}/download`;

        // Créer un lien temporaire pour forcer le téléchargement
        const link = document.createElement("a");
        link.href = ticketUrl;
        link.download = `ticket_${ticket.number || order.number}_${
          index + 1
        }.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const actions: Action<Order>[] = [
    {
      label: "Voir détails",
      onClick: (order) => {
        navigate(
          `/gestion-evenement/${getEventIdentifier(currentEvent!)}/commandes/${
            order.id
          }`
        );
      },
      icon: Eye,
    },
    {
      label: "Télécharger la confirmation de commande",
      onClick: handleDownloadInvoice,
      icon: FileText,
      show: (order) => order.payment.statut === "success",
    },
    {
      label: "Télécharger tickets",
      onClick: handleDownloadTickets,
      icon: Download,
      show: (order) => order.ordered_tickets.length > 0,
    },
  ];

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
            Gestion des commandes
          </h1>
          <p className="text-gray-600">
            Suivez et gérez toutes les commandes de l'événement "
            {currentEvent.name}"
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-600">Chargement des commandes...</p>
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

      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Aucune commande
            </h4>
            <p className="text-gray-600">
              Les commandes des participants apparaîtront ici une fois que les
              ventes commenceront.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="w-full overflow-x-auto">
          <DataTable
            data={orders}
            columns={columns}
            actions={actions}
            loading={loading}
            searchable={true}
            exportable={true}
            exportFilename="commandes"
            searchPlaceholder="Rechercher une commande..."
            emptyMessage="Aucune commande trouvée"
            pagination={true}
            itemsPerPage={10}
            showPageSizeSelector={true}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}
    </div>
  );
};

export default Orders;

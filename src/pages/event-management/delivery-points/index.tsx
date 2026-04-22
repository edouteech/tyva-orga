import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { DataTable } from "../../../components/global";
import type { Column, Action } from "../../../components/global";
import { formatBackendDate } from "../../../lib";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import { eventsAPI } from "../../../api";
import type { DeliveryPoint } from "./catalogTypes";
import {
  Truck,
  MapPin,
  Clock,
  Eye,
} from "lucide-react";

const EventDeliveryPointsIndex: React.FC = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentEvent } = useAppSelector((state) => state.event);

  const loadData = useCallback(async () => {
    if (!currentEvent) return;
    try {
      setLoading(true);
      setError(null);
      const list = await eventsAPI.getDeliveryPointsForEvent(currentEvent.event_id);
      setPoints(list);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des points de livraison.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getStatusLabel = (status: DeliveryPoint["status"]) =>
    status === "active" ? "Actif" : "Désactivé";

  const columns: Column<DeliveryPoint>[] = [
    {
      key: "zone",
      label: "Zone",
      sortable: true,
      render: (_, point) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Truck className="w-4 h-4 text-[#36CC76]" />
          </div>
          <span className="font-medium text-gray-900">{point.zone}</span>
        </div>
      ),
    },
    {
      key: "country",
      label: "Pays",
      sortable: true,
    },
    {
      key: "city",
      label: "Ville",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-gray-700">
          <MapPin className="w-3 h-3" />
          {value}
        </span>
      ),
    },
    {
      key: "delivery_price",
      label: "Prix de livraison",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">
          {Number(value).toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-green-100 text-[#36CC76]"
              : "bg-gray-100 text-gray-600"
          }`}
        >
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
          {formatBackendDate(value)}
        </span>
      ),
    },
  ];

  const actions: Action<DeliveryPoint>[] = [
    {
      label: "Voir",
      onClick: (point) =>
        navigate(
          `/gestion-evenement/${getEventIdentifier(
            currentEvent!,
          )}/points-livraison/${point.id}`,
        ),
      icon: Eye,
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
            Points de livraison
          </h1>
          <p className="text-gray-600">
            Associez des zones de livraison à l&apos;événement «{" "}
            {currentEvent.name} » (catalogue global : menu Points de livraison).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <DataTable
          data={points}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={true}
          exportable={true}
          exportFilename="points-livraison-evenement"
          searchPlaceholder="Rechercher une zone, ville..."
          emptyMessage="Aucun point de livraison associé à cet événement"
          pagination={true}
          itemsPerPage={10}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default EventDeliveryPointsIndex;

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { DataTable } from "../../../components/global";
import type { Column, Action } from "../../../components/global";
import {
  eventsAPI,
  physicalPointsAPI,
} from "../../../api";
import type { PhysicalPoint } from "../../../lib/types";
import { formatBackendDate } from "../../../lib";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import type {
  DeliveryPoint,
} from "../delivery-points/catalogTypes";
import {
  MapPin,
  Building,
  Clock,
  Tag,
  Eye,
  Truck,
} from "lucide-react";

const SalesPointsIndex: React.FC = () => {
  const navigate = useNavigate();
  const [salesPoints, setSalesPoints] = useState<PhysicalPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [errorDelivery, setErrorDelivery] = useState<string | null>(null);

  const { currentEvent } = useAppSelector((state) => state.event);

  const loadData = useCallback(async () => {
    if (!currentEvent) return;

    try {
      setLoading(true);
      setError(null);

      // Récupérer les points physiques filtrés par événement
      const pointsData = await physicalPointsAPI.getByEventId(
        currentEvent.event_id,
      );
      setSalesPoints(pointsData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des points de retrait";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  const loadDeliveryData = useCallback(async () => {
    if (!currentEvent) return;
    try {
      setLoadingDelivery(true);
      setErrorDelivery(null);
      const list = await eventsAPI.getDeliveryPointsForEvent(
        currentEvent.event_id,
      );
      setDeliveryPoints(list);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des points de livraison.";
      setErrorDelivery(errorMessage);
    } finally {
      setLoadingDelivery(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    void loadData();
    void loadDeliveryData();
  }, [loadData, loadDeliveryData]);

  const getStatusColor = (types: string[]) => {
    if (types.includes("sale_point")) {
      return "bg-green-100 text-green-700";
    }
    if (types.includes("pickup_point")) {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (types: string[]) => {
    if (types.includes("sale_point") && types.includes("pickup_point")) {
      return "Vente et retrait";
    }
    if (types.includes("sale_point")) {
      return "Point de retrait";
    }
    if (types.includes("pickup_point")) {
      return "Point de retrait";
    }
    return "Autre";
  };

  const columns: Column<PhysicalPoint>[] = [
    {
      key: "name",
      label: "Point de retrait",
      sortable: true,
      render: (_, point) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <MapPin className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{point.name}</div>
            {point.organizer_name && (
              <div className="text-sm text-gray-500">
                {point.organizer_name}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "address_info",
      label: "Adresse",
      sortable: false,
      render: (_, point) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400" />
          <div className="text-sm">
            <div className="text-gray-900">{point.address_info.name}</div>
            <div className="text-gray-500">
              {point.address_info.city}, {point.address_info.country}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "types_labels",
      label: "Types",
      sortable: false,
      render: (_, point) => (
        <div className="flex flex-wrap gap-1">
          {point.types_labels && point.types_labels.length > 0 ? (
            point.types_labels.map((type: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDF7F7] text-[#023C40]"
              >
                <Tag className="w-3 h-3" />
                {type}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">Aucun type</span>
          )}
        </div>
      ),
    },
    {
      key: "types",
      label: "Statut",
      sortable: true,
      render: (_, point) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            point.types,
          )}`}
        >
          {getStatusLabel(point.types)}
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

  const actions: Action<PhysicalPoint>[] = [
    {
      label: "Voir",
      onClick: (point) =>
        navigate(
          `/gestion-evenement/${getEventIdentifier(
            currentEvent!,
          )}/points-de-vente/${point.id}`,
        ),
      icon: Eye,
    },
  ];

  const deliveryColumns: Column<DeliveryPoint>[] = [
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
    { key: "country", label: "Pays", sortable: true },
    { key: "city", label: "Ville", sortable: true },
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
          {value === "active" ? "Actif" : "Désactivé"}
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

  const deliveryActions: Action<DeliveryPoint>[] = [
    {
      label: "Voir",
      onClick: (point) =>
        navigate(
          `/gestion-evenement/${getEventIdentifier(
            currentEvent!,
          )}/points-de-vente/livraison/${point.id}`,
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
            Points de retrait
          </h1>
          <p className="text-gray-600">
            Gérez les points de vente et de retrait physiques pour l'événement "
            {currentEvent.name}"
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-600">
          Chargement des points de retrait...
        </p>
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
          data={salesPoints}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={true}
          exportable={true}
          exportFilename="points-de-vente"
          searchPlaceholder="Rechercher un point de retrait..."
          emptyMessage="Aucun point de retrait trouvé"
          pagination={true}
          itemsPerPage={10}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Points de livraison
            </h2>
            <p className="text-gray-600">
              Associez des zones de livraison à l&apos;événement «{" "}
              {currentEvent.name} ».
            </p>
          </div>
        </div>

        {errorDelivery && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-600 font-medium">{errorDelivery}</p>
            <button
              type="button"
              onClick={() => void loadDeliveryData()}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <DataTable
            data={deliveryPoints}
            columns={deliveryColumns}
            actions={deliveryActions}
            loading={loadingDelivery}
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
    </div>
  );
};

export default SalesPointsIndex;

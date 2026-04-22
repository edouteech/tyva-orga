import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import { eventsAPI, physicalPointsAPI } from "../../../api";
import type { DeliveryPoint } from "./catalogTypes";
import type { PhysicalPoint } from "../../../lib/types";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  Package,
  Globe,
  Building,
} from "lucide-react";
import { formatBackendDate } from "../../../lib";

const EventDeliveryPointShow: React.FC = () => {
  const { id: routeIdParam, deliveryPointId } = useParams<{
    id?: string;
    deliveryPointId?: string;
  }>();
  const pointIdParam = deliveryPointId ?? routeIdParam;
  const navigate = useNavigate();
  const location = useLocation();
  const { currentEvent } = useAppSelector((state) => state.event);

  const backToDeliveryListPath: string | undefined = currentEvent
    ? location.pathname.includes("/points-de-vente/livraison/")
      ? `/gestion-evenement/${getEventIdentifier(currentEvent)}/points-de-vente`
      : `/gestion-evenement/${getEventIdentifier(currentEvent)}/points-livraison`
    : undefined;
  const [point, setPoint] = useState<DeliveryPoint | null | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [physicalPoints, setPhysicalPoints] = useState<PhysicalPoint[]>([]);

  useEffect(() => {
    if (!pointIdParam || !currentEvent) {
      setPoint(undefined);
      setLoading(false);
      return;
    }
    const pid = parseInt(pointIdParam, 10);
    if (Number.isNaN(pid)) {
      setPoint(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [eventPoints, points] = await Promise.all([
          eventsAPI.getDeliveryPointsForEvent(currentEvent.event_id),
          physicalPointsAPI.getByEventId(currentEvent.event_id),
        ]);
        if (cancelled) return;
        setPhysicalPoints(points);
        const found = eventPoints.find((p) => p.id === pid) ?? null;
        setPoint(found);
      } catch {
        if (!cancelled) setPoint(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pointIdParam, currentEvent]);


  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Aucun événement sélectionné</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#36CC76] mx-auto mb-4" />
          <p className="text-gray-600">Chargement du point de livraison...</p>
        </div>
      </div>
    );
  }

  if (!point) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">
            Point introuvable ou non associé à cet événement.
          </p>
          <div className="space-x-4">
            <button
              type="button"
              onClick={() =>
                backToDeliveryListPath && navigate(backToDeliveryListPath)
              }
              className="px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition-colors"
            >
              Retour à la liste
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const linkedPhysicalName =
    point.physical_point_name ??
    physicalPoints.find((p) => p.id === point.physical_point_id)?.name ??
    null;

  return (
    <div className="flex-1 p-8 bg-[#EDF7F7] min-h-screen">
      {/* Header — aligné sur sales-points/show */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              backToDeliveryListPath && navigate(backToDeliveryListPath)
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {point.zone}
            </h1>
            <p className="text-gray-600">Détails du point de livraison</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Informations générales
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone
                </label>
                <p className="text-gray-900 font-medium">{point.zone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de livraison
                </label>
                <p className="text-gray-900">
                  {Number(point.delivery_price).toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    point.status === "active"
                      ? "bg-green-100 text-[#36CC76]"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {point.status === "active" ? "Actif" : "Désactivé"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de création
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatBackendDate(point.created_at, "fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Localisation
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {point.country}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {point.city}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stock (livraison)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Point de retrait dont le stock est déduit pour les commandes en
              livraison dans cette zone.
            </p>

            {point.physical_point_id != null && linkedPhysicalName && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Lié actuellement à
                </p>
                <p className="text-gray-900 font-medium">{linkedPhysicalName}</p>
              </div>
            )}

            {physicalPoints.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucun point de retrait sur cet événement. Ajoutez-en dans « Points
                de retrait » pour lier le stock.
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Pour modifier l'association de stock, cela doit être fait côté back-office/admin.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Résumé</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Points de retrait événement</span>
                <span className="font-medium text-gray-900">
                  {physicalPoints.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock lié</span>
                <span className="font-medium text-gray-900">
                  {point.physical_point_id != null ? "Oui" : "Non"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDeliveryPointShow;

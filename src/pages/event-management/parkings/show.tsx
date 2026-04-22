import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { parkingsAPI } from "../../../api";
import type { Parking } from "../../../lib/types";
import { formatPrice, formatBackendDate } from "../../../lib/utils";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Car,
  Building2,
  FileText,
  Info,
  Navigation,
  Globe,
  Warehouse,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";

const ParkingShow: React.FC = () => {
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { parkingId } = useParams<{ parkingId: string }>();
  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);

  const loadParking = useCallback(async () => {
    if (!parkingId) return;

    try {
      setLoading(true);
      setError(null);

      const parkingData = await parkingsAPI.getById(parseInt(parkingId));
      setParking(parkingData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du parking";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [parkingId]);

  useEffect(() => {
    loadParking();
  }, [loadParking]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4" />;
      case "full":
        return <XCircle className="w-4 h-4" />;
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
      case "full":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "inactive":
        return "Inactif";
      case "full":
        return "Complet";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Chargement du parking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={loadParking}
            className="px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Parking non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(
                `/gestion-evenement/${getEventIdentifier(
                  currentEvent!
                )}/parkings`
              )
            }
            className="flex items-center gap-2 text-[#36CC76] hover:text-[#2BA85F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux parkings
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête du parking */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {parking.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    parking.status
                  )}`}
                >
                  {getStatusIcon(parking.status)}
                  {getStatusLabel(parking.status)}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                  <DollarSign className="w-6 h-6" />
                  {formatPrice(parking.default_price, parking.currency)}
                </div>
                <p className="text-sm text-gray-500">
                  {parking.total_spaces} places disponibles
                </p>
              </div>
            </div>
          </div>

          {/* Description détaillée */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Description détaillée
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {parking.description}
            </p>
          </div>

          {/* Localisation */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Localisation
              </h3>
            </div>
            {parking.address ? (
              <div className="space-y-4">
                {/* Nom du lieu */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#36CC76]/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#36CC76]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {parking.address.name}
                    </p>
                    {parking.address.description && (
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {parking.address.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ville et Pays */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  {parking.address.city && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Navigation className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Ville
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {parking.address.city}
                        </p>
                      </div>
                    </div>
                  )}
                  {parking.address.country && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Globe className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Pays
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {parking.address.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lien Google Maps */}
                {parking.address?.maps_link && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Navigation className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Lien Google Maps
                        </p>
                        <a
                          href={parking.address.maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#36CC76] hover:text-[#2BA85F] hover:underline flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Ouvrir sur Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Adresse non définie</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prix et capacité */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Prix & Capacité
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prix</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(parking.default_price, parking.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Capacité totale</span>
                <span className="font-semibold text-gray-900">
                  {parking.total_spaces} places
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Stock vendable</span>
                <span className="font-semibold text-gray-900">
                  {parking.quantity_acquired !== null &&
                  parking.quantity_acquired !== undefined
                    ? `${parking.sellable_stock ?? 0} places`
                    : "Illimité"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Devise</span>
                <span className="font-semibold text-gray-900">
                  {parking.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Section Gestion du stock */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-[#36CC76]" />
                Gestion du stock
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Stock disponible */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Stock vendable
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {parking.quantity_acquired !== null &&
                  parking.quantity_acquired !== undefined
                    ? parking.sellable_stock ?? 0
                    : "∞"}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Places disponibles à la vente
                </p>
              </div>

              {/* Quantité acquise */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Quantité acquise
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {parking.quantity_acquired !== null &&
                  parking.quantity_acquired !== undefined
                    ? parking.quantity_acquired
                    : "∞"}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Total des acquisitions
                </p>
              </div>

              {/* Quantité vendue */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Quantité vendue
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {parking.quantity_sold ?? 0}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Total des ventes effectuées
                </p>
              </div>
            </div>
          </div>

          {/* Type de parking */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Type de parking
              </h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                {parking.parking_type || "Non défini"}
              </p>
            </div>
          </div>

          {/* Événement parent */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Événement parent
              </h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{parking.event_name}</p>
              <p className="text-sm text-gray-600">
                Organisé par{" "}
                {parking.event?.organizer?.company_name ||
                  "Organisateur non défini"}
              </p>
            </div>
          </div>

          {/* Informations système */}
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
                  {formatBackendDate(parking.created_at, "fr-FR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modifié le</span>
                <span className="text-gray-900">
                  {formatBackendDate(parking.updated_at, "fr-FR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingShow;

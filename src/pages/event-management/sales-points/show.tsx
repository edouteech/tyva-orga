import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import { physicalPointsAPI } from "../../../api";
import type { PhysicalPoint } from "../../../lib/types";
import { formatBackendDate } from "../../../lib";
import {
  ArrowLeft,
  MapPin,
  Building,
  Clock,
  Tag,
  Globe,
  Calendar,
} from "lucide-react";

const DAYS_OF_WEEK = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

const SalesPointShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);
  const [point, setPoint] = useState<PhysicalPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPoint = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const pointData = await physicalPointsAPI.getById(parseInt(id));
        setPoint(pointData);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement du point de retrait");
      } finally {
        setLoading(false);
      }
    };
    loadPoint();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#36CC76] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du point de retrait...</p>
        </div>
      </div>
    );
  }

  if (error || !point) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">
            {error || "Point de retrait non trouvé"}
          </p>
          <div className="space-x-4">
            <button
              onClick={() =>
                navigate(
                  `/gestion-evenement/${getEventIdentifier(currentEvent!)}/points-de-vente`,
                )
              }
              className="px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition-colors"
            >
              Retour à la liste
            </button>
            {error && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#EDF7F7] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(
                `/gestion-evenement/${getEventIdentifier(currentEvent!)}/points-de-vente`,
              )
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Retour à la liste des points de retrait"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {point.name}
            </h1>
            <p className="text-gray-600">Détails du point de retrait</p>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Informations générales
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du point
                </label>
                <p className="text-gray-900">{point.name}</p>
              </div>
              {point.organizer_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organisation
                  </label>
                  <p className="text-gray-900">{point.organizer_name}</p>
                </div>
              )}
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
          {/* Adresse */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Adresse
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'adresse
                </label>
                <p className="text-gray-900">{point.address_info.name}</p>
              </div>
              {point.address_info.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">
                    {point.address_info.description}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation
                </label>
                <p className="text-gray-900">
                  {point.address_info.city}, {point.address_info.country}
                </p>
              </div>
              {point.address_info.maps_link && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien Google Maps
                  </label>
                  <a
                    href={point.address_info.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#36CC76] hover:text-[#2BA85F] flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Voir sur Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
          {/* Types de point */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Types de point
            </h2>
            {point.types_labels && point.types_labels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {point.types_labels.map((type, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-[#36CC76]"
                  >
                    <Tag className="w-3 h-3" />
                    {type}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun type configuré</p>
            )}
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Horaires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horaires d'ouverture
            </h2>
            {point.hours && point.hours.length > 0 ? (
              <div className="space-y-3">
                {point.hours.map((hour, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {
                          DAYS_OF_WEEK[
                            hour.day_of_week as keyof typeof DAYS_OF_WEEK
                          ]
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {hour.opening_time} - {hour.closing_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun horaire configuré</p>
            )}
          </div>
          {/* Statistiques */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Statistiques
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Types configurés</span>
                <span className="font-medium text-gray-900">
                  {point.types_labels?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jours d'ouverture</span>
                <span className="font-medium text-gray-900">
                  {point.hours?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPointShow;

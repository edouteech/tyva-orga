import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { activitiesAPI } from "../../../api";
import type { Activity } from "../../../lib/types";
import { formatBackendDate, formatBackendTime } from "../../../lib";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Repeat,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Building2,
} from "lucide-react";

const ActivityShow: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    if (!activityId) return;

    try {
      setLoading(true);
      setError(null);

      const activityData = await activitiesAPI.getById(parseInt(activityId));
      setActivity(activityData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l'activité";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "inactive":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case "event_location":
        return "Lieu de l'événement";
      case "specific_location":
        return "Lieu spécifique";
      default:
        return type;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return {
      date: formatBackendDate(dateTime, "fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: formatBackendTime(dateTime, "fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes > 0 ? `${diffMinutes}min` : ""}`;
    }
    return `${diffMinutes}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#36CC76]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={loadActivity}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600 font-medium">Activité non trouvée</p>
        <button
          onClick={() =>
            navigate(
              `/gestion-evenement/${getEventIdentifier(
                currentEvent!
              )}/activites`
            )
          }
          className="mt-4 px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition-colors"
        >
          Retour aux activités
        </button>
      </div>
    );
  }

  const startTime = formatDateTime(activity.start_datetime);
  const endTime = formatDateTime(activity.end_datetime);
  const duration = formatDuration(
    activity.start_datetime,
    activity.end_datetime
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() =>
            navigate(
              `/gestion-evenement/${getEventIdentifier(
                currentEvent!
              )}/activites`
            )
          }
          className="flex items-center gap-2 text-[#36CC76] hover:text-[#2BA85F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux activités
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête de l'activité */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {activity.name}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      activity.status
                    )}`}
                  >
                    {getStatusIcon(activity.status)}
                    {getStatusLabel(activity.status)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    {getLocationTypeLabel(activity.location_type)}
                  </span>
                  {activity.is_recurring && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      <Repeat className="w-4 h-4" />
                      Récurrente
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-lg text-gray-700 mb-4">{activity.description}</p>
          </div>

          {/* Description détaillée */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Description détaillée
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>
          </div>

          {/* Récurrence */}
          {activity.is_recurring && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Récurrence
              </h2>
              <div className="space-y-4">
                {activity.recurrence_pattern && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Motif</p>
                    <p className="text-gray-900 capitalize">
                      {activity.recurrence_pattern}
                    </p>
                  </div>
                )}
                {activity.recurrence_end_date && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Date de fin
                    </p>
                    <p className="text-gray-900">
                      {formatBackendDate(activity.recurrence_end_date, "fr-FR")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lieu */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lieu
            </h2>
            <div className="space-y-2">
              {activity.effective_address ? (
                <div>
                  <div>{activity.effective_address.name}</div>
                  <div>
                    {activity.effective_address.city},{" "}
                    {activity.effective_address.country}
                  </div>
                  {activity.effective_address.maps_link && (
                    <a
                      href={activity.effective_address.maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Voir sur Google Maps
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Aucune adresse renseignée</div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Dates et horaires */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Dates & Horaires
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Début</p>
                <p className="text-gray-900">{startTime.date}</p>
                <p className="text-gray-700">{startTime.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fin</p>
                <p className="text-gray-900">{endTime.date}</p>
                <p className="text-gray-700">{endTime.time}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600">Durée</p>
                <p className="text-gray-900">{duration}</p>
              </div>
            </div>
          </div>

          {/* Événement parent */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Événement parent
            </h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{activity.event_name}</p>
              {activity.event?.organizer && (
                <p className="text-gray-600 text-sm">
                  {activity.event.organizer.company_name}
                </p>
              )}
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations système
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Créée le</p>
                <p className="text-gray-900">
                  {formatBackendDate(activity.created_at, "fr-FR")} à{" "}
                  {formatBackendTime(activity.created_at, "fr-FR")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Modifiée le</p>
                <p className="text-gray-900">
                  {formatBackendDate(activity.updated_at, "fr-FR")} à{" "}
                  {formatBackendTime(activity.updated_at, "fr-FR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityShow;

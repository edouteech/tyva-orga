import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { DataTable } from "../../../components/global";
import type { Column, Action } from "../../../components/global";
import { activitiesAPI } from "../../../api";
import { formatBackendDate, formatBackendTime } from "../../../lib";
import type { Activity } from "../../../lib";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

const ActivitiesIndex: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);

  const loadData = useCallback(async () => {
    if (!currentEvent) return;

    try {
      setLoading(true);
      setError(null);

      const activitiesData = await activitiesAPI.getByEventId(
        currentEvent.event_id
      );
      setActivities(activitiesData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des activités";
      setError(errorMessage);
    } finally {
      setLoading(false);
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
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-[#EDF7F7] text-[#023C40]";
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

  const formatDateTime = (dateTime: string) => {
    return {
      date: formatBackendDate(dateTime, "fr-FR"),
      time: formatBackendTime(dateTime, "fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const columns: Column<Activity>[] = [
    {
      key: "name",
      label: "Activité",
      sortable: true,
      render: (_, activity) => (
        <div>
          <p className="font-medium text-gray-900">{activity.name}</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">
            {activity.description}
          </p>
        </div>
      ),
    },
    {
      key: "start_datetime",
      label: "Date & Heure",
      sortable: true,
      render: (_, activity) => {
        const startTime = formatDateTime(activity.start_datetime);
        const endTime = formatDateTime(activity.end_datetime);
        return (
          <div>
            <p className="text-sm text-gray-900">{startTime.date}</p>
            <p className="text-xs text-gray-500">
              {startTime.time} - {endTime.time}
            </p>
          </div>
        );
      },
    },
    /*
    {
      key: "location_specific_name",
      label: "Lieu spécifique",
      sortable: false,
      render: (value) => (
        <span className="text-sm text-gray-900">{value || "Non spécifié"}</span>
      ),
    },*/
    {
      key: "is_recurring",
      label: "Récurrente",
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          <Calendar className="w-3 h-3" />
          {value ? "Oui" : "Non"}
        </span>
      ),
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
      label: "Créée le",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3 h-3" />
          {formatBackendDate(value, "fr-FR")}
        </span>
      ),
    },
  ];

  const actions: Action<Activity>[] = [
    {
      label: "Voir",
      onClick: (activity) =>
        navigate(
          `/gestion-evenement/${getEventIdentifier(currentEvent!)}/activites/${
            activity.id
          }`
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
            Gestion des activités
          </h1>
          <p className="text-gray-600">
            Gérez les activités de l'événement "{currentEvent.name}"
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-600">Chargement des activités...</p>
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
          data={activities}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={true}
          exportable={true}
          exportFilename="activites"
          searchPlaceholder="Rechercher une activité..."
          emptyMessage="Aucune activité trouvée"
          pagination={true}
          itemsPerPage={10}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default ActivitiesIndex;

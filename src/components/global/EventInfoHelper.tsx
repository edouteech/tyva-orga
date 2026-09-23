import React from "react";
import { Calendar, Clock, Info } from "lucide-react";
import type { Event } from "../../lib/types";

interface EventInfoHelperProps {
  event: Event;
  className?: string;
}

const EventInfoHelper: React.FC<EventInfoHelperProps> = ({
  event,
  className = "",
}) => {
  const formatDateTime = (dateTime: string) => {
    // Si la date se termine par "Z" (UTC), on la traite comme locale
    // pour éviter le décalage d'1 heure lors de la conversion
    let date: Date;

    if (dateTime.endsWith("Z")) {
      // Supprimer le "Z" et les microsecondes, puis créer la date comme locale
      const localString = dateTime.replace(/\.\d+Z$/, "").replace("Z", "");
      // Parser manuellement pour éviter toute interprétation UTC
      const [datePart, timePart] = localString.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const timeParts = (timePart || "").split(":");
      const hour = Number(timeParts[0]) || 0;
      const minute = Number(timeParts[1]) || 0;
      const second = Number(timeParts[2]) || 0;

      date = new Date(year, month - 1, day, hour, minute, second);
    } else {
      date = new Date(dateTime);
    }

    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const startDateTime = formatDateTime(event.start_datetime);
  const endDateTime = formatDateTime(event.end_datetime);

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-blue-900">
          Information sur l'événement
        </h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-900">Début</p>
              <p className="text-xs text-blue-700">{startDateTime.date}</p>
              <p className="text-xs text-blue-600">{startDateTime.time}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-900">Fin</p>
              <p className="text-xs text-blue-700">{endDateTime.date}</p>
              <p className="text-xs text-blue-600">{endDateTime.time}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-blue-200">
          <p className="text-xs text-blue-600 italic">
            💡 Ces informations vous aident à planifier vos créations dans le
            cadre de l'événement
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventInfoHelper;

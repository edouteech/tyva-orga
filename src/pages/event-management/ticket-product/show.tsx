import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productTicketAttributionRulesAPI } from "../../../api";
import type { ProductTicketAttributionRule } from "../../../lib/types";
import { useAppSelector } from "../../../store/store";
import { formatPrice, formatBackendDate } from "../../../lib/utils";
import {
  ArrowLeft,
  Settings,
  Calendar,
  Tag,
  Package,
  Gift,
  Building2,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";

const TicketProductShow: React.FC = () => {
  const navigate = useNavigate();
  const { ruleId } = useParams();
  const [rule, setRule] = useState<ProductTicketAttributionRule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { currentEvent } = useAppSelector((s) => s.event);

  useEffect(() => {
    const load = async () => {
      if (!ruleId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await productTicketAttributionRulesAPI.getById(
          Number(ruleId)
        );
        setRule(data);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Erreur lors du chargement de la règle"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ruleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Chargement de la règle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Règle non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux règles
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête de la règle */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {rule.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    rule.is_visible
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {rule.is_visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  {rule.is_visible ? "Visible" : "Masquée"}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-blue-600">
                  <Settings className="w-6 h-6" />
                  <span className="text-lg">{rule.threshold}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {rule.application_mode === "one_time"
                    ? "1 fois"
                    : "par paliers"}
                </p>
              </div>
            </div>
          </div>

          {/* Description détaillée */}
          {rule.description && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Description
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {rule.description}
              </p>
            </div>
          )}

          {/* Tickets déclencheurs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Tickets déclencheurs
              </h3>
            </div>
            {rule.tickets && rule.tickets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rule.tickets.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                    title={t.description}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Aucun ticket déclencheur</p>
            )}
          </div>

          {/* Produits attribués */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Produits attribués
              </h3>
            </div>
            {rule.products && rule.products.length > 0 ? (
              <div className="space-y-3">
                {rule.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {p.pivot.attribution_type === "free" ? (
                          <Gift className="w-4 h-4 text-green-600" />
                        ) : p.pivot.attribution_type === "discount" ? (
                          <Tag className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Package className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        x{p.pivot.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          p.pivot.attribution_type === "free"
                            ? "bg-green-100 text-green-700"
                            : p.pivot.attribution_type === "discount"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {p.pivot.attribution_type === "free"
                          ? "Offert"
                          : p.pivot.attribution_type === "discount"
                          ? "Réduction"
                          : "Option payante"}
                      </span>
                      {p.pivot.attribution_type === "discount" &&
                        p.pivot.discounted_price != null && (
                          <span className="text-sm font-medium text-green-600">
                            {formatPrice(
                              Number(p.pivot.discounted_price),
                              p.currency || currentEvent?.currency
                            )}
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Aucun produit attribué</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Configuration de la règle */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Configuration
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Seuil</span>
                <span className="font-semibold text-blue-600">
                  {rule.threshold}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mode d'application</span>
                <span className="font-semibold text-gray-900">
                  {rule.application_mode === "one_time"
                    ? "1 fois"
                    : "Par paliers"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Visibilité</span>
                <span
                  className={`font-semibold ${
                    rule.is_visible ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {rule.is_visible ? "Visible" : "Masquée"}
                </span>
              </div>
            </div>
          </div>

          {/* Période de validité */}
          {(rule.valid_from || rule.valid_to) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Période de validité
                </h3>
              </div>
              <div className="space-y-3">
                {rule.valid_from && (
                  <div>
                    <span className="text-sm text-gray-600">Début</span>
                    <p className="font-medium text-gray-900">
                      {formatBackendDate(rule.valid_from, "fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {rule.valid_to && (
                  <div>
                    <span className="text-sm text-gray-600">Fin</span>
                    <p className="font-medium text-gray-900">
                      {formatBackendDate(rule.valid_to, "fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Événement parent */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Événement parent
              </h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                {currentEvent?.name || "Événement non défini"}
              </p>
              <p className="text-sm text-gray-600">
                Organisé par{" "}
                {currentEvent?.organizer?.company_name ||
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
                  {formatBackendDate(rule.created_at, "fr-FR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modifié le</span>
                <span className="text-gray-900">
                  {formatBackendDate(rule.updated_at, "fr-FR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketProductShow;

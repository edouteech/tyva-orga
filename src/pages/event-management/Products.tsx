import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/store";
import { DataTable } from "../../components/global";
import type { Column, Action } from "../../components/global";
import { productsAPI } from "../../api";
import type { Product } from "../../lib/types";
import { formatPrice, formatBackendDate } from "../../lib/utils";
import { getEventIdentifier } from "../../utils/eventIdentifier";
import {
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Tag,
} from "lucide-react";

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);

  const loadData = useCallback(async () => {
    if (!currentEvent) return;

    try {
      setLoading(true);
      setError(null);

      const productsData = await productsAPI.getByEventId(
        currentEvent.event_id
      );
      setProducts(productsData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des produits";
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
      case "sold_out":
        return <XCircle className="w-3 h-3" />;
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
      case "archived":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-[#EDF7F7] text-[#023C40]";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "inactive":
        return "Inactif";
      case "archived":
        return "Archivé";
      default:
        return status;
    }
  };


  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Produit",
      sortable: true,
      render: (_, product) => (
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">
            {product.description}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Catégorie",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDF7F7] text-[#023C40]">
          <Tag className="w-3 h-3" />
          {value}
        </span>
      ),
    },
    {
      key: "price",
      label: "Prix",
      sortable: true,
      render: (_, product) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-green-600" />
          <span className="font-medium text-gray-900">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>
      ),
    },
    {
      key: "sellable_stock",
      label: "Stock vendable",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900 font-medium">{Number(value ?? 0)}</span>
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

  const actions: Action<Product>[] = [
    {
      label: "Voir",
      onClick: (product) =>
        navigate(
          `/gestion-evenement/${getEventIdentifier(currentEvent!)}/produits/${
            product.id
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
            Gestion des produits
          </h1>
          <p className="text-gray-600">
            Gérez les produits de l'événement "{currentEvent.name}"
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-600">Chargement des produits...</p>
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
          data={products}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={true}
          exportable={true}
          exportFilename="produits"
          searchPlaceholder="Rechercher un produit..."
          emptyMessage="Aucun produit trouvé"
          pagination={true}
          itemsPerPage={10}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};

export default Products;

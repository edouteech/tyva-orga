import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { productsAPI, physicalPointsAPI } from "../../../api";
import type { Product, PhysicalPoint } from "../../../lib/types";
import { formatPrice } from "../../../lib/utils";
import { getEventIdentifier } from "../../../utils/eventIdentifier";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image,
  Tag,
  Package,
  FileText,
  Info,
  TrendingUp,
  ShoppingCart,
  Warehouse,
  X,
  Loader2,
  MapPin,
} from "lucide-react";

const ProductShow: React.FC = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStockByPointModal, setShowStockByPointModal] = useState(false);
  const [physicalPoints, setPhysicalPoints] = useState<PhysicalPoint[]>([]);
  const [stockDetails, setStockDetails] = useState<{
    product: {
      id: number;
      name: string;
      quantity_acquired: number;
      quantity_sold: number;
      quantity_withdrawn: number;
      sellable_stock: number;
      real_stock: number;
    };
    point_stocks: Array<{
      id: number;
      physical_point_id: number;
      physical_point_name: string;
      quantity_acquired: number;
      quantity_sold: number;
      quantity_withdrawn: number;
      sellable_stock: number;
      real_stock: number;
    }>;
  } | null>(null);
  const [loadingStockByPoints, setLoadingStockByPoints] = useState(false);

  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentEvent } = useAppSelector((state) => state.event);

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError("ID du produit manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productData = await productsAPI.getById(parseInt(productId));
      setProduct(productData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du produit";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Charger les points de retrait de l'événement
  const loadPhysicalPoints = useCallback(async () => {
    if (!currentEvent) return;

    try {
      const points = await physicalPointsAPI.getByEventId(
        currentEvent.event_id,
      );
      setPhysicalPoints(points);
    } catch (err: unknown) {
      console.error("Erreur lors du chargement des points de retrait:", err);
    }
  }, [currentEvent]);

  useEffect(() => {
    if (showStockByPointModal && currentEvent) {
      loadPhysicalPoints();
    }
  }, [showStockByPointModal, currentEvent, loadPhysicalPoints]);

  // Charger les stocks détaillés par point physique
  const loadStockByPoints = useCallback(async () => {
    if (!productId) return;

    try {
      setLoadingStockByPoints(true);
      const stockData = await productsAPI.getStocks(parseInt(productId));
      setStockDetails(stockData);
    } catch (err: unknown) {
      console.error("Erreur lors du chargement du stock par point:", err);
      setStockDetails(null);
    } finally {
      setLoadingStockByPoints(false);
    }
  }, [productId]);

  useEffect(() => {
    if (showStockByPointModal && productId) {
      loadStockByPoints();
    }
  }, [showStockByPointModal, productId, loadStockByPoints]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4" />;
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

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return {
      date: date.toLocaleDateString("fr-FR", options),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#36CC76] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={loadProduct}
            className="px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Produit non trouvé</p>
          <p className="text-sm text-gray-500">ID du produit: {productId}</p>
          <button
            onClick={loadProduct}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
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
                  currentEvent!,
                )}/produits`,
              )
            }
            className="flex items-center gap-2 text-[#36CC76] hover:text-[#2BA85F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux produits
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      product.status,
                    )}`}
                  >
                    {getStatusIcon(product.status)}
                    {getStatusLabel(product.status)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-[#EDF7F7] text-[#023C40]">
                    <Tag className="w-3 h-3" />
                    {product.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">{product.description}</p>
            </div>

            {/* Prix */}
            <div className="mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Prix
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price, product.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Section Stock - Informations détaillées */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-[#36CC76]" />
                Gestion du stock
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStockByPointModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Stock par point
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Stock réel */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Stock réel
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {product.real_stock ?? 0}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Stock physique disponible
                </p>
              </div>

              {/* Stock vendable */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Stock vendable
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {product.sellable_stock ?? 0}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Quantité disponible à la vente
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
                  {product.quantity_acquired ?? 0}
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
                  {product.quantity_sold ?? 0}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Total des ventes effectuées
                </p>
              </div>

              {/* Quantité retirée */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    Quantité retirée
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {product.quantity_withdrawn ?? 0}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Produits retirés du stock
                </p>
              </div>
            </div>
          </div>

          {/* Images du produit */}
          {product.main_image_url && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Images du produit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative flex items-center justify-center min-h-[32rem] bg-gray-50 rounded-lg">
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="max-w-full max-h-[48rem] object-contain rounded-lg"
                    style={{ background: "#f9fafb" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations sur l'événement */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Informations sur l'événement
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Événement :
                </span>
                <p className="text-gray-900">{product.event?.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Organisateur :
                </span>
                <p className="text-gray-900">
                  {product.event?.organizer?.company_name}
                </p>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Métadonnées
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Créé le {formatDateTime(product.created_at).date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Modifié le {formatDateTime(product.updated_at).date}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span>Catégorie : {product.category}</span>
              </div>
              {product.currency && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Devise : {product.currency}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal stock par point physique */}
      {showStockByPointModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Stock par point de retrait physique
              </h2>
              <button
                onClick={() => setShowStockByPointModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Résumé global du produit */}
            {stockDetails && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Stock global - {stockDetails.product.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Acquis :</span>
                    <span className="font-semibold text-blue-900 ml-2">
                      {stockDetails.product.quantity_acquired}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vendu :</span>
                    <span className="font-semibold text-orange-900 ml-2">
                      {stockDetails.product.quantity_sold}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Retiré :</span>
                    <span className="font-semibold text-red-900 ml-2">
                      {stockDetails.product.quantity_withdrawn}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Stock vendable :</span>
                    <span className="font-semibold text-green-900 ml-2">
                      {stockDetails.product.sellable_stock}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Stock réel :</span>
                    <span className="font-semibold text-blue-900 ml-2">
                      {stockDetails.product.real_stock}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des points avec leur stock détaillé */}
            {loadingStockByPoints ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#36CC76]" />
              </div>
            ) : !stockDetails || stockDetails.point_stocks.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucun stock trouvé pour les points de retrait
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stockDetails.point_stocks.map((item) => {
                  const point = physicalPoints.find(
                    (p) => p.id === item.physical_point_id,
                  );
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-900">
                              {item.physical_point_name ||
                                point?.name ||
                                `Point #${item.physical_point_id}`}
                            </h3>
                          </div>
                          {point?.address_info?.city && (
                            <p className="text-sm text-gray-600 mb-3">
                              {point.address_info.city}
                              {point.address_info.country &&
                                `, ${point.address_info.country}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Détails du stock pour ce point */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-purple-50 rounded p-2">
                          <p className="text-xs text-purple-700 font-medium mb-1">
                            Acquis
                          </p>
                          <p className="text-lg font-bold text-purple-900">
                            {item.quantity_acquired}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded p-2">
                          <p className="text-xs text-orange-700 font-medium mb-1">
                            Vendu
                          </p>
                          <p className="text-lg font-bold text-orange-900">
                            {item.quantity_sold}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded p-2">
                          <p className="text-xs text-red-700 font-medium mb-1">
                            Retiré
                          </p>
                          <p className="text-lg font-bold text-red-900">
                            {item.quantity_withdrawn}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded p-2">
                          <p className="text-xs text-green-700 font-medium mb-1">
                            Stock vendable
                          </p>
                          <p className="text-lg font-bold text-green-900">
                            {item.sellable_stock}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded p-2">
                          <p className="text-xs text-blue-700 font-medium mb-1">
                            Stock réel
                          </p>
                          <p className="text-lg font-bold text-blue-900">
                            {item.real_stock}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
              <button
                onClick={() => setShowStockByPointModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductShow;

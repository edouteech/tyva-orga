import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Upload,
  Loader2,
  AlertCircle,
  Trash2,
  Edit3,
  Save,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { eventsAPI } from "../api";
import type { Image as ImageType } from "../lib/types";

interface EventGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventName: string;
}

interface ImageFormData {
  alt_text: string;
  description: string;
  sort_order: number;
}

const EventGalleryModal: React.FC<EventGalleryModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
}) => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>(
    []
  );
  const [editingImage, setEditingImage] = useState<number | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{
    [index: number]: ImageFormData;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les images existantes
  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        const galleryImages = await eventsAPI.getGalleryImages(eventId);
        setImages(galleryImages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des images"
        );
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && eventId) {
      loadImages();
    }
  }, [isOpen, eventId]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);

    // Vérifier la limite de 20 images totales
    if (images.length + selectedFiles.length + newFiles.length > 20) {
      setError(
        `Vous ne pouvez pas ajouter plus de 20 images de galerie. Actuellement: ${
          images.length + selectedFiles.length
        }, Tentative d'ajout: ${newFiles.length}`
      );
      return;
    }

    // Vérifier la limite de 10 images par upload
    if (newFiles.length > 10) {
      setError("Vous ne pouvez pas uploader plus de 10 images à la fois");
      return;
    }

    // Vérifier la limite de 10 images en cours de sélection
    if (selectedFiles.length + newFiles.length > 10) {
      setError(
        `Vous ne pouvez pas sélectionner plus de 10 images à la fois. Actuellement sélectionnées: ${selectedFiles.length}, Tentative d'ajout: ${newFiles.length}`
      );
      return;
    }

    const newPreviews = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Initialiser les métadonnées pour les nouvelles images
    const startIndex = selectedFiles.length;
    const newMetadata: { [index: number]: ImageFormData } = {};
    newFiles.forEach((_, index) => {
      newMetadata[startIndex + index] = {
        alt_text: "",
        description: "",
        sort_order: images.length + startIndex + index,
      };
    });
    setImageMetadata((prev) => ({ ...prev, ...newMetadata }));

    // Effacer les erreurs précédentes
    setError(null);
  };

  const removePreview = (index: number) => {
    const preview = previews[index];
    URL.revokeObjectURL(preview.preview);

    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

    // Supprimer les métadonnées correspondantes
    setImageMetadata((prev) => {
      const newMetadata = { ...prev };
      delete newMetadata[index];
      // Réorganiser les indices
      const reorganizedMetadata: { [index: number]: ImageFormData } = {};
      Object.entries(newMetadata).forEach(([key, value]) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reorganizedMetadata[keyNum - 1] = value;
        } else {
          reorganizedMetadata[keyNum] = value;
        }
      });
      return reorganizedMetadata;
    });
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    // Vérification finale avant upload
    if (images.length + selectedFiles.length > 20) {
      setError(
        `Vous ne pouvez pas ajouter plus de 20 images de galerie. Actuellement: ${images.length}, Tentative d'ajout: ${selectedFiles.length}`
      );
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload chaque image avec ses métadonnées individuelles
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const metadata = imageMetadata[index] || {
          alt_text: "",
          description: "",
          sort_order: images.length + index,
        };

        const imageData = {
          alt_text: metadata.alt_text || undefined,
          description: metadata.description || undefined,
          sort_order: metadata.sort_order,
        };

        return await eventsAPI.uploadGalleryImage(eventId, file, imageData);
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedImages]);

      // Nettoyer les prévisualisations et métadonnées
      previews.forEach((preview) => URL.revokeObjectURL(preview.preview));
      setPreviews([]);
      setSelectedFiles([]);
      setImageMetadata({});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'upload des images"
      );
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageId: number) => {
    try {
      await eventsAPI.removeGalleryImage(eventId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    }
  };

  const startEditing = (image: ImageType) => {
    setEditingImage(image.id);
    // Utiliser un état temporaire pour l'édition
    setImageMetadata({
      0: {
        alt_text: image.alt_text || "",
        description: image.description || "",
        sort_order: image.sort_order,
      },
    });
  };

  const saveEdit = async (imageId: number) => {
    try {
      // Ici vous devriez avoir une API pour mettre à jour les métadonnées
      // Pour l'instant, on simule la mise à jour
      const metadata = imageMetadata[0];
      if (metadata) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, ...metadata } : img
          )
        );
      }
      setEditingImage(null);
      setImageMetadata({});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde"
      );
    }
  };

  const moveImage = async (imageId: number, direction: "up" | "down") => {
    const imageIndex = images.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) return;

    const newIndex = direction === "up" ? imageIndex - 1 : imageIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    try {
      // Créer le nouvel ordre
      const newImages = [...images];
      [newImages[imageIndex], newImages[newIndex]] = [
        newImages[newIndex],
        newImages[imageIndex],
      ];

      // Mettre à jour les sort_order
      const reorderData = newImages.map((img, index) => ({
        id: img.id,
        sort_order: index,
      }));

      await eventsAPI.reorderGalleryImages(eventId, reorderData);
      setImages(newImages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du réordonnement"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Galerie d'images - {eventName}
            </h3>
            <p className="text-sm text-gray-500">
              Gérez les images de votre événement
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Section d'upload */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-800">
                Ajouter de nouvelles images
              </h4>
              <div className="text-sm text-gray-500">
                {images.length}/20 images • Maximum 10 par ajout
              </div>
            </div>

            <div className="space-y-4">
              {/* Sélection de fichiers */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  multiple
                  className="hidden"
                  aria-label="Sélectionner des images pour la galerie"
                  disabled={images.length >= 20}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 20}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-300 disabled:hover:bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  {images.length >= 20
                    ? "Limite de 20 images atteinte"
                    : "Sélectionner des images"}
                </button>

                <p className="text-xs text-gray-500 mt-1">
                  Formats supportés: JPEG, PNG, JPG, GIF, WebP (max 2MB par
                  image)
                </p>
              </div>

              {/* Prévisualisations avec métadonnées individuelles */}
              {previews.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {previews.map((preview, index) => {
                      const metadata = imageMetadata[index] || {
                        alt_text: "",
                        description: "",
                        sort_order: images.length + index,
                      };

                      return (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          {/* Prévisualisation */}
                          <div className="relative group mb-3">
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={preview.preview}
                                alt="Prévisualisation"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePreview(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Supprimer cette prévisualisation"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Métadonnées individuelles */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Texte alternatif (optionnel)
                              </label>
                              <input
                                type="text"
                                value={metadata.alt_text}
                                onChange={(e) =>
                                  setImageMetadata((prev) => ({
                                    ...prev,
                                    [index]: {
                                      ...prev[index],
                                      alt_text: e.target.value,
                                    },
                                  }))
                                }
                                maxLength={255}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Description courte de l'image"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {metadata.alt_text.length}/255 caractères
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (optionnel)
                              </label>
                              <textarea
                                value={metadata.description}
                                onChange={(e) =>
                                  setImageMetadata((prev) => ({
                                    ...prev,
                                    [index]: {
                                      ...prev[index],
                                      description: e.target.value,
                                    },
                                  }))
                                }
                                maxLength={1000}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Description détaillée de l'image"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {metadata.description.length}/1000 caractères
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={uploadImages}
                    disabled={
                      uploading || images.length + selectedFiles.length > 20
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ajout en cours...
                      </>
                    ) : images.length + selectedFiles.length > 20 ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Limite de 20 images atteinte
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Ajouter {selectedFiles.length} image(s)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Galerie existante */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">
              Images existantes
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">
                  Chargement des images...
                </span>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune image dans la galerie</p>
                <p className="text-sm">Ajoutez des images pour commencer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="aspect-video bg-gray-100">
                      <img
                        src={image.url}
                        alt={image.alt_text || "Image de galerie"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-3 space-y-2">
                      {editingImage === image.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={imageMetadata[0]?.alt_text || ""}
                            onChange={(e) =>
                              setImageMetadata((prev) => ({
                                ...prev,
                                0: {
                                  ...prev[0],
                                  alt_text: e.target.value,
                                },
                              }))
                            }
                            placeholder="Texte alternatif"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            aria-label="Texte alternatif"
                          />
                          <textarea
                            value={imageMetadata[0]?.description || ""}
                            onChange={(e) =>
                              setImageMetadata((prev) => ({
                                ...prev,
                                0: {
                                  ...prev[0],
                                  description: e.target.value,
                                },
                              }))
                            }
                            placeholder="Description"
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            aria-label="Description"
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(image.id)}
                              className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <Save className="w-3 h-3 inline mr-1" />
                              Sauver
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingImage(null);
                                setImageMetadata({});
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {image.alt_text || "Sans titre"}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {image.description || "Aucune description"}
                          </p>
                          <p className="text-xs text-gray-400">
                            Ordre: {image.sort_order}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-1">
                        {editingImage !== image.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(image)}
                              className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Edit3 className="w-3 h-3 inline mr-1" />
                              Éditer
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(image.id, "up")}
                              disabled={index === 0}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                              title="Monter"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(image.id, "down")}
                              disabled={index === images.length - 1}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                              title="Descendre"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventGalleryModal;

import React, { useState, useRef } from "react";
import { Image, Loader2, AlertCircle } from "lucide-react";
import { productsAPI } from "../api";

interface ProductImageUploadProps {
  productId: number;
  currentImageUrl?: string;
  onImageChange: (newImageUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  currentImageUrl,
  onImageChange,
  disabled = false,
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validation du fichier
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Veuillez sélectionner une image au format JPEG, PNG, JPG, GIF ou WebP"
      );
      return;
    }

    // Validation de la taille (5MB max pour correspondre à l'API)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("L'image ne peut pas dépasser 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Créer une prévisualisation immédiate
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload de l'image
      const updatedProduct = await productsAPI.uploadImage(productId, file);

      // Mettre à jour l'URL de l'image
      onImageChange(updatedProduct.main_image_url);

      // Garder la prévisualisation temporaire un moment pour permettre le chargement de l'image serveur
      setTimeout(() => {
        setPreviewUrl(null);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'upload de l'image"
      );
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    setIsRemoving(true);
    setError(null);

    try {
      await productsAPI.removeImage(productId);
      onImageChange(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de l'image"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Réinitialiser l'input pour permettre la sélection du même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Image principale
      </label>

      {/* Zone d'upload */}
      <div className="space-y-3">
        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
          aria-label="Sélectionner une image pour le produit"
        />

        {/* Zone d'affichage */}
        {!displayImageUrl ? (
          <div
            onClick={() =>
              !disabled && !isUploading && fileInputRef.current?.click()
            }
            className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${
              disabled || isUploading
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-600">Upload en cours...</p>
              </div>
            ) : (
              <div>
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Cliquez pour sélectionner une image
                </p>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, JPG, GIF, WebP (max 5MB)
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Prévisualisation de l'image */}
            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300">
              <img
                src={displayImageUrl}
                alt="Image du produit"
                className="w-full h-full object-cover block"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  setImageLoading(false);
                }}
                onLoad={() => {
                  setImageLoading(false);
                }}
                onLoadStart={() => {
                  setImageLoading(true);
                }}
              />

              {/* Indicateur de chargement */}
              {(isUploading || isRemoving || imageLoading) && (
                <div
                  className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center animate-pulse ${
                    isRemoving
                      ? "bg-gradient-to-br from-red-50/80 to-pink-50/80"
                      : "bg-gradient-to-br from-blue-50/80 to-purple-50/80"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <Loader2
                        className={`w-10 h-10 animate-spin ${
                          isRemoving ? "text-red-600" : "text-blue-600"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 w-10 h-10 border-2 rounded-full animate-ping ${
                          isRemoving ? "border-red-200" : "border-blue-200"
                        }`}
                      ></div>
                    </div>
                    <div className="text-sm font-medium text-gray-700 animate-bounce">
                      {isRemoving
                        ? "Suppression en cours..."
                        : isUploading
                        ? "Upload en cours..."
                        : "Chargement..."}
                    </div>
                    <div className="flex space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          isRemoving ? "bg-red-500" : "bg-blue-500"
                        }`}
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          isRemoving ? "bg-red-500" : "bg-blue-500"
                        }`}
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          isRemoving ? "bg-red-500" : "bg-blue-500"
                        }`}
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons d'action en dessous */}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  !disabled && !isUploading && fileInputRef.current?.click()
                }
                disabled={disabled || isUploading || isRemoving}
                className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Changer l'image
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading || isRemoving}
                className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}

        {/* Affichage des erreurs */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageUpload;

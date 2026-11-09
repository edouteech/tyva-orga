import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { accreditationsAPI, accreditationFunctionsAPI, activitiesAPI } from "../../../api/api";
import type { Accreditation, AccreditationFunction, Activity } from "../../../lib/types";
import { DataTable, DeleteConfirmation } from "../../../components/global";
import type { Column, Action } from "../../../components/global";
import AccreditationFunctionsModal from "./AccreditationFunctionsModal";
import {
  Plus,
  Mail,
  Download,
  FolderArchive,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  X,
  XCircle,
  Image as ImageIcon,
  Eye,
  RefreshCw,
  Tags,
} from "lucide-react";

export default function Accreditations() {
  const { eventId } = useParams<{ eventId: string }>();
  const { currentEvent } = useAppSelector((state) => state.event);
  const eventIdNum = currentEvent?.event_id || (eventId ? parseInt(eventId) : 0);

  const [accreditations, setAccreditations] = useState<Accreditation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "warning"; text: string } | null>(null);
  const [functions, setFunctions] = useState<AccreditationFunction[]>([]);
  const [showFunctionsModal, setShowFunctionsModal] = useState(false);

  // Sélecteur de mode (onglets principaux)
  const [mainTab, setMainTab] = useState<"direct" | "validation">("direct");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreValidationModal, setShowPreValidationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");

  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingPreValidation, setIsCreatingPreValidation] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    accreditation: Accreditation | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    accreditation: null,
    isLoading: false,
  });

  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    accreditation: Accreditation | null;
  }>({
    isOpen: false,
    accreditation: null,
  });

  // Form states - Nominative directe
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    function_id: "",
    organization: "",
    activity_ids: [] as number[],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form states - Lot non-nominatif
  const [batchFormData, setBatchFormData] = useState({
    function_id: "",
    organization: "",
    quantity: 10,
    activity_ids: [] as number[],
  });

  // Form states - Pré-validation
  const [preValidationFormData, setPreValidationFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    function_id: "",
    organization: "",
    activity_ids: [] as number[],
  });

  useEffect(() => {
    if (eventIdNum) {
      loadAccreditations();
      loadActivities();
      loadFunctions();
    }
  }, [eventIdNum]);

  // Un succès disparaît seul ; un avertissement reste jusqu'à ce qu'on le ferme
  useEffect(() => {
    if (notice?.type !== "success") return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadFunctions = async () => {
    try {
      setFunctions(await accreditationFunctionsAPI.getAll(eventIdNum));
    } catch (err) {
      console.error("Error loading functions:", err);
      setError("Erreur lors du chargement des fonctions");
    }
  };

  const loadAccreditations = async () => {
    try {
      setLoading(true);
      const data = await accreditationsAPI.getAll({ event_id: eventIdNum });
      setAccreditations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error loading accreditations:", err);
      setError("Erreur lors du chargement des accréditations");
      setAccreditations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      if (!eventIdNum) return;
      const data = await activitiesAPI.getByEventId(eventIdNum);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement des activités:", err);
      setActivities([]);
    }
  };

  const compressImageIfNeeded = async (file: File): Promise<{ file: File; preview: string }> => {
    if (file.size <= 2 * 1024 * 1024) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ file, preview: ev.target?.result as string });
        reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
        reader.readAsDataURL(file);
      });
    }

    // Si > 2 Mo (ex: photo smartphone), redimensionnement automatique vers max 1200px pour respecter la limite PHP 2 Mo
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Erreur de chargement de l'image"));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas non disponible"));
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Erreur lors de l'optimisation"));
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".jpg"),
                { type: "image/jpeg" }
              );
              const preview = canvas.toDataURL("image/jpeg", 0.85);
              resolve({ file: optimizedFile, preview });
            },
            "image/jpeg",
            0.85
          );
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier (standard du projet)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setModalError(
        "Veuillez sélectionner une image au format JPEG, PNG, JPG, GIF ou WebP"
      );
      return;
    }

    setModalError(null);

    try {
      const result = await compressImageIfNeeded(file);
      if (result.file.size > 2 * 1024 * 1024) {
        setModalError("L'image est trop volumineuse (> 2 Mo). Veuillez sélectionner une image plus légère.");
        return;
      }
      setPhotoFile(result.file);
      setPhotoPreview(result.preview);
    } catch {
      setModalError("Impossible de traiter l'image sélectionnée. Veuillez réessayer.");
    }
  };

  const handleToggleActivity = (
    activityId: number,
    target: "single" | "batch" | "preValidation"
  ) => {
    if (target === "single") {
      setFormData((prev) => ({
        ...prev,
        activity_ids: prev.activity_ids.includes(activityId)
          ? prev.activity_ids.filter((id) => id !== activityId)
          : [...prev.activity_ids, activityId],
      }));
    } else if (target === "batch") {
      setBatchFormData((prev) => ({
        ...prev,
        activity_ids: prev.activity_ids.includes(activityId)
          ? prev.activity_ids.filter((id) => id !== activityId)
          : [...prev.activity_ids, activityId],
      }));
    } else {
      setPreValidationFormData((prev) => ({
        ...prev,
        activity_ids: prev.activity_ids.includes(activityId)
          ? prev.activity_ids.filter((id) => id !== activityId)
          : [...prev.activity_ids, activityId],
      }));
    }
  };

  const getPhotoSrc = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
    return `${baseUrl}/storage/${url.replace(/^storage\//, "")}`;
  };

  const handleCreateDirectAccreditation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      setError(null);
      setModalError(null);

      const data = new FormData();
      data.append("event_id", String(eventIdNum));
      data.append("first_name", formData.first_name);
      data.append("last_name", formData.last_name);
      if (formData.email) data.append("email", formData.email);
      if (formData.phone) data.append("phone", formData.phone);
      data.append("function_id", formData.function_id);
      if (formData.organization) data.append("organization", formData.organization);
      formData.activity_ids.forEach((id) => data.append("activity_ids[]", String(id)));
      if (photoFile) {
        data.append("photo", photoFile);
      }

      warnIfEmailNotSent(await accreditationsAPI.createDirect(data));

      setShowCreateModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        function_id: "",
        organization: "",
        activity_ids: [],
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setModalError(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
      await loadAccreditations();
    } catch (err: any) {
      console.error(err);
      const valErrors = err?.response?.data?.errors;
      let msg = err?.response?.data?.message || err?.message || "Erreur lors de la création de l'accréditation";
      if (valErrors && typeof valErrors === "object") {
        const details = Object.values(valErrors).flat().filter(Boolean);
        if (details.length > 0) msg = details.join(". ");
      }
      setModalError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingBatch(true);
      setError(null);
      setModalError(null);

      await accreditationsAPI.createBatch({
        event_id: eventIdNum,
        function_id: Number(batchFormData.function_id),
        organization: batchFormData.organization || undefined,
        quantity: Number(batchFormData.quantity),
        activity_ids: batchFormData.activity_ids,
      });

      setShowCreateModal(false);
      setBatchFormData({
        function_id: "",
        organization: "",
        quantity: 10,
        activity_ids: [],
      });
      setModalError(null);
      await loadAccreditations();
    } catch (err: any) {
      console.error(err);
      const valErrors = err?.response?.data?.errors;
      let msg = err?.response?.data?.message || err?.message || "Erreur lors de la création du lot d'accréditations";
      if (valErrors && typeof valErrors === "object") {
        const details = Object.values(valErrors).flat().filter(Boolean);
        if (details.length > 0) msg = details.join(". ");
      }
      setModalError(msg);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleCreatePreValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingPreValidation(true);
      setError(null);
      setModalError(null);

      const created = await accreditationsAPI.createPreValidation({
        event_id: eventIdNum,
        first_name: preValidationFormData.first_name,
        last_name: preValidationFormData.last_name,
        email: preValidationFormData.email,
        phone: preValidationFormData.phone || undefined,
        function_id: Number(preValidationFormData.function_id),
        organization: preValidationFormData.organization || undefined,
        activity_ids: preValidationFormData.activity_ids,
      });
      warnIfEmailNotSent(created);

      setShowPreValidationModal(false);
      setPreValidationFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        function_id: "",
        organization: "",
        activity_ids: [],
      });
      setModalError(null);
      await loadAccreditations();
    } catch (err: any) {
      console.error(err);
      const valErrors = err?.response?.data?.errors;
      let msg = err?.response?.data?.message || err?.message || "Erreur lors de l'envoi de la pré-validation";
      if (valErrors && typeof valErrors === "object") {
        const details = Object.values(valErrors).flat().filter(Boolean);
        if (details.length > 0) msg = details.join(". ");
      }
      setModalError(msg);
    } finally {
      setIsCreatingPreValidation(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
      await accreditationsAPI.delete(id);
      await loadAccreditations();
      setDeleteConfirm({ isOpen: false, accreditation: null, isLoading: false });
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression de l'accréditation");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Les PDF sont générés au premier téléchargement : pdf_url peut être vide sur un badge valide
  const canDownloadBadge = (acc: Accreditation) =>
    acc.status !== "pending_confirmation" && acc.status !== "rejected";

  const warnIfEmailNotSent = (acc: Accreditation) => {
    if (acc.email_sent === false) {
      setNotice({
        type: "warning",
        text: "L'accréditation est créée, mais l'e-mail n'a pas pu être envoyé. Utilisez l'action « Renvoyer l'e-mail ».",
      });
    }
  };

  const handleResend = async (acc: Accreditation) => {
    try {
      setError(null);
      setNotice({ type: "success", text: await accreditationsAPI.resend(acc.id) });
      await loadAccreditations();
    } catch (err: any) {
      console.error("Erreur renvoi e-mail:", err);
      setError(err?.response?.data?.message || "Impossible de renvoyer l'e-mail");
    }
  };

  const handleDownloadBadge = async (id: number, badgeNumber: string) => {
    try {
      const blob = await accreditationsAPI.downloadBadge(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `badge_${badgeNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erreur téléchargement badge:", err);
      setError("Impossible de télécharger le badge");
    }
  };

  const handleDownloadBatch = async (batchId: string, batchTitle: string) => {
    try {
      const blob = await accreditationsAPI.downloadBatch(batchId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lot_${batchTitle.replace(/\s+/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erreur téléchargement du lot:", err);
      setError("Impossible de télécharger le lot d'accréditations");
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "confirmed":
      case "sent":
        return <CheckCircle className="w-3 h-3" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      case "generated":
        return <FileText className="w-3 h-3" />;
      case "pending_confirmation":
        return <Clock className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "confirmed":
      case "sent":
        return "bg-purple-100 text-purple-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "generated":
        return "bg-blue-100 text-blue-700";
      case "pending_confirmation":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-[#EDF7F7] text-[#023C40]";
    }
  };

  const getStatusLabel = (status?: string, type?: string) => {
    switch (status) {
      case "rejected":
        return "A refusé";
      case "generated":
        return "Non envoyé";
      case "sent":
        return type === "pre_validation" ? "A accepté" : "Envoyé par e-mail";
      case "confirmed":
        return "A accepté";
      case "pending_confirmation":
        return "En attente de réponse";
      default:
        return status || "-";
    }
  };

  const filteredAccreditations = Array.isArray(accreditations)
    ? accreditations.filter((acc) => {
        if (!acc) return false;

        // Filtrage selon l'onglet principal
        if (mainTab === "direct") {
          if (acc.type !== "direct" && acc.type !== "batch") return false;
        } else if (mainTab === "validation") {
          if (acc.type !== "pre_validation") return false;
        }

        // Filtrage statut de présence
        if (statusFilter === "present") {
          const isPresent = Boolean(
            (acc.is_used && acc.is_used > 0) ||
            (acc.verifications && acc.verifications.length > 0)
          );
          if (!isPresent) return false;
        } else if (statusFilter === "not_scanned") {
          const isPresent = Boolean(
            (acc.is_used && acc.is_used > 0) ||
            (acc.verifications && acc.verifications.length > 0)
          );
          if (isPresent) return false;
        } else if (statusFilter === "nominative" || statusFilter === "non_nominative") {
          if (acc.format !== statusFilter) return false;
        } else if (statusFilter === "generated") {
          if (acc.status !== "generated" || acc.type === "batch") return false;
        } else if (statusFilter === "accepted") {
          // Une personne a accepté même si l'envoi de son badge a échoué
          if (acc.status !== "confirmed" && acc.status !== "sent") return false;
        } else if (statusFilter !== "all" && acc.status !== statusFilter) {
          return false;
        }

        return true;
      })
    : [];

  const columns: Column<Accreditation>[] = [
    {
      key: "badge_number",
      label: "N° BADGE",
      sortable: true,
      render: (_, acc) => (
        <span className="font-mono font-bold text-sm text-gray-900">
          {acc?.badge_number || "-"}
        </span>
      ),
    },
    {
      key: "type",
      label: "TYPE",
      sortable: true,
      render: (_, acc) => {
        let typeLabel = "";
        let typeColor = "";
        if (acc?.type === "direct") {
          typeLabel = "Accréditation Directe";
          typeColor = "text-blue-600";
        } else if (acc?.type === "batch" || acc?.format === "non_nominative") {
          typeLabel = "Lot";
          typeColor = "text-green-600";
        } else if (acc?.type === "pre_validation") {
          typeLabel = "Accréditation avec Validation";
          typeColor = "text-purple-600";
        } else {
          typeLabel = acc?.type || "-";
          typeColor = "text-gray-600";
        }

        return (
          <span className={`text-sm font-medium ${typeColor}`}>
            {typeLabel}
          </span>
        );
      },
    },
    {
      key: "first_name",
      label: "NOM",
      sortable: true,
      render: (_, acc) => {
        if (acc?.format === "non_nominative") {
          return (
            <span className="text-sm text-gray-400">-</span>
          );
        }
        const fullName = `${acc?.first_name || ""} ${acc?.last_name || ""}`.trim();
        return (
          <span className="text-sm">
            {fullName || "-"}
          </span>
        );
      },
    },
    {
      key: "email",
      label: "EMAIL",
      sortable: true,
      render: (_, acc) => (
        <span className="text-sm text-gray-600">{acc?.email || "-"}</span>
      ),
    },
    {
      key: "phone",
      label: "TÉLÉPHONE",
      sortable: true,
      render: (_, acc) => (
        <span className="text-sm text-gray-600">{acc?.phone || "-"}</span>
      ),
    },
    {
      key: "created_at",
      label: "LOT",
      sortable: true,
      render: (_, acc) => {
        if (!acc?.batch_id) {
          return <span className="text-sm text-gray-600">-</span>;
        }
        const date = new Date(acc.created_at);
        const day = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
        const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
        return <span className="text-sm text-gray-600">{`${day} à ${time}`}</span>;
      },
    },
    {
      key: "status",
      label: "STATUT",
      sortable: true,
      // Un badge de lot n'a pas d'e-mail : il n'a pas de statut d'envoi à montrer
      render: (_, acc) =>
        acc?.type === "batch" ? (
          <span className="text-sm text-gray-400">-</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {getStatusIcon(acc?.status)}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                acc?.status
              )}`}
            >
              {getStatusLabel(acc?.status, acc?.type)}
            </span>
          </div>
        ),
    },
    {
      key: "is_used",
      label: "PRÉSENCE",
      sortable: true,
      render: (_, acc) => {
        const isPresent = Boolean(
          (acc?.is_used && acc.is_used > 0) ||
          (acc?.verifications && acc.verifications.length > 0)
        );
        const lastScan = acc?.verifications?.[0]?.date_verif;
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${
                isPresent
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isPresent ? "✓ Présent" : "Non scanné"}
            </span>
            {isPresent && lastScan && (
              <span className="text-[10px] text-gray-500">
                {new Date(lastScan).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const renderFunctionSelect = (value: string, onChange: (value: string) => void) => (
    <>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none bg-white"
      >
        <option value="">Choisir une fonction...</option>
        {functions.map((fn) => (
          <option key={fn.id} value={fn.id}>
            {fn.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setShowFunctionsModal(true)}
        className="mt-1 text-xs font-medium text-[#023C40] hover:underline"
      >
        {functions.length === 0 ? "Aucune fonction : en créer une" : "Gérer les fonctions"}
      </button>
    </>
  );

  const actions: Action<Accreditation>[] = [
    {
      label: "Voir les détails",
      icon: Eye,
      onClick: (acc) => setDetailsModal({ isOpen: true, accreditation: acc }),
    },
    {
      label: "Télécharger le badge (PDF)",
      icon: Download,
      onClick: (acc) => handleDownloadBadge(acc.id, acc.badge_number),
      show: canDownloadBadge,
    },
    {
      label: "Télécharger le lot (ZIP)",
      icon: FolderArchive,
      onClick: (acc) => {
        if (acc.batch_id) {
          handleDownloadBatch(acc.batch_id, acc.batch_title || "accreditations");
        }
      },
      show: (acc) => !!acc.batch_id,
    },
    {
      label: "Renvoyer l'e-mail",
      icon: RefreshCw,
      onClick: handleResend,
      show: (acc) => !!acc.email && acc.status !== "rejected",
    },
    {
      label: "Supprimer",
      icon: Trash2,
      onClick: (acc) =>
        setDeleteConfirm({
          isOpen: true,
          accreditation: acc,
          isLoading: false,
        }),
    },
  ];

  return (
    <div>
      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Accréditations</h1>
          <p className="text-sm text-gray-600 mt-1">
            Créez et gérez les accréditations pour cet événement
          </p>
        </div>
      </div>

      {/* Sélecteur de mode — onglets */}
      <div className="flex gap-4 mb-0">
        <button
          onClick={() => {
            setMainTab("direct");
            setStatusFilter("all");
          }}
          className={`px-6 py-4 font-semibold transition-all border-2 rounded-t-xl flex items-center justify-center gap-3 ${
            mainTab === "direct"
              ? "border-[#36CC76] bg-[#36CC76] text-white shadow-lg"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#36CC76]/50 hover:bg-[#f0fdf4]"
          }`}
        >
          <Plus className="w-5 h-5" />
          Accréditation Directe
        </button>

        <button
          onClick={() => {
            setMainTab("validation");
            setStatusFilter("all");
          }}
          className={`px-6 py-4 font-semibold transition-all border-2 rounded-t-xl flex items-center justify-center gap-3 ${
            mainTab === "validation"
              ? "border-[#4A94E3] bg-[#4A94E3] text-white shadow-lg"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#4A94E3]/50 hover:bg-[#eff6ff]"
          }`}
        >
          <Mail className="w-5 h-5" />
          Accréditation avec Validation
        </button>
      </div>

      {/* Barre d'action et filtre */}
      <div className="bg-white border border-gray-200 border-b-0 shadow-sm px-5 py-4 flex items-center justify-between gap-4 mt-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
            Afficher :
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#36CC76] focus:border-transparent bg-gray-50"
          >
            <option value="all">Tous les badges</option>
            <optgroup label="Présence sur place">
              <option value="present">Présents (badge scanné)</option>
              <option value="not_scanned">Pas encore arrivés (non scanné)</option>
            </optgroup>
            {mainTab === "direct" ? (
              <>
                <optgroup label="Type de badge">
                  <option value="nominative">Nominatif</option>
                  <option value="non_nominative">Non nominatif</option>
                </optgroup>
                <optgroup label="Envoi du badge">
                  <option value="sent">Badge envoyé par e-mail</option>
                  <option value="generated">Badge non envoyé par e-mail</option>
                </optgroup>
              </>
            ) : (
              <optgroup label="Réponse de la personne">
                <option value="pending_confirmation">En attente de réponse</option>
                <option value="accepted">A accepté</option>
                <option value="rejected">A refusé</option>
              </optgroup>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFunctionsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#023C40] border border-[#023C40]/30 rounded-lg hover:bg-[#EDF7F7] transition shadow-sm font-medium text-sm"
          >
            <Tags className="w-4 h-4" />
            Fonctions
          </button>
          {mainTab === "direct" ? (
            <button
              onClick={() => {
                setActiveTab("single");
                setFormData({
                  first_name: "",
                  last_name: "",
                  email: "",
                  phone: "",
                  function_id: "",
                  organization: "",
                  activity_ids: [],
                });
                setPhotoFile(null);
                setPhotoPreview(null);
                setModalError(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition shadow-sm font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle accréditation directe
            </button>
          ) : (
            <button
              onClick={() => {
                setPreValidationFormData({
                  first_name: "",
                  last_name: "",
                  email: "",
                  phone: "",
                  function_id: "",
                  organization: "",
                  activity_ids: [],
                });
                setModalError(null);
                setShowPreValidationModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A94E3] text-white rounded-lg hover:bg-[#3a7bcf] transition shadow-sm font-medium text-sm"
            >
              <Mail className="w-4 h-4" />
              Nouvelle accréditation avec validation
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-[80] w-[calc(100%-2rem)] max-w-sm flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border bg-white text-sm ${
            notice.type === "success" ? "border-green-200 text-green-800" : "border-amber-300 text-amber-800"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          )}
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showFunctionsModal && (
        <AccreditationFunctionsModal
          eventId={eventIdNum}
          functions={functions}
          onChanged={loadFunctions}
          onClose={() => setShowFunctionsModal(false)}
        />
      )}

      {/* Tableau des accréditations */}
      <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0 mt-0">
        <DataTable
          columns={columns}
          data={filteredAccreditations}
          actions={actions}
          loading={loading}
          emptyMessage="Aucune accréditation trouvée"
        />
      </div>

      {/* MODAL CRÉATION ACCRÉDITATION DIRECTE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Accréditation Directe</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setModalError(null);
                  if (photoInputRef.current) photoInputRef.current.value = "";
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Alerte d'erreur dans la modale */}
            {modalError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalError(null)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Onglets dans le modal */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("single")}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === "single"
                    ? "border-[#36CC76] text-[#36CC76]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Nominative
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("batch")}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === "batch"
                    ? "border-[#36CC76] text-[#36CC76]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Non Nominative
              </button>
            </div>

            {activeTab === "single" ? (
              <form onSubmit={handleCreateDirectAccreditation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      placeholder="Ex: DUPONT"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      placeholder="Ex: Jean"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organisme
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData({ ...formData, organization: e.target.value })
                      }
                      placeholder="Ex: Canal+, TF1..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fonction *
                    </label>
                    {renderFunctionSelect(formData.function_id, (function_id) =>
                      setFormData({ ...formData, function_id })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@domaine.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+229 01 02 03 04"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Photo d'identité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo d'identité (format badge)
                  </label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={isCreating}
                  />

                  {!photoPreview ? (
                    <div
                      onClick={() => !isCreating && photoInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#36CC76] hover:bg-emerald-50/20 cursor-pointer transition-colors"
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Cliquez pour sélectionner une photo d'identité
                      </p>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG, JPG, GIF ou WebP (max 2 Mo)
                      </p>
                    </div>
                  ) : (
                    <div className="relative border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={photoPreview}
                          alt="Photo d'identité"
                          className="w-16 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {photoFile?.name || "Photo d'identité sélectionnée"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {photoFile ? `${(photoFile.size / 1024).toFixed(1)} Ko` : ""}
                          </p>
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="mt-1 text-xs text-[#36CC76] font-medium hover:underline block"
                          >
                            Changer la photo
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                          if (photoInputRef.current) photoInputRef.current.value = "";
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-white"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Activités autorisées */}
                {activities.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activités autorisées
                    </label>
                    <div className="border border-gray-200 rounded-xl p-4 max-h-56 overflow-y-auto space-y-3 bg-white">
                      {activities.map((act) => {
                        const actId = act.id || (act as any).activity_id;
                        const actName = act.name || (act as any).title;
                        const isChecked = formData.activity_ids.includes(actId);
                        return (
                          <div key={actId} className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={`act-single-${actId}`}
                              checked={isChecked}
                              onChange={() => handleToggleActivity(actId, "single")}
                              className="mt-1 w-4 h-4 text-[#36CC76] rounded border-gray-300 focus:ring-[#36CC76] cursor-pointer"
                            />
                            <label
                              htmlFor={`act-single-${actId}`}
                              className="cursor-pointer select-none flex-1"
                            >
                              <div className="text-sm font-medium text-gray-900">{actName}</div>
                              {act.description && (
                                <div className="text-xs text-gray-500 mt-0.5">{act.description}</div>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      if (photoInputRef.current) photoInputRef.current.value = "";
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2.5 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? "Création..." : "Créer l'accréditation"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fonction *
                  </label>
                  {renderFunctionSelect(batchFormData.function_id, (function_id) =>
                    setBatchFormData({ ...batchFormData, function_id })
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organisme
                    </label>
                    <input
                      type="text"
                      value={batchFormData.organization}
                      onChange={(e) =>
                        setBatchFormData({ ...batchFormData, organization: e.target.value })
                      }
                      placeholder="Ex: Société Securitas..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité de badges à générer *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={500}
                      value={batchFormData.quantity}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
                    />
                  </div>
                </div>

                {activities.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activités autorisées
                    </label>
                    <div className="border border-gray-200 rounded-xl p-4 max-h-56 overflow-y-auto space-y-3 bg-white">
                      {activities.map((act) => {
                        const actId = act.id || (act as any).activity_id;
                        const actName = act.name || (act as any).title;
                        const isChecked = batchFormData.activity_ids.includes(actId);
                        return (
                          <div key={actId} className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={`act-batch-${actId}`}
                              checked={isChecked}
                              onChange={() => handleToggleActivity(actId, "batch")}
                              className="mt-1 w-4 h-4 text-[#36CC76] rounded border-gray-300 focus:ring-[#36CC76] cursor-pointer"
                            />
                            <label
                              htmlFor={`act-batch-${actId}`}
                              className="cursor-pointer select-none flex-1"
                            >
                              <div className="text-sm font-medium text-gray-900">{actName}</div>
                              {act.description && (
                                <div className="text-xs text-gray-500 mt-0.5">{act.description}</div>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingBatch}
                    className="flex-1 px-4 py-2.5 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingBatch ? "Génération..." : `Générer ${batchFormData.quantity} badges`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL PRÉ-VALIDATION */}
      {showPreValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Invitation avec Validation</h2>
              <button
                onClick={() => {
                  setShowPreValidationModal(false);
                  setModalError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Alerte d'erreur dans la modale */}
            {modalError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalError(null)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 mb-4">
              <p className="font-semibold mb-1">Processus de validation</p>
              <p>
                Un email contenant un lien unique sera envoyé au destinataire pour lui permettre de
                confirmer sa présence et de téléverser sa photo. Le badge officiel sera généré après sa validation.
              </p>
            </div>

            <form onSubmit={handleCreatePreValidation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={preValidationFormData.last_name}
                    onChange={(e) =>
                      setPreValidationFormData({
                        ...preValidationFormData,
                        last_name: e.target.value,
                      })
                    }
                    placeholder="Ex: DUPONT"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A94E3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={preValidationFormData.first_name}
                    onChange={(e) =>
                      setPreValidationFormData({
                        ...preValidationFormData,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="Ex: Jean"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A94E3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisme
                  </label>
                  <input
                    type="text"
                    value={preValidationFormData.organization}
                    onChange={(e) =>
                      setPreValidationFormData({
                        ...preValidationFormData,
                        organization: e.target.value,
                      })
                    }
                    placeholder="Ex: Canal+, Le Monde..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A94E3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fonction *
                  </label>
                  {renderFunctionSelect(preValidationFormData.function_id, (function_id) =>
                    setPreValidationFormData({ ...preValidationFormData, function_id })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email du destinataire *
                  </label>
                  <input
                    type="email"
                    required
                    value={preValidationFormData.email}
                    onChange={(e) =>
                      setPreValidationFormData({
                        ...preValidationFormData,
                        email: e.target.value,
                      })
                    }
                    placeholder="destinataire@media.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A94E3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="text"
                    value={preValidationFormData.phone}
                    onChange={(e) =>
                      setPreValidationFormData({
                        ...preValidationFormData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+229 01 02 03 04"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A94E3] focus:outline-none"
                  />
                </div>
              </div>

              {activities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activités autorisées
                  </label>
                  <div className="border border-gray-200 rounded-xl p-4 max-h-56 overflow-y-auto space-y-3 bg-white">
                    {activities.map((act) => {
                      const actId = act.id || (act as any).activity_id;
                      const actName = act.name || (act as any).title;
                      const isChecked = preValidationFormData.activity_ids.includes(actId);
                      return (
                        <div key={actId} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id={`act-prev-${actId}`}
                            checked={isChecked}
                            onChange={() => handleToggleActivity(actId, "preValidation")}
                            className="mt-1 w-4 h-4 text-[#4A94E3] rounded border-gray-300 focus:ring-[#4A94E3] cursor-pointer"
                          />
                          <label
                            htmlFor={`act-prev-${actId}`}
                            className="cursor-pointer select-none flex-1"
                          >
                            <div className="text-sm font-medium text-gray-900">{actName}</div>
                            {act.description && (
                              <div className="text-xs text-gray-500 mt-0.5">{act.description}</div>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPreValidationModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPreValidation}
                  className="flex-1 px-4 py-2.5 bg-[#4A94E3] text-white rounded-lg hover:bg-[#3a7bcf] transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingPreValidation ? "Envoi..." : "Envoyer l'accréditation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS DE L'ACCRÉDITATION */}
      {detailsModal.isOpen && detailsModal.accreditation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Détails de l'accréditation</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Badge : <span className="font-mono font-bold text-gray-800">{detailsModal.accreditation.badge_number || "-"}</span>
                </p>
              </div>
              <button
                onClick={() => setDetailsModal({ isOpen: false, accreditation: null })}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-5">
              {/* Carte résumé : Photo + Titulaire + Statut */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {getPhotoSrc(detailsModal.accreditation.photo_url) ? (
                  <img
                    src={getPhotoSrc(detailsModal.accreditation.photo_url)!}
                    alt="Photo d'identité"
                    className="w-16 h-20 object-cover rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-400 flex-shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {detailsModal.accreditation.type !== "batch" && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                          detailsModal.accreditation.status
                        )}`}
                      >
                        {getStatusLabel(detailsModal.accreditation.status, detailsModal.accreditation.type)}
                      </span>
                    )}
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {detailsModal.accreditation.format === "non_nominative"
                        ? "Non Nominative"
                        : detailsModal.accreditation.type === "pre_validation"
                        ? "Avec validation"
                        : "Nominative directe"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {detailsModal.accreditation.format === "non_nominative"
                      ? detailsModal.accreditation.batch_title || "Lot anonyme"
                      : `${detailsModal.accreditation.first_name || ""} ${detailsModal.accreditation.last_name || ""}`.trim() || "-"}
                  </h3>
                  {(detailsModal.accreditation.role_title || detailsModal.accreditation.organization) && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {detailsModal.accreditation.role_title && <span className="font-medium">{detailsModal.accreditation.role_title}</span>}
                      {detailsModal.accreditation.role_title && detailsModal.accreditation.organization && " • "}
                      {detailsModal.accreditation.organization && <span>{detailsModal.accreditation.organization}</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Informations du titulaire */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block">Organisme</span>
                  <span className="font-medium text-gray-900">{detailsModal.accreditation.organization || "-"}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block">Fonction</span>
                  <span className="font-medium text-gray-900">{detailsModal.accreditation.role_title || "-"}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block">Email</span>
                  <span className="font-medium text-gray-900 truncate block">{detailsModal.accreditation.email || "-"}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block">Téléphone</span>
                  <span className="font-medium text-gray-900">{detailsModal.accreditation.phone || "-"}</span>
                </div>
                {detailsModal.accreditation.batch_title && (
                  <div className="col-span-2 bg-white p-3 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block">Groupe / Lot</span>
                    <span className="font-medium text-gray-900">{detailsModal.accreditation.batch_title}</span>
                  </div>
                )}
              </div>

              {/* Activités autorisées */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Activités autorisées
                </h4>
                {detailsModal.accreditation.activities && detailsModal.accreditation.activities.length > 0 ? (
                  <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50 max-h-48 overflow-y-auto">
                    {detailsModal.accreditation.activities.map((act) => {
                      const actId = act.id || (act as any).activity_id;
                      const actName = act.name || (act as any).title;
                      return (
                        <div key={actId} className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <p className="text-xs font-semibold text-gray-900">{actName}</p>
                          {act.description && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{act.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 italic">
                    Accès général — aucune restriction d'activité spécifique.
                  </div>
                )}
              </div>

              {/* Contrôle de présence */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Contrôle d'accès & Présence
                </h4>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-600">Statut de présence</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      Boolean(
                        (detailsModal.accreditation.is_used && detailsModal.accreditation.is_used > 0) ||
                        (detailsModal.accreditation.verifications && detailsModal.accreditation.verifications.length > 0)
                      )
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {Boolean(
                      (detailsModal.accreditation.is_used && detailsModal.accreditation.is_used > 0) ||
                      (detailsModal.accreditation.verifications && detailsModal.accreditation.verifications.length > 0)
                    )
                      ? "✓ Présent (scanné)"
                      : "Non scanné"}
                  </span>
                </div>
                {detailsModal.accreditation.verifications && detailsModal.accreditation.verifications.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {detailsModal.accreditation.verifications.map((v, i) => (
                      <div key={v.id || i} className="text-[11px] text-gray-500 bg-white p-2 rounded border border-gray-100 flex justify-between">
                        <span>Scan #{i + 1}</span>
                        <span>{new Date(v.date_verif).toLocaleString("fr-FR")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div>
                {canDownloadBadge(detailsModal.accreditation) && (
                  <button
                    onClick={() =>
                      handleDownloadBadge(
                        detailsModal.accreditation!.id,
                        detailsModal.accreditation!.badge_number
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#023C40] bg-[#EDF7F7] hover:bg-[#d6f0f0] rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger le badge (PDF)
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailsModal({ isOpen: false, accreditation: null })}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      <DeleteConfirmation
        isOpen={deleteConfirm.isOpen}
        isLoading={deleteConfirm.isLoading}
        onConfirm={() => {
          if (deleteConfirm.accreditation) {
            handleDelete(deleteConfirm.accreditation.id);
          }
        }}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, accreditation: null, isLoading: false })
        }
      />
    </div>
  );
}

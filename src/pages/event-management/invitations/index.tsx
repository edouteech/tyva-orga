import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import { invitationsAPI, ticketsAPI, importFailuresAPI } from "../../../api/api";
import type { Invitation, Ticket } from "../../../lib/types";
import { DataTable, DeleteConfirmation, PhoneCodeSelect } from "../../../components/global";
import type { Column, Action } from "../../../components/global";
import {
  Plus,
  Mail,
  Download,
  FolderArchive,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  X,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ResendInvitationModal } from "./ResendInvitationModal";

export default function Invitations() {
  const { eventId } = useParams<{ eventId: string }>();
  const { currentEvent } = useAppSelector((state) => state.event);
  const eventIdNum = currentEvent?.event_id || (eventId ? parseInt(eventId) : 0);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mainTab, setMainTab] = useState<"direct" | "validation">("direct");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreValidationModal, setShowPreValidationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"instant" | "batch" | "import">("instant");
  const [preValidationActiveTab, setPreValidationActiveTab] = useState<"single" | "import">("single");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingPreValidation, setIsCreatingPreValidation] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFailures, setImportFailures] = useState<{ data: any; error: string }[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number>(0);
  const [dbImportFailures, setDbImportFailures] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    invitation: Invitation | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    invitation: null,
    isLoading: false,
  });

  const [resendModal, setResendModal] = useState<{
    isOpen: boolean;
    invitation: Invitation | null;
  }>({
    isOpen: false,
    invitation: null,
  });

  // Form states
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    ticket_id: "",
  });

  const [batchFormData, setBatchFormData] = useState({
    quantity: 10,
    batch_designation: "",
    ticket_id: "",
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);

  const loadImportFailures = async () => {
    try {
      const data = await importFailuresAPI.getAll({ event_id: eventIdNum, status: "pending" });
      setDbImportFailures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors du chargement des échecs d'importation:", err);
    }
  };

  useEffect(() => {
    if (eventIdNum) {
      loadInvitations();
      loadTickets();
      loadImportFailures();
    }
  }, [eventIdNum]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const params: any = { event_id: eventIdNum };

      const data = await invitationsAPI.getAll(params);
      console.log("Invitations loaded:", data);
      setInvitations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error loading invitations:", err);
      setError("Erreur lors du chargement des invitations");
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      if (!eventIdNum) {
        console.error("eventIdNum is missing");
        return;
      }
      const data = await ticketsAPI.getByEventId(eventIdNum);
      console.log("Tickets loaded:", data);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors du chargement des tickets:", err);
      setTickets([]);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      
      const phoneInput = document.getElementById('phone') as HTMLInputElement;
      const phoneValue = formData.phone || phoneInput?.value || "";
      
      if (!formData.ticket_id) {
        setError("Veuillez sélectionner un ticket");
        return;
      }
      
      await invitationsAPI.createInstant({
        event_id: eventIdNum,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: phoneValue,
        ticket_id: parseInt(formData.ticket_id),
      });

      setShowCreateModal(false);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", ticket_id: "" });
      await loadInvitations();
    } catch (err) {
      setError("Erreur lors de la création de l'invitation");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePreValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingPreValidation(true);
      
      const phoneInput = document.getElementById('phone') as HTMLInputElement;
      const phoneValue = phoneInput?.value || "";
      
      if (!formData.ticket_id) {
        setError("Veuillez sélectionner un ticket");
        return;
      }
      
      await invitationsAPI.createPreValidation({
        event_id: eventIdNum,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || phoneValue,
        ticket_id: parseInt(formData.ticket_id),
      });

      setShowPreValidationModal(false);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", ticket_id: "" });
      await loadInvitations();
    } catch (err) {
      setError("Erreur lors de la création de l'invitation");
      console.error(err);
    } finally {
      setIsCreatingPreValidation(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingBatch(true);
      
      if (!batchFormData.ticket_id) {
        setError("Veuillez sélectionner un ticket");
        return;
      }
      
      await invitationsAPI.createBatch({
        event_id: eventIdNum,
        quantity: batchFormData.quantity,
        batch_designation: batchFormData.batch_designation,
        ticket_id: parseInt(batchFormData.ticket_id),
      });

      setShowCreateModal(false);
      setBatchFormData({ quantity: 10, batch_designation: "", ticket_id: "" });
      await loadInvitations();
    } catch (err) {
      setError("Erreur lors de la création des invitations en lot");
      console.error(err);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportErrors([]);
      parseExcelFile(file);
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Validate required columns
        const errors: string[] = [];
        const validData: any[] = [];

        jsonData.forEach((row: any, index: number) => {
          const rowNum = index + 2; // Excel row numbers start at 1, header is row 1
          
          // Normalize keys to lowercase to handle case variations
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase()] = row[key];
          });
          
          // Support both French and English column names (case-insensitive)
          const firstName = normalizedRow.first_name || normalizedRow.prenom || normalizedRow.prénom;
          const lastName = normalizedRow.last_name || normalizedRow.nom;
          const email = normalizedRow.email;
          const phone = normalizedRow.phone || normalizedRow.telephone || normalizedRow.téléphone;
          const ticketId = normalizedRow.ticket_id;

          if (!firstName || !lastName || !email) {
            errors.push(`Ligne ${rowNum}: Prénom, Nom et Email sont requis`);
          } else {
            validData.push({
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone: phone || "",
              ticket_id: ticketId || formData.ticket_id,
            });
          }
        });

        if (errors.length > 0) {
          setImportErrors(errors);
        }

        setImportedData(validData);
      } catch (err) {
        setImportErrors(["Erreur lors de la lecture du fichier Excel"]);
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportInstant = async () => {
    if (importedData.length === 0) {
      setImportErrors(["Aucune donnée à importer"]);
      return;
    }

    try {
      setIsImporting(true);
      setImportFailures([]);
      setImportSuccessCount(0);
      const ticketId = formData.ticket_id ? parseInt(formData.ticket_id) : undefined;
      const failuresToStore: any[] = [];

      for (const data of importedData) {
        const ticketIdToUse = data.ticket_id ? parseInt(data.ticket_id) : (ticketId || undefined);
        
        try {
          if (!ticketIdToUse) {
            throw new Error("Ticket ID requis mais non fourni");
          }
          
          await invitationsAPI.createInstant({
            event_id: eventIdNum,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            ticket_id: ticketIdToUse,
          });
          setImportSuccessCount(prev => prev + 1);
        } catch (err) {
          let errorMessage = "Erreur inconnue";
          
          if (err instanceof Error) {
            errorMessage = err.message;
          }
          
          // Extraire le message d'erreur depuis la réponse Axios
          if (err && typeof err === 'object' && 'response' in err) {
            const axiosError = err as any;
            
            if (axiosError.response?.data?.errors) {
              const errors = axiosError.response.data.errors;
              errorMessage = Object.values(errors).flat().join(', ');
            } else if (axiosError.response?.data?.message) {
              errorMessage = axiosError.response.data.message;
            } else if (axiosError.message) {
              errorMessage = axiosError.message;
            }
          }
          
          setImportFailures(prev => [...prev, { data, error: errorMessage }]);
          failuresToStore.push({
            event_id: eventIdNum,
            invitation_type: "instant",
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            ticket_id: ticketIdToUse,
            error_message: errorMessage,
          });
        }
      }

      setShowCreateModal(false);
      setImportFile(null);
      setImportedData([]);
      setImportErrors([]);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", ticket_id: "" });
      setActiveTab("instant");
      await loadInvitations();
      await loadImportFailures();

      // Stocker les échecs dans la base de données
      if (failuresToStore.length > 0) {
        try {
          await importFailuresAPI.createMultiple(failuresToStore);
          await loadImportFailures();
        } catch (err) {
          console.error("Erreur lors de l'enregistrement des échecs:", err);
        }
      }
    } catch (err) {
      setError("Erreur lors de l'import des invitations");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportPreValidation = async () => {
    if (importedData.length === 0) {
      setImportErrors(["Aucune donnée à importer"]);
      return;
    }

    try {
      setIsImporting(true);
      setImportFailures([]);
      setImportSuccessCount(0);
      const ticketId = formData.ticket_id ? parseInt(formData.ticket_id) : undefined;
      const failuresToStore: any[] = [];

      for (const data of importedData) {
        const ticketIdToUse = data.ticket_id ? parseInt(data.ticket_id) : (ticketId || undefined);
        
        try {
          if (!ticketIdToUse) {
            throw new Error("Ticket ID requis mais non fourni");
          }
          
          await invitationsAPI.createPreValidation({
            event_id: eventIdNum,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            ticket_id: ticketIdToUse,
          });
          setImportSuccessCount(prev => prev + 1);
        } catch (err) {
          let errorMessage = "Erreur inconnue";
          
          if (err instanceof Error) {
            errorMessage = err.message;
          }
          
          // Extraire le message d'erreur depuis la réponse Axios
          if (err && typeof err === 'object' && 'response' in err) {
            const axiosError = err as any;
            
            if (axiosError.response?.data?.errors) {
              const errors = axiosError.response.data.errors;
              errorMessage = Object.values(errors).flat().join(', ');
            } else if (axiosError.response?.data?.message) {
              errorMessage = axiosError.response.data.message;
            } else if (axiosError.message) {
              errorMessage = axiosError.message;
            }
          }
          
          setImportFailures(prev => [...prev, { data, error: errorMessage }]);
          failuresToStore.push({
            event_id: eventIdNum,
            invitation_type: "pre_validation",
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            ticket_id: ticketIdToUse,
            error_message: errorMessage,
          });
        }
      }

      // Stocker les échecs en base de données
      if (failuresToStore.length > 0) {
        await importFailuresAPI.createMultiple(failuresToStore);
      }

      await loadInvitations();
      await loadImportFailures();
    } catch (err) {
      setError("Erreur lors de l'import des invitations");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetryDbFailure = async (id: number) => {
    try {
      await importFailuresAPI.retry(id);
      await loadImportFailures();
      await loadInvitations();
    } catch (err) {
      setError("Erreur lors de la réessai");
      console.error(err);
    }
  };

  const handleDeleteDbFailure = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet échec ?")) return;
    
    try {
      await importFailuresAPI.delete(id);
      await loadImportFailures();
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        nom: "Doe",
        prenom: "John",
        email: "john.doe@example.com",
        telephone: "+229 01 00 00 00 00",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invitations");
    XLSX.writeFile(workbook, "modele_import_invitations.xlsx");
  };

  const handleDownloadTicket = async (id: number, ticketNumber: string) => {
    try {
      const blob = await invitationsAPI.downloadTicket(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ticketNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Erreur lors du téléchargement du ticket");
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleteConfirm({ ...deleteConfirm, isLoading: true });
      await invitationsAPI.delete(id);
      loadInvitations();
      setDeleteConfirm({ isOpen: false, invitation: null, isLoading: false });
    } catch (err) {
      setError("Erreur lors de la suppression de l'invitation");
      console.error(err);
      setDeleteConfirm({ ...deleteConfirm, isLoading: false });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-3 h-3" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      case "generated":
        return <FileText className="w-3 h-3" />;
      case "sent":
        return <Mail className="w-3 h-3" />;
      case "pending_confirmation":
        return <Clock className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "generated":
        return "bg-blue-100 text-blue-700";
      case "sent":
        return "bg-purple-100 text-purple-700";
      case "pending_confirmation":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-[#EDF7F7] text-[#023C40]";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "rejected":
        return "Rejeté";
      case "generated":
        return "Généré";
      case "sent":
        return "Confirmé";
      case "pending_confirmation":
        return "En attente";
      default:
        return status;
    }
  };

  const filteredInvitations = Array.isArray(invitations) ? invitations.filter((invitation) => {
    if (!invitation) return false;
    
    // Filter based on main tab
    if (mainTab === "direct") {
      // Show only instant and batch invitations
      if (invitation.type !== "instant" && invitation.type !== "batch") return false;
    } else if (mainTab === "validation") {
      // Show only pre_validation invitations
      if (invitation.type !== "pre_validation") return false;
    }
    
    // Apply status filter
    if (statusFilter === "present") {
      const isPresent = Boolean(
        (invitation.is_used && invitation.is_used > 0) ||
        (invitation.verifications && invitation.verifications.length > 0)
      );
      if (!isPresent) return false;
    } else if (statusFilter === "not_scanned") {
      const isPresent = Boolean(
        (invitation.is_used && invitation.is_used > 0) ||
        (invitation.verifications && invitation.verifications.length > 0)
      );
      if (isPresent) return false;
    } else if (statusFilter !== "all" && invitation.status !== statusFilter) {
      return false;
    }
    
    return true;
  }) : [];

  const columns: Column<Invitation>[] = [
    {
      key: "ticket_number",
      label: "N° Ticket",
      sortable: true,
      render: (_, invitation) => (
        <span className="font-mono font-bold text-sm">{invitation?.ticket_number || "-"}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (_, invitation) => {
        let typeLabel = "";
        let typeColor = "";
        switch (invitation?.type) {
          case "instant":
            typeLabel = "Invitation Directe";
            typeColor = "text-blue-600";
            break;
          case "batch":
            typeLabel = "Lot";
            typeColor = "text-green-600";
            break;
          case "pre_validation":
            typeLabel = "Invitation avec Validation";
            typeColor = "text-purple-600";
            break;
          default:
            typeLabel = invitation?.type || "-";
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
      label: "Nom",
      sortable: true,
      render: (_, invitation) => (
        <span className="text-sm">
          {invitation?.first_name || invitation?.last_name
            ? `${invitation?.first_name} ${invitation?.last_name}`
            : "-"}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (_, invitation) => (
        <span className="text-sm">{invitation?.email || "-"}</span>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      sortable: true,
      render: (_, invitation) => (
        <span className="text-sm">{invitation?.phone || "-"}</span>
      ),
    },
    {
      key: "batch_designation",
      label: "Lot",
      sortable: true,
      render: (_, invitation) => (
        <span className="text-sm">{invitation?.batch_designation || "-"}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (_, invitation) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(invitation?.status)}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              invitation?.status
            )}`}
          >
            {getStatusLabel(invitation?.status)}
          </span>
        </div>
      ),
    },
    {
      key: "is_used",
      label: "Présence",
      sortable: true,
      render: (_, invitation) => {
        const isPresent = Boolean(
          (invitation?.is_used && invitation.is_used > 0) ||
          (invitation?.verifications && invitation.verifications.length > 0)
        );
        const lastScan = invitation?.verifications?.[0]?.date_verif;
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
                {new Date(lastScan).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "pdf_url",
      label: "PDF",
      sortable: false,
      render: (_, invitation) => (
        <span className="text-sm">
          {invitation?.pdf_url ? (
            <span className="text-green-600 font-medium">✓ Généré</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </span>
      ),
    },
  ];

  const actions: Action<Invitation>[] = [
    {
      label: "Renvoyer l'invitation (Email / WhatsApp)",
      icon: RefreshCw,
      onClick: (invitation) => setResendModal({ isOpen: true, invitation }),
      show: (invitation) =>
        (invitation.status === "generated" ||
          invitation.status === "sent" ||
          invitation.status === "pending_confirmation") &&
        invitation.type !== "batch",
    },
    {
      label: "Télécharger ticket",
      icon: Download,
      onClick: (invitation) => handleDownloadTicket(invitation.id, invitation.ticket_number),
      show: (invitation) =>
        (invitation.status === "generated" || invitation.status === "sent") &&
        !!invitation.pdf_url,
    },
    {
      label: "Télécharger ZIP",
      icon: FolderArchive,
      onClick: (invitation) => {
        if (invitation.batch_designation) {
          handleDownloadBatch(invitation.batch_designation);
        }
      },
      show: (invitation) =>
        invitation.type === "batch" &&
        !!invitation.batch_designation &&
        (invitation.status === "generated" || invitation.status === "sent"),
    },
    {
      label: "Supprimer",
      icon: Trash2,
      onClick: (invitation) =>
        setDeleteConfirm({
          isOpen: true,
          invitation,
          isLoading: false,
        }),
      show: () => true,
    },
  ];

  const handleDownloadBatch = async (batchDesignation: string) => {
    try {
      const blob = await invitationsAPI.downloadBatch(batchDesignation, eventIdNum);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets_${batchDesignation}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Erreur lors du téléchargement du ZIP");
      console.error(err);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log("Rendering invitations page, invitations:", invitations, "loading:", loading);
  console.log("Filtered invitations:", filteredInvitations);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Invitations</h1>
          <p className="text-sm text-gray-600 mt-1">
            Créez et gérez les invitations pour cet événement
          </p>
        </div>
      </div>

      {/* Sélecteur de mode — onglets */}
      <div className="flex gap-4 mb-0">
        <button
          onClick={() => { setMainTab("direct"); setStatusFilter("all"); }}
          className={`px-6 py-4 font-semibold transition-all border-2 rounded-t-xl flex items-center justify-center gap-3 ${
            mainTab === "direct"
              ? "border-[#36CC76] bg-[#36CC76] text-white shadow-lg"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#36CC76]/50 hover:bg-[#f0fdf4]"
          }`}
        >
          <Plus className="w-5 h-5" />
          Invitation Directe
        </button>
        <button
          onClick={() => { setMainTab("validation"); setStatusFilter("all"); }}
          className={`px-6 py-4 font-semibold transition-all border-2 rounded-t-xl flex items-center justify-center gap-3 ${
            mainTab === "validation"
              ? "border-[#4A94E3] bg-[#4A94E3] text-white shadow-lg"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#4A94E3]/50 hover:bg-[#eff6ff]"
          }`}
        >
          <Mail className="w-5 h-5" />
          Invitation avec Validation
        </button>
      </div>

      {/* Barre d'action et filtre */}
      <div className="bg-white border border-gray-200 border-b-0 shadow-sm px-5 py-4 flex items-center justify-between gap-4 mt-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Filtrer par statut :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#36CC76] focus:border-transparent bg-gray-50"
          >
            <option value="all">Tous les statuts</option>
            <option value="present">Présents (scannés)</option>
            <option value="not_scanned">Non scannés</option>
            {mainTab === "direct" ? (
              <>
                <option value="generated">Généré</option>
                <option value="sent">Confirmé</option>
              </>
            ) : (
              <>
                <option value="pending_confirmation">En attente</option>
                <option value="rejected">Rejeté</option>
                <option value="sent">Confirmé</option>
              </>
            )}
          </select>
        </div>
        <div>
          {mainTab === "direct" ? (
            <button
              onClick={() => {
                setActiveTab("instant");
                loadTickets();
                setFormData({ first_name: "", last_name: "", email: "", phone: "", ticket_id: "" });
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition shadow-sm font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle invitation directe
            </button>
          ) : (
            <button
              onClick={() => {
                loadTickets();
                setFormData({ first_name: "", last_name: "", email: "", phone: "", ticket_id: "" });
                setShowPreValidationModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A94E3] text-white rounded-lg hover:bg-[#3a7bcf] transition shadow-sm font-medium text-sm"
            >
              <Mail className="w-4 h-4" />
              Nouvelle invitation avec validation
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0 mt-0">
        <DataTable
          columns={columns}
          data={filteredInvitations}
          actions={actions}
          loading={loading}
          emptyMessage="Aucune invitation trouvée"
        />
      </div>

      {/* Tableau des échecs d'importation */}
      {dbImportFailures.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Échecs d'importation ({dbImportFailures.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Ces invitations ont échoué lors de l'importation. Vous pouvez les réessayer individuellement.
            </p>
          </div>
          <DataTable
            columns={[
              {
                key: "first_name",
                label: "Nom",
                sortable: true,
                render: (_, failure) => (
                  <span className="text-sm font-medium">
                    {failure.first_name} {failure.last_name}
                  </span>
                ),
              },
              {
                key: "email",
                label: "Email",
                sortable: true,
                render: (_, failure) => (
                  <span className="text-sm">{failure.email}</span>
                ),
              },
              {
                key: "invitation_type",
                label: "Type",
                sortable: true,
                render: (_, failure) => (
                  <span className="text-sm">
                    {failure.invitation_type === "instant" ? "Invitation Directe" : "Invitation avec Validation"}
                  </span>
                ),
              },
              {
                key: "error_message",
                label: "Erreur",
                sortable: true,
                render: (_, failure) => (
                  <span className="text-sm text-red-600" title={failure.error_message}>
                    {failure.error_message.length > 50 
                      ? failure.error_message.substring(0, 50) + "..." 
                      : failure.error_message}
                  </span>
                ),
              },
              {
                key: "created_at",
                label: "Date",
                sortable: true,
                render: (_, failure) => (
                  <span className="text-sm">
                    {new Date(failure.created_at).toLocaleDateString('fr-FR')}
                  </span>
                ),
              },
            ]}
            data={dbImportFailures}
            actions={[
              {
                label: "Réessayer",
                icon: RefreshCw,
                onClick: (failure) => handleRetryDbFailure(failure.id),
              },
              {
                label: "Supprimer",
                icon: Trash2,
                onClick: (failure) => handleDeleteDbFailure(failure.id),
              },
            ]}
            loading={loading}
            emptyMessage="Aucun échec d'importation"
          />
        </div>
      )}

      <DeleteConfirmation
        isOpen={deleteConfirm.isOpen}
        isLoading={deleteConfirm.isLoading}
        onConfirm={() => {
          if (deleteConfirm.invitation) {
            handleDelete(deleteConfirm.invitation.id);
          }
        }}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, invitation: null, isLoading: false })
        }
      />

      {/* Modal création invitation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Invitation Directe</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("instant")}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === "instant"
                    ? "border-[#36CC76] text-[#36CC76]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Invitation Unique
              </button>
              <button
                onClick={() => setActiveTab("import")}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === "import"
                    ? "border-[#4A94E3] text-[#4A94E3]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Import Excel
              </button>
              <button
                onClick={() => setActiveTab("batch")}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === "batch"
                    ? "border-[#5F9EA0] text-[#5F9EA0]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Générer en Lot
              </button>
            </div>

            {/* Contenu selon l'onglet actif */}
            {activeTab === "instant" ? (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Le ticket est généré immédiatement et envoyé par email à l'invité.
                </p>
              </div>
            ) : activeTab === "batch" ? (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Les tickets sont créés en lot et compressés dans un fichier ZIP pour téléchargement.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Importez un fichier Excel pour créer plusieurs invitations. Le ticket sera généré et envoyé par email à chaque invité.
                </p>
              </div>
            )}

            {activeTab === "batch" ? (
              <form onSubmit={handleCreateBatch}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ticket *</label>
                    <select
                      required
                      value={batchFormData.ticket_id}
                      onChange={(e) => setBatchFormData({ ...batchFormData, ticket_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                    >
                      <option value="">Sélectionner un ticket</option>
                      {(Array.isArray(tickets) ? tickets : []).map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name} - {ticket.price} {ticket.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Désignation du lot</label>
                      <input
                        type="text"
                        required
                        value={batchFormData.batch_designation}
                        onChange={(e) => setBatchFormData({ ...batchFormData, batch_designation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                        placeholder="Ex: VIP-2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={batchFormData.quantity}
                        onChange={(e) => setBatchFormData({ ...batchFormData, quantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingBatch || !batchFormData.ticket_id}
                    className="flex-1 px-4 py-2 bg-[#5F9EA0] text-white rounded-lg hover:bg-[#4A8A8A] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingBatch ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Génération...
                      </>
                    ) : (
                      "Générer"
                    )}
                  </button>
                </div>
              </form>
            ) : activeTab === "import" ? (
              <div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ticket *</label>
                    <select
                      required
                      value={formData.ticket_id}
                      onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                    >
                      <option value="">Sélectionner un ticket</option>
                      {tickets.map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name} - {ticket.price} {ticket.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Fichier Excel *</label>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-sm text-[#4A94E3] hover:text-[#023C40] flex items-center gap-1 font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger le modèle
                      </button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#4A94E3] transition">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload"
                      />
                      <label
                        htmlFor="excel-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {importFile ? importFile.name : "Cliquez pour sélectionner un fichier Excel"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Format: .xlsx ou .xls
                        </span>
                      </label>
                    </div>
                  </div>
                  {importErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <ul className="list-disc list-inside text-sm">
                        {importErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importedData.length > 0 && importFailures.length === 0 && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">
                        {importedData.length} invitation(s) prête(s) à être importée(s)
                      </p>
                    </div>
                  )}
                  {importSuccessCount > 0 && importFailures.length === 0 && importedData.length === 0 && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">
                        {importSuccessCount} invitation(s) importée(s) avec succès
                      </p>
                    </div>
                  )}
                  {importFailures.length > 0 && (
                    <div className="mt-4">
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">
                          Import terminé : {importSuccessCount} succès, {importFailures.length} échec(s)
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Prénom</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Nom</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Email</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Téléphone</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Erreur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importFailures.map((failure, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.first_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.last_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.email}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.phone}</td>
                                <td className="px-4 py-2 text-sm text-red-600 border-b">{failure.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setImportFile(null);
                      setImportedData([]);
                      setImportErrors([]);
                      setImportFailures([]);
                      setImportSuccessCount(0);
                      setActiveTab("instant");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleImportInstant}
                    disabled={isImporting || importedData.length === 0 || !formData.ticket_id}
                      className="flex-1 px-4 py-2 bg-[#4A94E3] text-white rounded-lg hover:bg-[#023C40] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Import...
                        </>
                      ) : (
                        "Importer"
                      )}
                    </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ticket *</label>
                    <select
                      required
                      value={formData.ticket_id}
                      onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                    >
                      <option value="">Sélectionner un ticket</option>
                      {(Array.isArray(tickets) ? tickets : []).map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name} - {ticket.price} {ticket.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <PhoneCodeSelect
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !formData.ticket_id}
                    className="flex-1 px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Création...
                      </>
                    ) : (
                      "Créer"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Invitation avec Validation */}
      {showPreValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Invitation avec Validation</h2>
              <button
                onClick={() => setShowPreValidationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setPreValidationActiveTab("single")}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  preValidationActiveTab === "single"
                    ? "border-[#4A94E3] text-[#4A94E3]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Invitation Unique
              </button>
              <button
                onClick={() => setPreValidationActiveTab("import")}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  preValidationActiveTab === "import"
                    ? "border-[#4A94E3] text-[#4A94E3]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Import Excel
              </button>
            </div>

            {preValidationActiveTab === "single" ? (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Une demande de confirmation de présence est envoyée par email. Après validation de l'invité, le ticket sera généré et envoyé.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Importez un fichier Excel pour envoyer des demandes de confirmation en lot. Après validation de chaque invité, le ticket sera généré et envoyé.
                </p>
              </div>
            )}

            {preValidationActiveTab === "single" ? (
              <form onSubmit={handleCreatePreValidation}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ticket *</label>
                    <select
                      required
                      value={formData.ticket_id}
                      onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                    >
                      <option value="">Sélectionner un ticket</option>
                      {(Array.isArray(tickets) ? tickets : []).map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name} - {ticket.price} {ticket.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <PhoneCodeSelect
                      id="phone-prevalidation"
                      name="phone"
                      value={formData.phone}
                      onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPreValidationModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPreValidation || !formData.ticket_id}
                    className="flex-1 px-4 py-2 bg-[#4A94E3] text-white rounded-lg hover:bg-[#023C40] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingPreValidation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Création...
                      </>
                    ) : (
                      "Créer"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ticket *</label>
                    <select
                      required
                      value={formData.ticket_id}
                      onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:border-transparent"
                    >
                      <option value="">Sélectionner un ticket</option>
                      {tickets.map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name} - {ticket.price} {ticket.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Fichier Excel *</label>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-sm text-[#4A94E3] hover:text-[#023C40] flex items-center gap-1 font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger le modèle
                      </button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#4A94E3] transition">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload-prevalidation"
                      />
                      <label
                        htmlFor="excel-upload-prevalidation"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {importFile ? importFile.name : "Cliquez pour sélectionner un fichier Excel"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Format: .xlsx ou .xls
                        </span>
                      </label>
                    </div>
                  </div>
                  {importErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <ul className="list-disc list-inside text-sm">
                        {importErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importedData.length > 0 && importFailures.length === 0 && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">
                        {importedData.length} invitation(s) prête(s) à être importée(s)
                      </p>
                    </div>
                  )}
                  {importSuccessCount > 0 && importFailures.length === 0 && importedData.length === 0 && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">
                        {importSuccessCount} invitation(s) importée(s) avec succès
                      </p>
                    </div>
                  )}
                  {importFailures.length > 0 && (
                    <div className="mt-4">
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">
                          Import terminé : {importSuccessCount} succès, {importFailures.length} échec(s)
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Prénom</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Nom</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Email</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Téléphone</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Erreur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importFailures.map((failure, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.first_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.last_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.email}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{failure.data.phone}</td>
                                <td className="px-4 py-2 text-sm text-red-600 border-b">{failure.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreValidationModal(false);
                      setImportFile(null);
                      setImportedData([]);
                      setImportErrors([]);
                      setImportFailures([]);
                      setImportSuccessCount(0);
                      setPreValidationActiveTab("single");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleImportPreValidation}
                    disabled={isImporting || importedData.length === 0 || !formData.ticket_id}
                    className="flex-1 px-4 py-2 bg-[#4A94E3] text-white rounded-lg hover:bg-[#023C40] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Import...
                      </>
                    ) : (
                      "Importer"
                    )}
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale de renvoi de notifications */}
      {resendModal.isOpen && resendModal.invitation && (
        <ResendInvitationModal
          isOpen={resendModal.isOpen}
          onClose={() => setResendModal({ isOpen: false, invitation: null })}
          invitation={resendModal.invitation}
        />
      )}
    </div>
  );
}

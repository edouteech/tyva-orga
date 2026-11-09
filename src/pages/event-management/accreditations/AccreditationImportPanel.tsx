import { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import { accreditationImportFailuresAPI, accreditationsAPI } from "../../../api/api";
import type {
  AccreditationFunction,
  Activity,
  NewAccreditationImportFailure,
} from "../../../lib/types";

interface AccreditationImportPanelProps {
  eventId: number;
  type: "direct" | "pre_validation";
  functions: AccreditationFunction[];
  activities: Activity[];
  preparePhoto: (file: File) => Promise<{ file: File }>;
  onManageFunctions: () => void;
  onFinished: () => Promise<void>;
}

interface ImportRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  photo: string;
}

interface ImportResult {
  success: number;
  emailsNotSent: number;
  failures: { name: string; error: string }[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Les majuscules, les accents et l'extension ne comptent pas pour relier une photo à sa ligne
const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const photoKey = (fileName: string) => normalize(fileName).replace(/\.[^/.]+$/, "");

const activityIdOf = (activity: Activity) => activity.id || (activity as any).activity_id;

const getErrorMessage = (err: any) => {
  const details = Object.values(err?.response?.data?.errors ?? {}).flat().filter(Boolean);
  return details.length > 0
    ? details.join(" ")
    : err?.response?.data?.message || err?.message || "Erreur inconnue";
};

export default function AccreditationImportPanel({
  eventId,
  type,
  functions,
  activities,
  preparePhoto,
  onManageFunctions,
  onFinished,
}: AccreditationImportPanelProps) {
  const isDirect = type === "direct";
  const [functionId, setFunctionId] = useState("");
  const [activityIds, setActivityIds] = useState<number[]>(activities.map(activityIdOf));
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Map<string, File>>(new Map());
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const isImporting = progress !== null;
  const missingPhotos = isDirect
    ? rows.filter((row) => row.photo && !photos.has(photoKey(row.photo))).map((row) => row.photo)
    : [];

  const handleDownloadTemplate = () => {
    const example = {
      nom: "Dossou",
      prenom: "Luc",
      email: "luc.dossou@example.com",
      telephone: "+229 01 00 00 00 00",
      organisme: "Ma société",
      ...(isDirect ? { photo: "luc-dossou.jpg" } : {}),
    };
    const worksheet = XLSX.utils.json_to_sheet([example]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accréditations");
    XLSX.writeFile(workbook, "modele_import_accreditations.xlsx");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileName(file.name);
    setRows([]);
    setFileErrors([]);
    setResult(null);

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const lines = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const errors: string[] = [];
      const validRows: ImportRow[] = [];

      lines.forEach((line, index) => {
        const cells: Record<string, string> = {};
        Object.entries(line).forEach(([key, value]) => {
          cells[normalize(key)] = String(value ?? "").trim();
        });

        const row: ImportRow = {
          first_name: cells.prenom || cells.first_name || "",
          last_name: cells.nom || cells.last_name || "",
          email: cells.email || cells["e-mail"] || "",
          phone: cells.telephone || cells.phone || "",
          organization: cells.organisme || cells.organization || cells.societe || "",
          photo: cells.photo || "",
        };

        // La ligne 1 du fichier contient les titres de colonnes
        const lineNumber = index + 2;
        if (!row.first_name || !row.last_name) {
          errors.push(`Ligne ${lineNumber} : le prénom et le nom sont obligatoires`);
        } else if (!isDirect && !row.email) {
          errors.push(`Ligne ${lineNumber} : l'e-mail est obligatoire pour une validation`);
        } else if (row.email && !EMAIL_PATTERN.test(row.email)) {
          errors.push(`Ligne ${lineNumber} : l'e-mail « ${row.email} » n'est pas valide`);
        } else {
          validRows.push(row);
        }
      });

      if (lines.length === 0) {
        errors.push("Le fichier ne contient aucune ligne à importer");
      }

      setFileErrors(errors);
      setRows(validRows);
    } catch (err) {
      console.error(err);
      setFileErrors(["Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un fichier Excel."]);
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = new Map<string, File>();
    Array.from(e.target.files ?? []).forEach((file) => selected.set(photoKey(file.name), file));
    e.target.value = "";
    setPhotos(selected);
  };

  const createAccreditation = async (row: ImportRow) => {
    if (!isDirect) {
      return accreditationsAPI.createPreValidation({
        event_id: eventId,
        function_id: Number(functionId),
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone || undefined,
        organization: row.organization || undefined,
        activity_ids: activityIds,
      });
    }

    const data = new FormData();
    data.append("event_id", String(eventId));
    data.append("function_id", functionId);
    data.append("first_name", row.first_name);
    data.append("last_name", row.last_name);
    if (row.email) data.append("email", row.email);
    if (row.phone) data.append("phone", row.phone);
    if (row.organization) data.append("organization", row.organization);
    activityIds.forEach((id) => data.append("activity_ids[]", String(id)));

    const photo = row.photo ? photos.get(photoKey(row.photo)) : undefined;
    if (photo) data.append("photo", (await preparePhoto(photo)).file);

    return accreditationsAPI.createDirect(data);
  };

  const handleImport = async () => {
    let success = 0;
    let emailsNotSent = 0;
    const failures: ImportResult["failures"] = [];
    const failuresToStore: NewAccreditationImportFailure[] = [];

    setResult(null);
    setProgress(0);

    for (const [index, row] of rows.entries()) {
      try {
        const created = await createAccreditation(row);
        success += 1;
        if (created.email_sent === false) emailsNotSent += 1;
      } catch (err) {
        console.error(err);
        const error = getErrorMessage(err);
        failures.push({ name: `${row.first_name} ${row.last_name}`, error });
        failuresToStore.push({
          type,
          function_id: Number(functionId),
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email || null,
          phone: row.phone || null,
          organization: row.organization || null,
          activity_ids: activityIds,
          error_message: error,
        });
      }
      setProgress(index + 1);
    }

    if (failuresToStore.length > 0) {
      try {
        await accreditationImportFailuresAPI.createMultiple(eventId, failuresToStore);
      } catch (err) {
        console.error("Erreur lors de l'enregistrement des échecs:", err);
      }
    }

    setResult({ success, emailsNotSent, failures });
    setRows([]);
    setFileName(null);
    setPhotos(new Map());
    setProgress(null);
    await onFinished();
  };

  const canImport = rows.length > 0 && functionId !== "" && activityIds.length > 0 && !isImporting;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fonction de tout le fichier *</label>
        <select
          value={functionId}
          onChange={(e) => setFunctionId(e.target.value)}
          disabled={isImporting}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none bg-white"
        >
          <option value="">Choisir une fonction...</option>
          {functions.map((fn) => (
            <option key={fn.id} value={fn.id}>
              {fn.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={onManageFunctions} className="mt-1 text-xs font-medium text-[#023C40] hover:underline">
          {functions.length === 0 ? "Aucune fonction : en créer une" : "Gérer les fonctions"}
        </button>
      </div>

      {activities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Activités autorisées *</label>
          <div className="border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto space-y-2 bg-white">
            {activities.map((activity) => {
              const id = activityIdOf(activity);
              return (
                <label key={id} className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activityIds.includes(id)}
                    disabled={isImporting}
                    onChange={() =>
                      setActivityIds((current) =>
                        current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
                      )
                    }
                    className="w-4 h-4"
                  />
                  {activity.name}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Fichier Excel *</label>
          <button type="button" onClick={handleDownloadTemplate} className="text-xs font-semibold text-[#023C40] hover:underline">
            Télécharger le modèle
          </button>
        </div>
        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-5 cursor-pointer hover:border-[#36CC76] transition">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={isImporting} className="hidden" />
          <FileSpreadsheet className="w-9 h-9 text-gray-400" />
          <span className="text-sm text-gray-600">{fileName ?? "Cliquez pour sélectionner un fichier Excel"}</span>
          <span className="text-xs text-gray-400">
            Colonnes : nom, prenom, email, telephone, organisme{isDirect ? ", photo" : ""}
          </span>
        </label>
      </div>

      {isDirect && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos (facultatif)</label>
          <label className="flex items-center gap-3 border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-[#36CC76] transition">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotosChange}
              disabled={isImporting}
              className="hidden"
            />
            <ImageIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {photos.size > 0 ? `${photos.size} photo(s) sélectionnée(s)` : "Sélectionner toutes les photos"}
            </span>
          </label>
          <p className="mt-1 text-[11px] text-gray-500">
            Dans la colonne « photo », indiquez le nom du fichier de chaque personne, par exemple luc-dossou.jpg.
          </p>
        </div>
      )}

      {fileErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs max-h-32 overflow-y-auto">
          <p className="font-semibold mb-1">Ces lignes seront ignorées :</p>
          {fileErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      {rows.length > 0 && !isImporting && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
          {rows.length} accréditation(s) prête(s) à être importée(s)
        </div>
      )}

      {missingPhotos.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 rounded-lg text-xs">
          <p className="font-semibold mb-1">{missingPhotos.length} photo(s) introuvable(s) : ces badges seront créés sans photo.</p>
          <p className="break-words">{missingPhotos.join(", ")}</p>
        </div>
      )}

      {isImporting && (
        <div className="bg-[#EDF7F7] border border-[#023C40]/20 text-[#023C40] px-3 py-2 rounded-lg text-sm">
          Import en cours : {progress} / {rows.length}. Gardez cette page ouverte.
        </div>
      )}

      {result && (
        <div className="border border-gray-200 rounded-lg p-3 text-sm space-y-1">
          <p className="font-semibold text-gray-900">
            Import terminé : {result.success} réussie(s), {result.failures.length} en échec
          </p>
          {result.emailsNotSent > 0 && (
            <p className="text-amber-700">
              {result.emailsNotSent} e-mail(s) n'ont pas pu partir. Utilisez l'action « Renvoyer l'e-mail ».
            </p>
          )}
          {result.failures.map((failure) => (
            <p key={`${failure.name}-${failure.error}`} className="text-xs text-red-600">
              {failure.name} : {failure.error}
            </p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleImport}
        disabled={!canImport}
        className="w-full px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isImporting ? "Import en cours..." : `Importer ${rows.length || ""} accréditation(s)`}
      </button>
    </div>
  );
}

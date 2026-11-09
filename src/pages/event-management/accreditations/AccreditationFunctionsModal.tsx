import { useEffect, useState } from "react";
import { Image as ImageIcon, Pencil, Trash2, X } from "lucide-react";
import { accreditationFunctionsAPI } from "../../../api/api";
import type { AccreditationFunction } from "../../../lib/types";

interface AccreditationFunctionsModalProps {
  eventId: number;
  functions: AccreditationFunction[];
  onChanged: () => Promise<void>;
  onClose: () => void;
}

const EMPTY_FORM = {
  id: null as number | null,
  name: "",
  textColor: "auto" as AccreditationFunction["text_color"],
  templateFile: null as File | null,
  templatePreview: null as string | null,
  removeTemplate: false,
};

const colorLabel = (fn: AccreditationFunction) => {
  if (!fn.template_url) return "Fond blanc";
  const color = fn.resolved_text_color === "white" ? "Texte blanc" : "Texte noir";
  return fn.text_color === "auto" ? `${color} (auto)` : color;
};

const getErrorMessage = (err: any, fallback: string) => {
  const details = Object.values(err?.response?.data?.errors ?? {}).flat().filter(Boolean);
  return details.length > 0 ? details.join(". ") : err?.response?.data?.message || fallback;
};

export default function AccreditationFunctionsModal({
  eventId,
  functions,
  onChanged,
  onClose,
}: AccreditationFunctionsModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // L'aperçu local est libéré dès qu'il est remplacé
  useEffect(() => {
    const preview = form.templateFile ? form.templatePreview : null;
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [form.templateFile, form.templatePreview]);

  const startEdit = (fn: AccreditationFunction) => {
    setError(null);
    setForm({
      ...EMPTY_FORM,
      id: fn.id,
      name: fn.name,
      textColor: fn.text_color,
      templatePreview: fn.template_url,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const data = new FormData();
      data.append("name", form.name);
      data.append("text_color", form.textColor);
      if (form.templateFile) data.append("template", form.templateFile);

      if (form.id) {
        if (form.removeTemplate) data.append("remove_template", "1");
        await accreditationFunctionsAPI.update(form.id, data);
      } else {
        data.append("event_id", String(eventId));
        await accreditationFunctionsAPI.create(data);
      }

      setForm(EMPTY_FORM);
      await onChanged();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Impossible d'enregistrer la fonction"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fn: AccreditationFunction) => {
    if (!window.confirm(`Supprimer la fonction « ${fn.name} » ?`)) return;
    try {
      setError(null);
      await accreditationFunctionsAPI.delete(fn.id);
      if (form.id === fn.id) setForm(EMPTY_FORM);
      await onChanged();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Impossible de supprimer la fonction"));
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fonctions et templates</h2>
            <p className="text-xs text-gray-500">Chaque fonction détermine le modèle de ses badges.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {form.id ? "Modifier la fonction" : "Nouvelle fonction"}
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la fonction *</label>
              <input
                type="text"
                required
                maxLength={255}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Staff, Presse, Sécurité..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template du badge</label>
              {form.templatePreview && (
                <div className="relative w-28 mb-2">
                  <img src={form.templatePreview} alt="Aperçu du template" className="w-28 rounded border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, templateFile: null, templatePreview: null, removeTemplate: true })}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5"
                    aria-label="Retirer le template"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setForm({
                      ...form,
                      templateFile: file,
                      templatePreview: URL.createObjectURL(file),
                      removeTemplate: false,
                    });
                  }
                  e.target.value = "";
                }}
                className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EDF7F7] file:text-[#023C40]"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Image portrait JPG ou PNG, 5 Mo maximum, idéalement 1240 × 1654 px. Les 10 % du bas restent libres pour
                vos logos. Sans template, le badge a un fond blanc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du texte et du QR code</label>
              <select
                value={form.textColor}
                onChange={(e) => setForm({ ...form, textColor: e.target.value as AccreditationFunction["text_color"] })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#36CC76] focus:outline-none bg-white"
              >
                <option value="auto">Automatique (selon le template)</option>
                <option value="white">Blanc</option>
                <option value="black">Noir</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#36CC76] text-white rounded-lg hover:bg-[#2BA85F] transition text-sm font-medium disabled:bg-gray-400"
              >
                {saving ? "Enregistrement..." : form.id ? "Enregistrer" : "Créer la fonction"}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={() => setForm(EMPTY_FORM)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Fonctions de l'événement</h3>
            {functions.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune fonction pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {functions.map((fn) => (
                  <li key={fn.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                    {fn.template_url ? (
                      <img src={fn.template_url} alt="" className="w-9 h-12 object-cover rounded border border-gray-200" />
                    ) : (
                      <div className="w-9 h-12 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{fn.name}</p>
                      <p className="text-xs text-gray-500">
                        {colorLabel(fn)} · {fn.accreditations_count ?? 0} badge(s)
                      </p>
                    </div>
                    <button onClick={() => startEdit(fn)} className="p-1 text-gray-500 hover:text-[#023C40]" aria-label={`Modifier ${fn.name}`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!fn.accreditations_count && (
                      <button onClick={() => handleDelete(fn)} className="p-1 text-gray-500 hover:text-red-600" aria-label={`Supprimer ${fn.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  X,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { invitationsAPI } from "../../../api/api";
import type { Invitation } from "../../../lib/types";

interface ResendInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation;
}

type Channel = "mail" | "whatsapp";

interface ChannelResult {
  sent: boolean;
  to: string;
  error?: string;
}

interface SendResults {
  invitation_number: string;
  results: {
    mail?: ChannelResult;
    whatsapp?: ChannelResult;
  };
}

export const ResendInvitationModal: React.FC<ResendInvitationModalProps> = ({
  isOpen,
  onClose,
  invitation,
}) => {
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([
    "mail",
    "whatsapp",
  ]);
  const [overrideEmail, setOverrideEmail] = useState("");
  const [overridePhone, setOverridePhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendResults, setSendResults] = useState<SendResults | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSend = async () => {
    if (selectedChannels.length === 0) return;

    setLoading(true);
    setGlobalError(null);
    setSendResults(null);

    try {
      const payload: {
        channels: Channel[];
        email?: string;
        phone?: string;
      } = {
        channels: selectedChannels,
      };

      if (overrideEmail.trim()) payload.email = overrideEmail.trim();
      if (overridePhone.trim()) payload.phone = overridePhone.trim();

      const response = await invitationsAPI.resendNotifications(invitation.id, payload);
      setSendResults(response.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors du renvoi.";
      setGlobalError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedChannels(["mail", "whatsapp"]);
    setOverrideEmail("");
    setOverridePhone("");
    setSendResults(null);
    setGlobalError(null);
    onClose();
  };

  if (!isOpen) return null;

  const guestName =
    [invitation.first_name, invitation.last_name].filter(Boolean).join(" ") ||
    "Invité";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Renvoyer l'invitation
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {guestName} • #{invitation.ticket_number}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Résultats d'envoi */}
          {sendResults ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Résultats de l'envoi
              </p>

              {sendResults.results.mail && (
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    sendResults.results.mail.sent
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {sendResults.results.mail.sent ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        sendResults.results.mail.sent
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      Email {sendResults.results.mail.sent ? "envoyé" : "non envoyé"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sendResults.results.mail.to}
                    </p>
                    {sendResults.results.mail.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {sendResults.results.mail.error}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {sendResults.results.whatsapp && (
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    sendResults.results.whatsapp.sent
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {sendResults.results.whatsapp.sent ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        sendResults.results.whatsapp.sent
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      WhatsApp{" "}
                      {sendResults.results.whatsapp.sent ? "envoyé" : "non envoyé"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sendResults.results.whatsapp.to}
                    </p>
                    {sendResults.results.whatsapp.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {sendResults.results.whatsapp.error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Choix des canaux */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Canaux d'envoi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option Email */}
                  <button
                    type="button"
                    onClick={() => toggleChannel("mail")}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedChannels.includes("mail")
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        selectedChannels.includes("mail")
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedChannels.includes("mail") && (
                        <span className="text-xs leading-none">✓</span>
                      )}
                    </div>
                    <Mail className={`w-4 h-4 shrink-0 ${selectedChannels.includes("mail") ? "text-green-600" : ""}`} />
                    <span className="text-sm font-medium">Email</span>
                  </button>

                  {/* Option WhatsApp */}
                  <button
                    type="button"
                    onClick={() => toggleChannel("whatsapp")}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedChannels.includes("whatsapp")
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        selectedChannels.includes("whatsapp")
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedChannels.includes("whatsapp") && (
                        <span className="text-xs leading-none">✓</span>
                      )}
                    </div>
                    <MessageSquare className="w-4 h-4 shrink-0 text-green-600" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Numéro ou Email de substitution */}
              <div className="space-y-3 pt-1">
                {selectedChannels.includes("mail") && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Email du destinataire{" "}
                      <span className="text-gray-400 font-normal">
                        (par défaut : {invitation.email || "aucun"})
                      </span>
                    </label>
                    <input
                      type="email"
                      value={overrideEmail}
                      onChange={(e) => setOverrideEmail(e.target.value)}
                      placeholder={invitation.email || "ex: contact@example.com"}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                )}

                {selectedChannels.includes("whatsapp") && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Numéro WhatsApp{" "}
                      <span className="text-gray-400 font-normal">
                        (par défaut : {invitation.phone || "aucun"})
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={overridePhone}
                      onChange={(e) => setOverridePhone(e.target.value)}
                      placeholder={invitation.phone || "ex: +229 97 00 00 00"}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                )}
              </div>

              {globalError && (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  {globalError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          {sendResults ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={loading || selectedChannels.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#1F4E79] hover:bg-[#163857] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

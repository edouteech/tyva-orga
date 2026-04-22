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
import { ordersAPI } from "../../../api";
import type { Order } from "../../../lib/types";

interface ResendNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

type Channel = "mail" | "whatsapp";

interface ChannelResult {
  sent: boolean;
  to: string;
  error?: string;
}

interface SendResults {
  order_number: string;
  results: {
    mail?: ChannelResult;
    whatsapp?: ChannelResult;
  };
}

const ResendNotificationsModal: React.FC<ResendNotificationsModalProps> = ({
  isOpen,
  onClose,
  order,
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
        order_id: number;
        channels: Channel[];
        email?: string;
        phone?: string;
      } = {
        order_id: order.id,
        channels: selectedChannels,
      };

      if (overrideEmail.trim()) payload.email = overrideEmail.trim();
      if (overridePhone.trim()) payload.phone = overridePhone.trim();

      const response = await ordersAPI.resendNotifications(payload);
      setSendResults(response.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'envoi.";
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Renvoyer les notifications
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Commande #{order.number}
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
                      Email{" "}
                      {sendResults.results.mail.sent ? "envoyé" : "non envoyé"}
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
                      {sendResults.results.whatsapp.sent
                        ? "envoyé"
                        : "non envoyé"}
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
              {/* Erreur globale */}
              {globalError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{globalError}</p>
                </div>
              )}

              {/* Canaux */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Canaux d'envoi
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => toggleChannel("mail")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedChannels.includes("mail")
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                        selectedChannels.includes("mail")
                          ? "bg-blue-100"
                          : "bg-gray-200"
                      }`}
                    >
                      <Mail
                        className={`w-5 h-5 ${
                          selectedChannels.includes("mail")
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-sm font-medium ${
                          selectedChannels.includes("mail")
                            ? "text-blue-700"
                            : "text-gray-600"
                        }`}
                      >
                        Email
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[90px]">
                        {order.client.email}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel("whatsapp")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedChannels.includes("whatsapp")
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                        selectedChannels.includes("whatsapp")
                          ? "bg-green-100"
                          : "bg-gray-200"
                      }`}
                    >
                      <MessageSquare
                        className={`w-5 h-5 ${
                          selectedChannels.includes("whatsapp")
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-sm font-medium ${
                          selectedChannels.includes("whatsapp")
                            ? "text-green-700"
                            : "text-gray-600"
                        }`}
                      >
                        WhatsApp
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[90px]">
                        {order.client.phone}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contacts de substitution */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Contacts de substitution{" "}
                  <span className="text-gray-400 font-normal">
                    (optionnel)
                  </span>
                </p>

                {selectedChannels.includes("mail") && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Adresse email alternative
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={overrideEmail}
                        onChange={(e) => setOverrideEmail(e.target.value)}
                        placeholder={order.client.email}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                )}

                {selectedChannels.includes("whatsapp") && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Numéro WhatsApp alternatif
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={overridePhone}
                        onChange={(e) => setOverridePhone(e.target.value)}
                        placeholder={order.client.phone}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {sendResults ? "Fermer" : "Annuler"}
          </button>
          {!sendResults && (
            <button
              onClick={handleSend}
              disabled={loading || selectedChannels.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Envoi en cours..." : "Envoyer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResendNotificationsModal;

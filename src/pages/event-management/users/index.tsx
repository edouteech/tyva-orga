import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "../../../components/global";
import type { Column } from "../../../components/global";
import { usersAPI } from "../../../api";
import { formatBackendDate } from "../../../lib";
import type { UserWithRoles } from "../../../lib";
import { Shield, ShieldAlert, ShieldCheck, Clock, CheckCircle, XCircle } from "lucide-react";

const EventUsersIndex: React.FC = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement des utilisateurs",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns = useMemo<Column<UserWithRoles>[]>(() => {
    return [
      {
        key: "first_name",
        label: "Nom complet",
        sortable: true,
        render: (_, u) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-[#36CC76]">
                {u.first_name?.charAt(0)}
                {u.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {u.first_name} {u.last_name}
              </div>
              <div className="text-sm text-gray-500">{u.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "phone_number",
        label: "Téléphone",
        sortable: true,
        render: (phone) =>
          phone || <span className="text-gray-400">Non renseigné</span>,
      },
      {
        key: "is_verified",
        label: "Statut",
        sortable: true,
        render: (isVerified) => (
          <div className="flex items-center gap-2">
            {isVerified ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  Vérifié
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                  Non vérifié
                </span>
              </>
            )}
          </div>
        ),
      },
      {
        key: "roles",
        label: "Rôles",
        render: (roles: UserWithRoles["roles"]) => (
          <div className="flex flex-wrap gap-1">
            {roles && roles.length > 0 ? (
              roles.map((role, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    role.name === "super_admin"
                      ? "bg-red-100 text-red-700"
                      : role.name === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {role.name === "super_admin" && (
                    <ShieldAlert className="w-3 h-3" />
                  )}
                  {role.name === "admin" && <ShieldCheck className="w-3 h-3" />}
                  {role.name !== "super_admin" && role.name !== "admin" && (
                    <Shield className="w-3 h-3" />
                  )}
                  {role.name.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Aucun rôle</span>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        label: "Créé le",
        sortable: true,
        render: (date) => (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {formatBackendDate(date, "fr-FR")}
          </div>
        ),
      },
    ];
  }, []);

  return (
    <div className="space-y-6 -mx-8 px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Utilisateurs
          </h1>
          <p className="text-gray-600">
            Liste des comptes utilisateurs (lecture seule)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          searchable={true}
          searchPlaceholder="Rechercher un utilisateur..."
          emptyMessage="Aucun utilisateur trouvé"
          pagination={true}
          itemsPerPage={10}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 25, 50, 100]}
          exportable={true}
          exportFilename="utilisateurs"
        />
      </div>
    </div>
  );
};

export default EventUsersIndex;


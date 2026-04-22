import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  FileText,
  File,
} from "lucide-react";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  convertDataTableColumns,
  generateFilename,
} from "../../utils/exportUtils";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface Action<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (item: T) => void;
  variant?: "default" | "danger" | "primary" | "success";
  show?: (item: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  customFilters?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  description?: string;
  pagination?: boolean;
  itemsPerPage?: number;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  exportable?: boolean;
  exportFilename?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  searchable = true,
  searchPlaceholder = "Rechercher...",
  filterable = false,
  customFilters,
  loading = false,
  emptyMessage = "Aucun élément trouvé",
  title,
  description,
  pagination = true,
  itemsPerPage = 10,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 25, 50, 100],
  exportable = true,
  exportFilename = "export",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Fonction pour obtenir la valeur d'une propriété imbriquée
  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Filtrage et tri des données
  const filteredAndSortedData = React.useMemo(() => {
    let result = [...data];

    // Filtrage par recherche
    if (searchTerm) {
      result = result.filter((item) =>
        columns.some((column) => {
          const value = getNestedValue(item, column.key as string);
          return value
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        })
      );
    }

    // Tri
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortColumn);
        const bValue = getNestedValue(b, sortColumn);

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, columns]);

  // Calculs de pagination
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = pagination
    ? filteredAndSortedData.slice(startIndex, endIndex)
    : filteredAndSortedData;

  // Reset de la page courante quand les données changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Reset de la page si elle dépasse le nombre total de pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  // Fonctions de pagination
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Fonctions d'exportation
  const handleExportExcel = () => {
    const exportColumns = convertDataTableColumns(columns);
    const filename = generateFilename(exportFilename);
    exportToExcel({
      filename,
      title: title || "Export des données",
      columns: exportColumns,
      data: filteredAndSortedData,
    });
  };

  const handleExportCSV = () => {
    const exportColumns = convertDataTableColumns(columns);
    const filename = generateFilename(exportFilename);
    exportToCSV({
      filename,
      title: title || "Export des données",
      columns: exportColumns,
      data: filteredAndSortedData,
    });
  };

  const handleExportPDF = () => {
    const exportColumns = convertDataTableColumns(columns);
    const filename = generateFilename(exportFilename);

    // Générer un titre plus spécifique selon le contexte
    let pdfTitle = title || "Export des données";

    // Si pas de titre spécifique, essayer de deviner le type de données
    if (!title) {
      if (
        exportFilename.toLowerCase().includes("event") ||
        exportFilename.toLowerCase().includes("evenement")
      ) {
        pdfTitle = "Liste des événements";
      } else if (
        exportFilename.toLowerCase().includes("user") ||
        exportFilename.toLowerCase().includes("utilisateur")
      ) {
        pdfTitle = "Liste des utilisateurs";
      } else if (
        exportFilename.toLowerCase().includes("order") ||
        exportFilename.toLowerCase().includes("commande")
      ) {
        pdfTitle = "Liste des commandes";
      } else if (
        exportFilename.toLowerCase().includes("product") ||
        exportFilename.toLowerCase().includes("produit")
      ) {
        pdfTitle = "Liste des produits";
      } else if (exportFilename.toLowerCase().includes("ticket")) {
        pdfTitle = "Liste des tickets";
      } else if (
        exportFilename.toLowerCase().includes("activity") ||
        exportFilename.toLowerCase().includes("activite")
      ) {
        pdfTitle = "Liste des activités";
      } else if (
        exportFilename.toLowerCase().includes("organization") ||
        exportFilename.toLowerCase().includes("organisation")
      ) {
        pdfTitle = "Liste des organisations";
      }
    }

    exportToPDF({
      filename,
      title: pdfTitle,
      columns: exportColumns,
      data: filteredAndSortedData,
    });
  };

  const getActionIcon = (action: Action<T>) => {
    if (action.icon) return action.icon;

    switch (action.label.toLowerCase()) {
      case "voir":
      case "détails":
        return Eye;
      case "modifier":
      case "éditer":
        return Edit;
      case "supprimer":
        return Trash2;
      default:
        return Eye; // Icône par défaut
    }
  };

  const getActionStyles = (variant: string = "default") => {
    switch (variant) {
      case "danger":
        return "text-red-600 hover:bg-red-50 hover:text-red-700";
      case "primary":
        return "text-blue-600 hover:bg-blue-50 hover:text-blue-700";
      case "success":
        return "text-green-600 hover:bg-green-50 hover:text-green-700";
      default:
        return "text-gray-600 hover:bg-gray-50 hover:text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      {(title || description || searchable || filterable || customFilters) && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-gray-600 text-sm">{description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Filtres personnalisés sur la même ligne */}
              {customFilters && (
                <div className="flex items-center gap-2">{customFilters}</div>
              )}

              {/* Barre de recherche */}
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
              )}

              {/* Bouton de filtre */}
              {filterable && (
                <button
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Filtrer les données"
                >
                  <Filter className="w-4 h-4 text-gray-600" />
                </button>
              )}

              {/* Boutons d'exportation */}
              {exportable && filteredAndSortedData.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Exporter</span>
                    </button>

                    {/* Menu déroulant d'exportation */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={handleExportExcel}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                          <span>Excel (.xlsx)</span>
                        </button>
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>CSV (.csv)</span>
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <File className="w-4 h-4 text-red-600" />
                          <span>PDF (.pdf)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                      ? "text-right"
                      : "text-left"
                  } ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  } ${column.width ? `w-${column.width}` : ""}`}
                  onClick={() =>
                    column.sortable && handleSort(column.key as string)
                  }
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`w-3 h-3 ${
                            sortColumn === column.key && sortDirection === "asc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                        <ChevronDown
                          className={`w-3 h-3 -mt-1 ${
                            sortColumn === column.key &&
                            sortDirection === "desc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-500">Chargement...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentPageData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column.align === "center"
                          ? "text-center"
                          : column.align === "right"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {column.render
                        ? column.render(
                            getNestedValue(item, column.key as string),
                            item
                          )
                        : getNestedValue(item, column.key as string)}
                    </td>
                  ))}

                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {actions.map((action, actionIndex) => {
                          if (action.show && !action.show(item)) return null;

                          const IconComponent = getActionIcon(action);

                          return (
                            <button
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                              className={`p-2 rounded-lg transition-all duration-200 ${getActionStyles(
                                action.variant
                              )} hover:scale-105`}
                              title={action.label}
                            >
                              <IconComponent className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer avec pagination */}
      {!loading && totalItems > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* Informations sur les résultats */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {pagination ? (
                  <>
                    Affichage de {startIndex + 1} à{" "}
                    {Math.min(endIndex, totalItems)} sur {totalItems} élément
                    {totalItems > 1 ? "s" : ""}
                    {searchTerm && ` trouvé${totalItems > 1 ? "s" : ""}`}
                  </>
                ) : (
                  <>
                    {totalItems} élément{totalItems > 1 ? "s" : ""}
                    {searchTerm && ` trouvé${totalItems > 1 ? "s" : ""}`}
                  </>
                )}
              </span>

              {/* Sélecteur de nombre d'éléments par page */}
              {pagination && showPageSizeSelector && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Afficher:</span>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    title="Nombre d'éléments par page"
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">par page</span>
                </div>
              )}
            </div>

            {/* Contrôles de pagination */}
            {pagination && totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* Première page */}
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Première page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Page précédente */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Numéros de page */}
                <div className="flex items-center gap-1">
                  {/* Page courante avec pages adjacentes */}
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    let startPage = Math.max(
                      1,
                      currentPage - Math.floor(maxVisiblePages / 2)
                    );
                    const endPage = Math.min(
                      totalPages,
                      startPage + maxVisiblePages - 1
                    );

                    // Ajuster le début si nous sommes près de la fin
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    // Première page si elle n'est pas visible
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => goToPage(1)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                    }

                    // Pages visibles
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => goToPage(i)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            i === currentPage
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Dernière page si elle n'est pas visible
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => goToPage(totalPages)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Page suivante */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Page suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dernière page */}
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Dernière page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;

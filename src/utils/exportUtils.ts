import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Types pour l'exportation
export interface ExportColumn {
  key: string;
  label: string;
  render?: (value: unknown, item: unknown) => string;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: unknown[];
}

// Fonction utilitaire pour obtenir la valeur d'une propriété imbriquée
const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split(".").reduce((current: unknown, key: string) => {
    if (
      current &&
      typeof current === "object" &&
      current !== null &&
      key in current
    ) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

// Fonction pour nettoyer le texte (supprimer les balises HTML et formater)
const cleanText = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  // Si c'est un objet React ou contient des balises HTML, extraire le texte
  if (typeof value === "object") {
    // Pour les objets React, essayer d'extraire le texte
    const obj = value as Record<string, unknown>;
    if (obj.props && typeof obj.props === "object" && obj.props !== null) {
      const props = obj.props as Record<string, unknown>;
      if (props.children) {
        return extractTextFromReactElement(value);
      }
    }
    return JSON.stringify(value);
  }

  // Nettoyer les balises HTML si présentes
  const stringValue = String(value);
  return stringValue.replace(/<[^>]*>/g, "").trim();
};

// Fonction pour extraire le texte des éléments React
const extractTextFromReactElement = (element: unknown): string => {
  if (typeof element === "string") return element;
  if (typeof element === "number") return String(element);
  if (!element || typeof element !== "object") return "";

  const obj = element as Record<string, unknown>;
  if (obj.props && typeof obj.props === "object" && obj.props !== null) {
    const props = obj.props as Record<string, unknown>;
    if (props.children) {
      if (Array.isArray(props.children)) {
        return props.children.map(extractTextFromReactElement).join(" ");
      }
      return extractTextFromReactElement(props.children);
    }
  }

  return "";
};

// Export Excel
export const exportToExcel = (options: ExportOptions): void => {
  try {
    // Préparer les données
    const worksheetData = [
      // En-têtes
      options.columns.map((col) => col.label),
      // Données
      ...options.data.map((item) =>
        options.columns.map((col) => {
          const value = getNestedValue(
            item as Record<string, unknown>,
            col.key
          );
          return col.render
            ? cleanText(col.render(value, item))
            : cleanText(value);
        })
      ),
    ];

    // Créer le workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Style des en-têtes
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "F0F0F0" } },
    };

    // Appliquer le style aux en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = headerStyle;
    }

    // Ajuster la largeur des colonnes
    const colWidths = options.columns.map(() => ({ wch: 20 }));
    worksheet["!cols"] = colWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Données");

    // Générer le fichier
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${options.filename}.xlsx`);
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    alert("Erreur lors de l'export Excel");
  }
};

// Export CSV
export const exportToCSV = (options: ExportOptions): void => {
  try {
    // Préparer les données
    const csvData = [
      // En-têtes
      options.columns.map((col) => `"${col.label}"`).join(","),
      // Données
      ...options.data.map((item) =>
        options.columns
          .map((col) => {
            const value = getNestedValue(
              item as Record<string, unknown>,
              col.key
            );
            const cleanValue = col.render
              ? cleanText(col.render(value, item))
              : cleanText(value);
            // Échapper les guillemets et encapsuler dans des guillemets
            return `"${cleanValue.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    // Créer le contenu CSV
    const csvContent = csvData.join("\n");

    // Ajouter BOM pour l'UTF-8 (pour Excel)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `${options.filename}.csv`);
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);
    alert("Erreur lors de l'export CSV");
  }
};

// Fonction utilitaire pour générer un nom de fichier avec timestamp
export const generateFilename = (baseName: string): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, "");
  return `${baseName}_${timestamp}`;
};

// Fonction pour convertir les colonnes DataTable en colonnes d'export
export const convertDataTableColumns = <T>(
  columns: Array<{
    key: string | number | symbol;
    label: string;
    render?: (value: unknown, item: T) => unknown;
  }>
): ExportColumn[] => {
  return columns.map((col) => ({
    key: String(col.key),
    label: col.label,
    render: col.render
      ? (value: unknown, item: unknown) => {
          // Pour l'export, on veut du texte simple
          const rendered = col.render!(value, item as T);
          return cleanText(rendered);
        }
      : undefined,
  }));
};

// Fonction pour calculer la largeur optimale des colonnes
const calculateColumnWidths = (
  columns: ExportColumn[],
  data: unknown[],
  pageWidth: number
): number[] => {
  const minColumnWidth = 20; // Largeur minimale en mm
  const maxColumnWidth = 60; // Largeur maximale en mm
  const padding = 10; // Espacement total pour les marges

  // Calculer la largeur disponible
  const availableWidth = pageWidth - padding;

  // Calculer la largeur nécessaire pour chaque colonne
  const columnWidths = columns.map((column) => {
    let maxWidth = column.label.length * 1.5; // Largeur basée sur le label

    // Analyser les données pour trouver la largeur maximale nécessaire
    data.forEach((item) => {
      const value = getNestedValue(item as Record<string, unknown>, column.key);
      const cleanValue = column.render
        ? cleanText(column.render(value, item))
        : cleanText(value);

      // Calculer la largeur nécessaire pour ce contenu
      const contentWidth = cleanValue.length * 1.2; // Facteur d'ajustement
      maxWidth = Math.max(maxWidth, contentWidth);
    });

    // Appliquer les contraintes min/max
    return Math.max(minColumnWidth, Math.min(maxWidth, maxColumnWidth));
  });

  // Ajuster les largeurs pour qu'elles s'adaptent à la page
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  if (totalWidth > availableWidth) {
    // Réduire proportionnellement
    const scaleFactor = availableWidth / totalWidth;
    return columnWidths.map((width) =>
      Math.max(minColumnWidth, width * scaleFactor)
    );
  } else {
    // Distribuer l'espace restant
    const remainingSpace = availableWidth - totalWidth;
    const extraPerColumn = remainingSpace / columns.length;
    return columnWidths.map((width) => width + extraPerColumn);
  }
};

// Fonction pour diviser le texte en plusieurs lignes si nécessaire
// const wrapText = (text: string, maxWidth: number): string[] => {
//   if (!text || text.length === 0) return [""];

//   const words = text.split(" ");
//   const lines: string[] = [];
//   let currentLine = "";

//   for (const word of words) {
//     const testLine = currentLine ? `${currentLine} ${word}` : word;

//     // Estimation de la largeur (approximative)
//     if (testLine.length * 1.2 <= maxWidth) {
//       currentLine = testLine;
//     } else {
//       if (currentLine) {
//         lines.push(currentLine);
//         currentLine = word;
//       } else {
//         // Le mot seul est trop long, on le coupe
//         lines.push(word);
//         currentLine = "";
//       }
//     }
//   }

//   if (currentLine) {
//     lines.push(currentLine);
//   }

//   return lines;
// };

// Export PDF
export const exportToPDF = (options: ExportOptions): void => {
  try {
    // Créer le document PDF
    const doc = new jsPDF("l", "mm", "a4"); // Orientation paysage pour plus d'espace
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Calculer les largeurs des colonnes
    const columnWidths = calculateColumnWidths(
      options.columns,
      options.data,
      contentWidth
    );

    // Préparer les données pour le tableau
    const tableData = options.data.map((item) =>
      options.columns.map((col) => {
        const value = getNestedValue(item as Record<string, unknown>, col.key);
        const cleanValue = col.render
          ? cleanText(col.render(value, item))
          : cleanText(value);

        // Limiter la longueur du texte pour éviter les débordements
        return cleanValue.length > 100
          ? cleanValue.substring(0, 100) + "..."
          : cleanValue;
      })
    );

    // En-têtes du tableau
    const headers = options.columns.map((col) => col.label);

    // Configuration du tableau
    const tableConfig = {
      head: [headers],
      body: tableData,
      startY: 20,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak" as const,
        halign: "left" as const,
        valign: "middle" as const,
      },
      headStyles: {
        fillColor: [240, 240, 240] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: "bold" as const,
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248] as [number, number, number],
      },
      columnStyles: {} as Record<number, Record<string, unknown>>,
      didDrawPage: (data: { pageNumber: number }) => {
        // Ajouter le titre si fourni
        if (options.title && data.pageNumber === 1) {
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text(options.title, margin, 15);
        }

        // Ajouter le numéro de page
        const pageCount = (
          doc as unknown as { getNumberOfPages(): number }
        ).getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Page ${data.pageNumber} sur ${pageCount}`,
          pageWidth - margin - 20,
          pageHeight - 5
        );
      },
    };

    // Configurer les styles des colonnes avec les largeurs calculées
    options.columns.forEach((_, index) => {
      tableConfig.columnStyles[index] = {
        cellWidth: columnWidths[index],
        overflow: "linebreak" as const,
        halign: "left" as const,
      };
    });

    // Générer le tableau
    autoTable(doc, tableConfig);

    // Sauvegarder le fichier
    doc.save(`${options.filename}.pdf`);
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    alert("Erreur lors de l'export PDF");
  }
};
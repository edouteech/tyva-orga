export { default as DataTable } from "./DataTable";
export { default as DeleteConfirmation } from "./DeleteConfirmation";
export type { Column, Action } from "./DataTable";

// Re-export explicite pour éviter les problèmes de cache
export type {
  Column as DataTableColumn,
  Action as DataTableAction,
} from "./DataTable";

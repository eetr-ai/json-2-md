/**
 * Options for objectToMd markdown conversion.
 */

export interface ObjectToMdOptions {
  /** If true, append the original object as a fenced ```json ... ``` block at the end. */
  includeOriginal?: boolean;
  /** Override copy for specific fields. Keys are top-level field names; values replace schema description. */
  fieldCopy?: Record<string, string>;
  /** Override the document title. If set, used instead of root schema description. */
  docTitle?: string;
  /** When deriving a label from the key (no description / fieldCopy), use full path or just the leaf. Default: "leaf". */
  labelFromPath?: "full" | "leaf";
  /** How to structure the markdown: "document" (numbered titles for complex objects, numbered lists for arrays) or "bullets" (nested bullets / numbered lists throughout). Default: "document". */
  formatStrategy?: "document" | "bullets";
}

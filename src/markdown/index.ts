/**
 * Markdown conversion from JSON objects using schema descriptions.
 */

export { objectToMd } from "./objectToMd";
export {
  detectCase,
  camelCaseToDescription,
  snakeCaseToDescription,
  keyToDescription,
} from "./caseToDescription";
export type { KeyCase } from "./caseToDescription";
export type { ObjectToMdOptions } from "./types";

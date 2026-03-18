/**
 * json-2-md: convert JSON to markdown using a JSON schema description.
 * Works in Node.js and browser environments.
 */

export function jsonToMd(_json: unknown, _schema?: unknown): string {
  // Placeholder: implement conversion logic here
  return "";
}

export { objectToMd } from "./markdown";
export {
  detectCase,
  camelCaseToDescription,
  snakeCaseToDescription,
  keyToDescription,
} from "./markdown";
export type { ObjectToMdOptions, KeyCase } from "./markdown";

export { loadSchema, SchemaProcessor } from "./schema";
export type { ProcessResult, SchemaObject } from "./schema";

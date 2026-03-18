import { SchemaProcessor } from "./SchemaProcessor";
import type { SchemaObject } from "./types";

/**
 * Loads a JSON Schema into a {@link SchemaProcessor} for repeated use with `objectToMd`.
 * Parses string schemas, resolves `$ref`, and validates schema constraints.
 */
export function loadSchema(schema: SchemaObject | string): SchemaProcessor {
  return new SchemaProcessor(schema);
}

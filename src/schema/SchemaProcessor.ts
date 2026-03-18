/**
 * Loads a JSON schema, resolves its structure ($ref), and processes JSON
 * in one pass to validate and extract field descriptions.
 * Object schemas must have additionalProperties: false.
 */

import { resolveSchema } from "./resolver";
import type { ProcessResult, ResolvedSchema, SchemaObject } from "./types";
import { processWithResolvedSchema } from "./validator";

function assertAdditionalPropertiesFalse(schema: ResolvedSchema, path: string): void {
  if (schema.properties !== undefined && schema.additionalProperties !== false) {
    throw new Error(
      `Schema at ${path || "root"} has "properties" but additionalProperties is not false. additionalProperties must be false.`
    );
  }
  if (schema.properties) {
    for (const [k, v] of Object.entries(schema.properties)) {
      assertAdditionalPropertiesFalse(v, path ? `${path}.${k}` : k);
    }
  }
  if (schema.items) {
    assertAdditionalPropertiesFalse(schema.items, `${path}[]`);
  }
}

export class SchemaProcessor {
  private readonly resolvedSchema: ResolvedSchema;

  constructor(schema: SchemaObject | string) {
    const parsed: SchemaObject =
      typeof schema === "string" ? (JSON.parse(schema) as SchemaObject) : schema;
    this.resolvedSchema = resolveSchema(parsed);
    assertAdditionalPropertiesFalse(this.resolvedSchema, "");
  }

  process(json: unknown): ProcessResult {
    return processWithResolvedSchema(json, this.resolvedSchema);
  }
}

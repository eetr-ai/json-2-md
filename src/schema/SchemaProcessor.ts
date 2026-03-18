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

  /**
   * Returns the schema description at the given path.
   * - No argument or "" returns the top-level object description.
   * - Dot-separated path (e.g. "address.street") returns that property's description.
   * - Segment ending with "[]" (e.g. "tags[]") means the array items schema.
   */
  describe(path?: string): string | undefined {
    if (path === undefined || path === "") {
      return this.resolvedSchema.description;
    }
    const schema = this.getSchemaAtPath(path);
    return schema?.description;
  }

  private getSchemaAtPath(path: string): ResolvedSchema | undefined {
    if (path === "") return this.resolvedSchema;
    const segments = path.split(".");
    let current: ResolvedSchema = this.resolvedSchema;
    for (const segment of segments) {
      if (segment.endsWith("[]")) {
        const propName = segment.slice(0, -2);
        const props = current.properties;
        if (!props || !(propName in props)) return undefined;
        const next = props[propName];
        if (!next.items) return undefined;
        current = next.items;
      } else {
        const props = current.properties;
        if (!props || !(segment in props)) return undefined;
        current = props[segment];
      }
    }
    return current;
  }
}

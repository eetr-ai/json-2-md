/**
 * Single-pass validation and metadata extraction.
 * Validates JSON against a resolved schema and collects field descriptions.
 */

import type { ProcessResult, ResolvedSchema } from "./types";

const VALID_OK = "OK";

function pathJoin(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

function checkType(value: unknown, expected: string): boolean {
  if (expected === "null") return value === null;
  if (expected === "integer") return Number.isInteger(value);
  if (expected === "number") return typeof value === "number";
  if (expected === "string") return typeof value === "string";
  if (expected === "boolean") return typeof value === "boolean";
  if (expected === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (expected === "array") return Array.isArray(value);
  return false;
}

function expectedTypes(schema: ResolvedSchema): string[] {
  const t = schema.type;
  if (t === undefined) return [];
  return Array.isArray(t) ? t : [t];
}

function processValue(
  value: unknown,
  schema: ResolvedSchema,
  pathPrefix: string,
  fieldsDescription: Record<string, string>
): { valid: boolean; validReason: string } {
  if (schema.description !== undefined && pathPrefix !== "") {
    fieldsDescription[pathPrefix] = schema.description;
  }

  const types = expectedTypes(schema);
  if (types.length > 0) {
    const matched = types.some((t) => checkType(value, t));
    if (!matched) {
      const expected = types.length === 1 ? types[0] : `one of ${types.join(", ")}`;
      return {
        valid: false,
        validReason: `At "${pathPrefix}": expected ${expected}, got ${value === null ? "null" : Array.isArray(value) ? "array" : typeof value}.`,
      };
    }
  }

  if (schema.type === "object" || (Array.isArray(schema.type) && schema.type.includes("object"))) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { valid: true, validReason: VALID_OK };
    }
    const obj = value as Record<string, unknown>;
    const required = schema.required ?? [];
    const properties = schema.properties ?? {};
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(obj)) {
        if (!(k in properties)) {
          return {
            valid: false,
            validReason: `At "${pathPrefix}": additional property "${k}" is not allowed (additionalProperties: false).`,
          };
        }
      }
    }
    for (const r of required) {
      if (!(r in obj)) {
        return {
          valid: false,
          validReason: `At "${pathPrefix}": missing required field "${r}".`,
        };
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      const propSchema = properties[k];
      if (propSchema === undefined) continue;
      const path = pathJoin(pathPrefix, k);
      const result = processValue(v, propSchema, path, fieldsDescription);
      if (!result.valid) return result;
    }
    return { valid: true, validReason: VALID_OK };
  }

  if (schema.type === "array" || (Array.isArray(schema.type) && schema.type.includes("array"))) {
    if (!Array.isArray(value)) {
      return { valid: true, validReason: VALID_OK };
    }
    const itemsSchema = schema.items;
    if (itemsSchema === undefined) {
      return { valid: true, validReason: VALID_OK };
    }
    for (let i = 0; i < value.length; i++) {
      const result = processValue(value[i], itemsSchema, `${pathPrefix}[${i}]`, fieldsDescription);
      if (!result.valid) return result;
    }
    return { valid: true, validReason: VALID_OK };
  }

  return { valid: true, validReason: VALID_OK };
}

/**
 * Validate value against resolved schema and fill fieldsDescription in one pass.
 */
export function processWithResolvedSchema(
  value: unknown,
  resolvedSchema: ResolvedSchema
): ProcessResult {
  const fieldsDescription: Record<string, string> = {};
  const rootDesc = resolvedSchema.description;
  if (rootDesc !== undefined) {
    fieldsDescription[""] = rootDesc;
  }
  const result = processValue(value, resolvedSchema, "", fieldsDescription);
  return {
    valid: result.valid,
    validReason: result.validReason,
    fieldsDescription,
  };
}

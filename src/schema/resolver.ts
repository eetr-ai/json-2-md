/**
 * Resolves $ref in JSON Schema using $defs and definitions.
 * Returns a schema tree with no $ref left.
 */

import type { ResolvedSchema, SchemaNode, SchemaObject } from "./types";

function getDefs(schema: SchemaObject): Record<string, SchemaNode> | undefined {
  return schema.$defs ?? schema.definitions;
}

/**
 * Resolve a $ref like "#/$defs/Foo" or "#/definitions/Foo" against the root schema.
 */
export function resolveRef(
  root: SchemaObject,
  ref: string,
  defs: Record<string, SchemaNode> | undefined
): ResolvedSchema {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported $ref: ${ref}. Only #/$defs/... or #/definitions/... are supported.`);
  }
  const parts = ref.slice(2).split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Invalid $ref: ${ref}. Expected e.g. #/$defs/Name or #/definitions/Name.`);
  }
  const [defsKey, ...rest] = parts;
  if (defsKey !== "$defs" && defsKey !== "definitions") {
    throw new Error(`Unsupported $ref: ${ref}. Only #/$defs/... or #/definitions/... are supported.`);
  }
  if (!defs) {
    throw new Error(`$ref "${ref}" points to ${defsKey} but schema has no ${defsKey}.`);
  }
  const name = rest[0];
  const def = defs[name];
  if (def === undefined) {
    throw new Error(`$ref "${ref}": "${name}" not found in ${defsKey}.`);
  }
  return resolveSchemaNode(def, root);
}

function resolveSchemaNode(node: SchemaNode, root: SchemaObject): ResolvedSchema {
  if (typeof node !== "object" || node === null) {
    throw new Error("Invalid schema: expected an object.");
  }
  const ref = (node as SchemaObject).$ref;
  if (ref) {
    return resolveRef(root, ref, getDefs(root));
  }
  const obj = node as SchemaObject;
  const result: ResolvedSchema = {};
  if (obj.type !== undefined) result.type = obj.type as ResolvedSchema["type"];
  if (obj.description !== undefined) result.description = obj.description;
  if (obj.required !== undefined) result.required = [...obj.required];
  if (obj.additionalProperties !== undefined) result.additionalProperties = obj.additionalProperties;
  if (obj.properties !== undefined) {
    result.properties = {};
    for (const [k, v] of Object.entries(obj.properties)) {
      result.properties[k] = resolveSchemaNode(v, root);
    }
  }
  if (obj.items !== undefined) {
    result.items = resolveSchemaNode(obj.items, root);
  }
  return result;
}

/**
 * Resolve all $ref in the schema. Returns a schema with no $ref.
 * Uses root's $defs and definitions for resolution.
 */
export function resolveSchema(schema: SchemaObject): ResolvedSchema {
  return resolveSchemaNode(schema, schema);
}

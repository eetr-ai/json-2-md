/**
 * Types for the schema module: process result and supported JSON Schema fragment.
 */

export type JsonSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "null"
  | "object"
  | "array";

export interface SchemaRef {
  $ref: string;
}

export interface SchemaObject {
  type?: JsonSchemaType | JsonSchemaType[];
  description?: string;
  properties?: Record<string, SchemaNode>;
  required?: readonly string[];
  additionalProperties?: boolean;
  items?: SchemaNode;
  $ref?: string;
  $defs?: Record<string, SchemaNode>;
  definitions?: Record<string, SchemaNode>;
}

export type SchemaNode = SchemaObject | SchemaRef;

export interface ProcessResult {
  valid: boolean;
  validReason: string;
  fieldsDescription: Record<string, string>;
}

/** Resolved schema node (no $ref left). */
export interface ResolvedSchema {
  type?: JsonSchemaType | JsonSchemaType[];
  description?: string;
  properties?: Record<string, ResolvedSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: ResolvedSchema;
}

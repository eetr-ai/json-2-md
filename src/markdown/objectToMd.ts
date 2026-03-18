/**
 * Converts a validated object to markdown using schema descriptions.
 */

import type { SchemaObject } from "../schema/types";
import { SchemaProcessor } from "../schema/SchemaProcessor";
import { keyToDescription } from "./caseToDescription";
import type { ObjectToMdOptions } from "./types";

const DEFAULT_TITLE = "Document";

function getLabel(
  path: string,
  options: ObjectToMdOptions | undefined,
  fieldsDescription: Record<string, string>
): string {
  const labelFromPath = options?.labelFromPath ?? "leaf";
  const raw =
    options?.fieldCopy?.[path] ??
    fieldsDescription[path] ??
    (labelFromPath === "leaf" && path.includes(".")
      ? keyToDescription(path.split(".").pop() ?? path)
      : keyToDescription(path));
  return raw;
}

function formatPrimitive(value: string | number | boolean | null): string {
  if (value === null) return "null";
  return String(value);
}

function isComplexObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length > 0
  );
}

/** Mutable counter for section numbers in document strategy */
interface SectionCounter {
  next: number;
}

function renderDocumentValue(
  value: unknown,
  path: string,
  counter: SectionCounter,
  options: ObjectToMdOptions | undefined,
  fieldsDescription: Record<string, string>
): string {
  if (value === null || typeof value !== "object") {
    const label = getLabel(path, options, fieldsDescription);
    return `${label}: ${formatPrimitive(value as string | number | boolean | null)}`;
  }
  if (Array.isArray(value)) {
    const lines: string[] = [];
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      if (isComplexObject(item)) {
        const n = counter.next++;
        const itemLabel = getLabel(itemPath, options, fieldsDescription);
        lines.push(`## ${n}. ${itemLabel}`);
        let sub = 1;
        for (const [k, v] of Object.entries(item)) {
          const subPath = `${itemPath}.${k}`;
          const subLabel = getLabel(subPath, options, fieldsDescription);
          const formatted =
            v !== null && typeof v === "object" && !Array.isArray(v)
              ? JSON.stringify(v)
              : formatPrimitive(v as string | number | boolean | null);
          lines.push(`### ${n}.${sub}. ${subLabel}: ${formatted}`);
          sub++;
        }
      } else {
        lines.push(`${i + 1}. ${formatPrimitive(item as string | number | boolean | null)}`);
      }
    }
    return lines.join("\n\n");
  }
  // value is object
  const obj = value as Record<string, unknown>;
  const n = counter.next++;
  const label = getLabel(path, options, fieldsDescription);
  const lines: string[] = [`## ${n}. ${label}`];
  let sub = 1;
  for (const [k, v] of Object.entries(obj)) {
    const subPath = path ? `${path}.${k}` : k;
    const subLabel = getLabel(subPath, options, fieldsDescription);
    if (isComplexObject(v)) {
      const nestedLines: string[] = [];
      let subSub = 1;
      for (const [nk, nv] of Object.entries(v)) {
        const nestedPath = `${subPath}.${nk}`;
        nestedLines.push(
          `  ${getLabel(nestedPath, options, fieldsDescription)}: ${formatPrimitive(nv as string | number | boolean | null)}`
        );
        subSub++;
      }
      lines.push(`### ${n}.${sub}. ${subLabel}\n${nestedLines.join("\n")}`);
    } else if (Array.isArray(v)) {
      const arrStr = v
        .map((item, i) => `  ${n}.${sub}.${i + 1}. ${formatPrimitive(item as string | number | boolean | null)}`)
        .join("\n");
      lines.push(`### ${n}.${sub}. ${subLabel}\n${arrStr}`);
    } else {
      lines.push(`### ${n}.${sub}. ${subLabel}: ${formatPrimitive(v as string | number | boolean | null)}`);
    }
    sub++;
  }
  return lines.join("\n\n");
}

function renderBullets(
  value: unknown,
  path: string,
  indent: number,
  options: ObjectToMdOptions | undefined,
  fieldsDescription: Record<string, string>
): string {
  const prefix = "  ".repeat(indent);
  if (value === null || typeof value !== "object") {
    const label = getLabel(path, options, fieldsDescription);
    return `${prefix}- **${label}**: ${formatPrimitive(value as string | number | boolean | null)}`;
  }
  if (Array.isArray(value)) {
    const lines: string[] = [];
    value.forEach((item, i) => {
      if (isComplexObject(item)) {
        const subPath = path ? `${path}[${i}]` : `[${i}]`;
        lines.push(`${prefix}${i + 1}. ${getLabel(subPath, options, fieldsDescription)}`);
        for (const [k, v] of Object.entries(item)) {
          const nestedPath = `${subPath}.${k}`;
          lines.push(
            renderBullets(v, nestedPath, indent + 1, options, fieldsDescription)
          );
        }
      } else {
        lines.push(
          `${prefix}${i + 1}. ${formatPrimitive(item as string | number | boolean | null)}`
        );
      }
    });
    return lines.join("\n");
  }
  const obj = value as Record<string, unknown>;
  const lines: string[] = [];
  const parentLabel = getLabel(path, options, fieldsDescription);
  lines.push(`${prefix}- **${parentLabel}**:`);
  for (const [k, v] of Object.entries(obj)) {
    const subPath = path ? `${path}.${k}` : k;
    const label = getLabel(subPath, options, fieldsDescription);
    if (isComplexObject(v) || (Array.isArray(v) && v.length > 0)) {
      lines.push(
        renderBullets(v, subPath, indent + 1, options, fieldsDescription)
      );
    } else {
      lines.push(
        `${prefix}  - **${label}**: ${formatPrimitive(v as string | number | boolean | null)}`
      );
    }
  }
  return lines.join("\n");
}

/**
 * Converts an object to markdown using the given schema for validation and descriptions.
 * @param object - The object to convert (must validate against schema).
 * @param schema - JSON Schema object or string, or a SchemaProcessor from loadSchema.
 * @param options - Optional settings (includeOriginal, fieldCopy, docTitle, labelFromPath, formatStrategy).
 * @returns Markdown string.
 * @throws Error if the object does not validate against the schema.
 */
export function objectToMd(
  object: unknown,
  schema: SchemaObject | string | SchemaProcessor,
  options?: ObjectToMdOptions
): string {
  const processor =
    schema instanceof SchemaProcessor ? schema : new SchemaProcessor(schema);
  const result = processor.process(object);

  if (!result.valid) {
    throw new Error(result.validReason);
  }

  const title =
    options?.docTitle ?? result.fieldsDescription[""] ?? DEFAULT_TITLE;
  const strategy = options?.formatStrategy ?? "document";
  const fieldsDescription = result.fieldsDescription;

  const bodyLines: string[] = [];

  if (typeof object !== "object" || object === null || Array.isArray(object)) {
    const label = getLabel("", options, fieldsDescription);
    bodyLines.push(
      `${label}: ${formatPrimitive(object as string | number | boolean | null)}`
    );
  } else {
    const obj = object as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (strategy === "document") {
      const counter: SectionCounter = { next: 1 };
      for (const key of keys) {
        const value = obj[key];
        bodyLines.push(
          renderDocumentValue(
            value,
            key,
            counter,
            options,
            fieldsDescription
          )
        );
      }
    } else {
      for (const key of keys) {
        const value = obj[key];
        bodyLines.push(
          renderBullets(value, key, 0, options, fieldsDescription)
        );
      }
    }
  }

  let md = `# ${title}\n\n${bodyLines.join("\n\n")}`;

  if (options?.includeOriginal) {
    md += `\n\n\`\`\`json\n${JSON.stringify(object, null, 2)}\n\`\`\``;
  }

  return md;
}

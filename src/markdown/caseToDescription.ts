/**
 * Case detection and key-to-description helpers for fallback labels.
 */

export type KeyCase = "camelCase" | "snake_case";

/**
 * Detects whether a string is camelCase or snake_case.
 * If the string contains underscore and no space, treat as snake_case.
 * If it has lowercase followed by uppercase (no underscore), treat as camelCase.
 * Otherwise default to camelCase (e.g. single word or unknown).
 */
export function detectCase(str: string): KeyCase {
  if (str.includes("_") && !str.includes(" ")) {
    return "snake_case";
  }
  if (/[a-z][A-Z]/.test(str)) {
    return "camelCase";
  }
  return "camelCase";
}

/**
 * Converts camelCase to a human-readable description.
 * e.g. "firstName" -> "First name", "createdAt" -> "Created at"
 */
export function camelCaseToDescription(str: string): string {
  if (!str) return str;
  const withSpaces = str.replace(/([A-Z])/g, " $1").trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

/**
 * Converts snake_case to a human-readable description (sentence case).
 * e.g. "first_name" -> "First name"
 */
export function snakeCaseToDescription(str: string): string {
  if (!str) return str;
  const words = str.split("_").filter(Boolean);
  const withSpaces = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

/**
 * Converts a key (camelCase or snake_case) to a human-readable label
 * by detecting case and applying the appropriate converter.
 */
export function keyToDescription(key: string): string {
  if (!key) return key;
  const style = detectCase(key);
  return style === "snake_case"
    ? snakeCaseToDescription(key)
    : camelCaseToDescription(key);
}

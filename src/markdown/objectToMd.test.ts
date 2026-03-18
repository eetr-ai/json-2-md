import { describe, it, expect } from "vitest";
import { objectToMd } from "./objectToMd";

const schemaWithRootDesc = {
  type: "object",
  description: "User profile",
  properties: {
    name: { type: "string", description: "User name" },
  },
  required: ["name"],
  additionalProperties: false,
} as const;

const schemaNested = {
  type: "object",
  description: "Profile",
  properties: {
    name: { type: "string", description: "User name" },
    address: {
      type: "object",
      properties: {
        street: { type: "string", description: "Street" },
        city: { type: "string", description: "City" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

const schemaWithArray = {
  type: "object",
  description: "Document",
  properties: {
    title: { type: "string", description: "Title" },
    tags: {
      type: "array",
      items: { type: "string", description: "Tag" },
    },
  },
  additionalProperties: false,
} as const;

describe("objectToMd", () => {
  it("uses root schema description as title and field description for value", () => {
    const md = objectToMd({ name: "Alice" }, schemaWithRootDesc);
    expect(md).toContain("# User profile");
    expect(md).toContain("User name: Alice");
  });

  it("fieldCopy overrides schema description for label", () => {
    const md = objectToMd(
      { name: "Alice" },
      schemaWithRootDesc,
      { fieldCopy: { name: "Full name" } }
    );
    expect(md).toContain("Full name: Alice");
    expect(md).not.toContain("User name:");
  });

  it("docTitle overrides root description as title", () => {
    const md = objectToMd(
      { name: "Alice" },
      schemaWithRootDesc,
      { docTitle: "Custom Title" }
    );
    expect(md).toContain("# Custom Title");
    expect(md).not.toContain("# User profile");
  });

  it("includeOriginal appends fenced JSON block at the end", () => {
    const obj = { name: "Alice" };
    const md = objectToMd(obj, schemaWithRootDesc, { includeOriginal: true });
    expect(md).toMatch(/```json\n[\s\S]*\n```/);
    expect(md).toContain('"name": "Alice"');
  });

  it("throws when object is invalid against schema", () => {
    expect(() =>
      objectToMd({ name: 123 }, schemaWithRootDesc)
    ).toThrow(/expected string/);
    expect(() =>
      objectToMd({}, schemaWithRootDesc)
    ).toThrow(/missing required/);
  });

  it("empty object yields only title", () => {
    const emptySchema = {
      type: "object",
      description: "Empty",
      properties: {},
      additionalProperties: false,
    } as const;
    const md = objectToMd({}, emptySchema);
    expect(md).toBe("# Empty\n\n");
  });

  it("labelFromPath leaf uses last segment for fallback label", () => {
    const schemaNoDesc = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: {
            street_name: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    } as const;
    const md = objectToMd(
      { address: { street_name: "Main St" } },
      schemaNoDesc,
      { formatStrategy: "document", labelFromPath: "leaf" }
    );
    expect(md).toContain("Street name");
  });

  it("formatStrategy document: complex object uses numbered titles", () => {
    const md = objectToMd(
      { name: "Alice", address: { street: "Main St", city: "Boston" } },
      schemaNested,
      { formatStrategy: "document" }
    );
    expect(md).toContain("# Profile");
    expect(md).toContain("User name: Alice");
    expect(md).toContain("## 1. Address");
    expect(md).toContain("### 1.1. Street: Main St");
    expect(md).toContain("### 1.2. City: Boston");
  });

  it("formatStrategy document: array as numbered list", () => {
    const md = objectToMd(
      { title: "Doc", tags: ["a", "b"] },
      schemaWithArray,
      { formatStrategy: "document" }
    );
    expect(md).toContain("Title: Doc");
    expect(md).toContain("1. a");
    expect(md).toContain("2. b");
  });

  it("formatStrategy bullets: object fields as nested bullets", () => {
    const md = objectToMd(
      { name: "Alice", address: { street: "Main St", city: "Boston" } },
      schemaNested,
      { formatStrategy: "bullets" }
    );
    expect(md).toContain("# Profile");
    expect(md).toContain("- **User name**: Alice");
    expect(md).toContain("- **Address**:");
    expect(md).toContain("  - **Street**: Main St");
    expect(md).toContain("  - **City**: Boston");
  });

  it("formatStrategy bullets: array as numbered list", () => {
    const md = objectToMd(
      { title: "Doc", tags: ["x", "y"] },
      schemaWithArray,
      { formatStrategy: "bullets" }
    );
    expect(md).toContain("- **Title**: Doc");
    expect(md).toContain("1. x");
    expect(md).toContain("2. y");
  });

  it("accepts schema as string", () => {
    const md = objectToMd(
      { name: "Bob" },
      JSON.stringify(schemaWithRootDesc)
    );
    expect(md).toContain("# User profile");
    expect(md).toContain("User name: Bob");
  });
});

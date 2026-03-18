import { describe, it, expect } from "vitest";
import { SchemaProcessor } from "./SchemaProcessor";

describe("SchemaProcessor", () => {
  it("valid object: process returns valid true, OK reason, and field description", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "User name" },
      },
      required: ["name"],
      additionalProperties: false,
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process({ name: "Alice" });
    expect(result.valid).toBe(true);
    expect(result.validReason).toBe("OK");
    expect(result.fieldsDescription["name"]).toBe("User name");
  });

  it("invalid wrong type: process returns valid false and reason", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "User name" },
      },
      required: ["name"],
      additionalProperties: false,
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process({ name: 123 });
    expect(result.valid).toBe(false);
    expect(result.validReason).toContain("expected string");
    expect(result.validReason).toContain("number");
    expect(result.fieldsDescription["name"]).toBe("User name");
  });

  it("invalid missing required: process returns valid false", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "User name" },
      },
      required: ["name"],
      additionalProperties: false,
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process({});
    expect(result.valid).toBe(false);
    expect(result.validReason).toContain("missing required");
    expect(result.validReason).toContain("name");
  });

  it("schema with $ref: resolves and extracts description from ref", () => {
    const schema = {
      type: "object",
      properties: {
        prop: { $ref: "#/$defs/Nested" },
      },
      additionalProperties: false,
      $defs: {
        Nested: { type: "string", description: "Nested field" },
      },
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process({ prop: "x" });
    expect(result.valid).toBe(true);
    expect(result.fieldsDescription["prop"]).toBe("Nested field");
  });

  it("nested object: collects nested path descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: {
            street: { type: "string", description: "Street" },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process({ address: { street: "Main St" } });
    expect(result.valid).toBe(true);
    expect(result.fieldsDescription["address.street"]).toBe("Street");
  });

  it("array: validates and does not crash", () => {
    const schema = {
      type: "array",
      items: { type: "string", description: "List item" },
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process(["a", "b"]);
    expect(result.valid).toBe(true);
  });

  it("load from string: same behavior as object schema", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "User name" },
      },
      required: ["name"],
      additionalProperties: false,
    } as const;
    const processor = new SchemaProcessor(JSON.stringify(schema));
    const result = processor.process({ name: "Alice" });
    expect(result.valid).toBe(true);
    expect(result.fieldsDescription["name"]).toBe("User name");
  });

  it("invalid schema or ref: malformed ref throws in constructor", () => {
    const schema = {
      type: "object",
      properties: {
        prop: { $ref: "#/$defs/Missing" },
      },
      additionalProperties: false,
      $defs: {},
    } as const;
    expect(() => new SchemaProcessor(schema)).toThrow(/not found in \$defs/);
  });

  it("definitions (legacy) ref is resolved", () => {
    const schema = {
      type: "object",
      properties: {
        prop: { $ref: "#/definitions/Nested" },
      },
      additionalProperties: false,
      definitions: {
        Nested: { type: "string", description: "From definitions" },
      },
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process({ prop: "x" });
    expect(result.valid).toBe(true);
    expect(result.fieldsDescription["prop"]).toBe("From definitions");
  });

  it("additionalProperties: false rejects extra property in JSON", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "User name" },
      },
      additionalProperties: false,
    } as const;
    const processor = new SchemaProcessor(schema);
    const result = processor.process({ name: "Alice", extra: "not allowed" });
    expect(result.valid).toBe(false);
    expect(result.validReason).toContain("additional property");
    expect(result.validReason).toContain("extra");
    expect(result.validReason).toContain("additionalProperties: false");
  });

  it("schema with properties but without additionalProperties: false throws in constructor", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    } as const;
    expect(() => new SchemaProcessor(schema)).toThrow(/additionalProperties must be false/);
  });

  it("schema with additionalProperties: true throws in constructor", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      additionalProperties: true,
    } as const;
    expect(() => new SchemaProcessor(schema)).toThrow(/additionalProperties must be false/);
  });

  describe("describe()", () => {
    it("returns top-level description when called with no arg or empty string", () => {
      const schema = {
        type: "object",
        description: "Root object description",
        properties: { name: { type: "string" } },
        additionalProperties: false,
      } as const;
      const processor = new SchemaProcessor(schema);
      expect(processor.describe()).toBe("Root object description");
      expect(processor.describe("")).toBe("Root object description");
    });

    it("returns undefined for top-level when schema has no root description", () => {
      const schema = {
        type: "object",
        properties: { name: { type: "string" } },
        additionalProperties: false,
      } as const;
      const processor = new SchemaProcessor(schema);
      expect(processor.describe()).toBeUndefined();
      expect(processor.describe("")).toBeUndefined();
    });

    it("returns field description for dot-separated path", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string", description: "User name" },
          address: {
            type: "object",
            properties: {
              street: { type: "string", description: "Street" },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      } as const;
      const processor = new SchemaProcessor(schema);
      expect(processor.describe("name")).toBe("User name");
      expect(processor.describe("address.street")).toBe("Street");
    });

    it("returns undefined for nonexistent or partial path", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string", description: "User name" },
        },
        additionalProperties: false,
      } as const;
      const processor = new SchemaProcessor(schema);
      expect(processor.describe("nonexistent")).toBeUndefined();
      expect(processor.describe("name.missing")).toBeUndefined();
      expect(processor.describe("a.b.c")).toBeUndefined();
    });

    it("returns array items description for path ending with []", () => {
      const schema = {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string", description: "List item" },
          },
        },
        additionalProperties: false,
      } as const;
      const processor = new SchemaProcessor(schema);
      expect(processor.describe("tags[]")).toBe("List item");
    });

    it("returns nested field description under array items for path like a[].b", () => {
      const schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Item name" },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      } as const;
      const processor = new SchemaProcessor(schema);
      expect(processor.describe("items[].name")).toBe("Item name");
    });
  });
});

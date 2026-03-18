import { describe, it, expect } from "vitest";
import {
  detectCase,
  camelCaseToDescription,
  snakeCaseToDescription,
  keyToDescription,
} from "./caseToDescription";

describe("detectCase", () => {
  it("returns snake_case when string contains underscore", () => {
    expect(detectCase("first_name")).toBe("snake_case");
    expect(detectCase("some_key_name")).toBe("snake_case");
  });

  it("returns camelCase when string has lowercase followed by uppercase", () => {
    expect(detectCase("firstName")).toBe("camelCase");
    expect(detectCase("createdAt")).toBe("camelCase");
  });

  it("defaults to camelCase for single word or no pattern", () => {
    expect(detectCase("name")).toBe("camelCase");
    expect(detectCase("id")).toBe("camelCase");
  });
});

describe("camelCaseToDescription", () => {
  it("converts camelCase to human-readable", () => {
    expect(camelCaseToDescription("firstName")).toBe("First name");
    expect(camelCaseToDescription("createdAt")).toBe("Created at");
  });

  it("handles single word", () => {
    expect(camelCaseToDescription("name")).toBe("Name");
  });

  it("handles empty string", () => {
    expect(camelCaseToDescription("")).toBe("");
  });
});

describe("snakeCaseToDescription", () => {
  it("converts snake_case to human-readable", () => {
    expect(snakeCaseToDescription("first_name")).toBe("First name");
    expect(snakeCaseToDescription("street_address")).toBe("Street address");
  });

  it("handles single word", () => {
    expect(snakeCaseToDescription("name")).toBe("Name");
  });

  it("handles empty string", () => {
    expect(snakeCaseToDescription("")).toBe("");
  });
});

describe("keyToDescription", () => {
  it("uses camelCase converter for camelCase keys", () => {
    expect(keyToDescription("firstName")).toBe("First name");
  });

  it("uses snake_case converter for snake_case keys", () => {
    expect(keyToDescription("first_name")).toBe("First name");
  });
});

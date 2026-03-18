import { describe, it, expect } from "vitest";
import { jsonToMd } from "./index";

describe("jsonToMd", () => {
  it("returns a string", () => {
    expect(typeof jsonToMd({})).toBe("string");
  });

  it("returns empty string for placeholder implementation", () => {
    expect(jsonToMd({ foo: "bar" })).toBe("");
  });
});

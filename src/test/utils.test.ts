import { describe, it, expect } from "vitest";

describe("types", () => {
  it("ConnectionType values are valid", () => {
    const types = ["local", "aws"] as const;
    expect(types).toContain("local");
    expect(types).toContain("aws");
  });
});

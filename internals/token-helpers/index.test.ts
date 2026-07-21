import { describe, it, expect } from "vitest";
import type { TransformedToken, PlatformConfig } from "style-dictionary/types";
import { generateTokenName, getTokenValueWithUnit } from "./index";

const baseToken: TransformedToken = {
  $value: { value: "75", unit: "rem" },
  filePath: "tokens/breakpoints/breakpoints.json",
  isSource: true,
  $type: "dimension",
  key: "{breakpoint.desktop-lg}",
  original: {
    $value: { value: "75", unit: "rem" },
    $type: "dimension",
    key: "{breakpoint.desktop-lg}",
  },
  name: "desktop-lg",
  attributes: {},
  path: ["breakpoint", "desktop-lg"],
};

const options: PlatformConfig = {
  prefix: "usa",
  transforms: [],
  buildPath: "",
  files: [],
  log: {},
  actions: [],
};

function createToken(
  overrides: Partial<TransformedToken> = {},
): TransformedToken {
  return { ...baseToken, ...overrides };
}

describe("generateTokenName", () => {
  it("should generate token name for breakpoint prefix", () => {
    const result = generateTokenName(baseToken, options);
    expect(result).toBe("usa-breakpoint-desktop-lg");
  });

  it("should generate token name for spacing prefix", () => {
    const result = generateTokenName(
      createToken({ path: ["site-margins", "width"] }),
      options,
    );
    expect(result).toBe("usa-site-margins-width");
  });

  it("should generate token name for color with single nested key", () => {
    const result = generateTokenName(
      createToken({
        filePath: "tokens/colors/global.json",
        path: ["color", "black"],
      }),
      options,
    );
    expect(result).toBe("usa-color-black");
  });

  it("should generate token name for color with multiple nested keys", () => {
    const result = generateTokenName(
      createToken({
        filePath: "tokens/colors/blue.json",
        path: ["color", "blue", "5"],
      }),
      options,
    );
    expect(result).toBe("usa-color-blue-5");
  });

  it("should generate token name for color with vivid variant", () => {
    const result = generateTokenName(
      createToken({
        filePath: "tokens/colors/blue.json",
        path: ["color", "blue", "vivid", "50"],
      }),
      options,
    );
    expect(result).toBe("usa-color-blue-vivid-50");
  });

  it("should generate token name fallback for other cases", () => {
    const result = generateTokenName(
      createToken({ path: ["font", "base-size"] }),
      options,
    );
    expect(result).toBe("usa-font-base-size");
  });

  it("should strip the 'system' tier segment from path (ADR-0010)", () => {
    const result = generateTokenName(
      createToken({
        filePath: "tokens/system/color/blue.json",
        path: ["system", "color", "blue", "5"],
      }),
      options,
    );
    expect(result).toBe("usa-color-blue-5");
  });

  it("should strip the 'system' tier segment for breakpoints (ADR-0010)", () => {
    const result = generateTokenName(
      createToken({
        filePath: "tokens/system/breakpoints/breakpoints.json",
        path: ["system", "breakpoint", "desktop-lg"],
      }),
      options,
    );
    expect(result).toBe("usa-breakpoint-desktop-lg");
  });

  it("should strip the 'theme' tier segment from path (ADR-0010)", () => {
    const result = generateTokenName(
      createToken({
        filePath: "tokens/theme/color/primary.json",
        path: ["theme", "color", "primary"],
      }),
      options,
    );
    expect(result).toBe("usa-color-primary");
  });

  it("should strip the 'state' tier segment from path (ADR-0010)", () => {
    const result = generateTokenName(
      createToken({
        filePath: "tokens/state/color/error.json",
        path: ["state", "color", "error"],
      }),
      options,
    );
    expect(result).toBe("usa-color-error");
  });
});

describe("getTokenValueWithUnit", () => {
  it("should return value + unit for dimension tokens with object value", () => {
    const result = getTokenValueWithUnit(baseToken);
    expect(result).toBe("75rem");
  });

  it("should return value string when unit is missing in dimension object", () => {
    const result = getTokenValueWithUnit(
      createToken({ $value: { value: "30" } }),
    );
    expect(result).toBe("30");
  });

  it("should return raw value if token type is not dimension", () => {
    const result = getTokenValueWithUnit(
      createToken({ $value: "#fff2f5", $type: "color" }),
    );
    expect(result).toBe("#fff2f5");
  });
});

import type { TransformedToken, PlatformConfig } from "style-dictionary/types";

export const generateTokenName = (
  token: TransformedToken,
  options: PlatformConfig,
) => {
  if (token.filePath?.includes("tokens/colors/")) {
    return `${options.prefix}-color-${token.path.join("-")}`;
  }
  return `${options.prefix}-${token.path.join("-")}`;
};

export const getTokenValueWithUnit = (token: TransformedToken) => {
  if (token.$type === "dimension" && typeof token.$value === "object") {
    return token.$value.value + (token.$value.unit || "");
  }
  return token.$value;
};

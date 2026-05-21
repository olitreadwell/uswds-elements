import type { TransformedToken, PlatformConfig } from "style-dictionary/types";

export const generateTokenName = (
  token: TransformedToken,
  options: PlatformConfig,
) => {
  return `${options.prefix}-${token.path.join("-")}`;
};

export const getTokenValueWithUnit = (token: TransformedToken) => {
  if (token.$type === "dimension" && typeof token.$value === "object") {
    return token.$value.value + (token.$value.unit || "");
  }
  return token.$value;
};

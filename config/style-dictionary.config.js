import StyleDictionary from "style-dictionary";
import tokenGroups from "../tokens/index.js";
import {
  generateTokenName,
  getTokenValueWithUnit,
} from "../internals/token-helpers/index.ts";

StyleDictionary.registerTransform({
  name: "name/uswds-theme",
  type: "name",
  transform: generateTokenName,
});

StyleDictionary.registerTransform({
  name: "value/uswds-units",
  type: "value",
  transform: getTokenValueWithUnit,
});

export default {
  source: ["tokens/**/*.json"],
  platforms: {
    scss: {
      transforms: ["name/uswds-theme", "value/uswds-units"],
      prefix: "usa",
      buildPath: "build/scss/",
      files: tokenGroups.map((group) => ({
        destination: `_${group}.scss`,
        format: "scss/variables",
        filter: (token) => token.filePath.includes(`tokens/${group}/`),
      })),
    },
    css: {
      transforms: ["name/uswds-theme", "value/uswds-units"],
      prefix: "usa",
      buildPath: "build/css/",
      files: tokenGroups.map((group) => ({
        destination: `${group}.css`,
        format: "css/variables",
        filter: (token) => token.filePath.includes(`tokens/${group}/`),
      })),
    },
  },
};

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

function makePlatform(format) {
  return {
    transforms: ["name/uswds-theme", "value/uswds-units"],
    prefix: "usa",
    buildPath: `build/${format}/`,
    files: tokenGroups.map((group) => ({
      destination: format === "scss" ? `_${group}.scss` : `${group}.css`,
      format: `${format}/variables`,
      filter: (token) => token.filePath.includes(`tokens/${group}/`),
    })),
  };
}

export default {
  source: ["tokens/**/*.json"],
  platforms: {
    scss: makePlatform("scss"),
    css: makePlatform("css"),
  },
};

import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

// registerHooks({
//   resolve(specifier, context, nextResolve) {
//     if (specifier.endsWith(".css")) {
//       return {
//         url: "data:text/javascript,export default {};",
//         shortCircuit: true,
//       };
//     }

//     if (/^[a-zA-Z]:[\\/]/.test(specifier)) {
//       specifier = pathToFileURL(specifier).href;
//     }

//     return nextResolve(specifier, context);
//   },
// });
const CSS_PREFIX = "ignore-css:";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith(".css")) {
      return {
        url: `${CSS_PREFIX}${specifier}`,
        shortCircuit: true,
      };
    }

    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (url.startsWith(CSS_PREFIX)) {
      return {
        format: "module",
        source: "export default {};",
        shortCircuit: true,
      };
    }

    return nextLoad(url, context);
  },
});
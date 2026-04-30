import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Catch common bugs
      "no-constant-binary-expression": "error",
      "no-constructor-return": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "warn",

      // Code quality
      "no-lonely-if": "warn",
      "prefer-template": "warn",

      // TypeScript strictness (via eslint-config-next/typescript)
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
      "@typescript-eslint/no-import-type-side-effects": "warn",
    },
  },
]);

export default eslintConfig;

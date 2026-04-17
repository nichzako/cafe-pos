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
    "src/generated/**",
  ]),
  {
    rules: {
      // No console.log in production code — use server-side logger instead
      "no-console": "error",
      // No `any` type — use `unknown` + narrow instead
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);

export default eslintConfig;

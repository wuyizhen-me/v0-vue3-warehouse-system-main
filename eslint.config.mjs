import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        console: "readonly",
        fetch: "readonly",
        Request: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        FormData: "readonly",
        File: "readonly",
        Blob: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        alert: "readonly",
        confirm: "readonly",
        // DOM Element types
        HTMLDivElement: "readonly",
        HTMLParagraphElement: "readonly",
        HTMLHeadingElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLElement: "readonly",
        // DOM types
        DOMRect: "readonly",
        MouseEvent: "readonly",
        Node: "readonly",
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // React/Next.js globals
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Disable rules that are not critical
      "no-useless-assignment": "off",
      "no-useless-escape": "off",
      "no-case-declarations": "off",
      "preserve-caught-error": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

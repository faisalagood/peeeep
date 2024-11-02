import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**"]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "semi": "off",
      "quotes": "off",
      "no-useless-escape": "off"  // Move here to apply globally
    }
  },
  {
    files: ["webpack.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: [
      "./lib/emotes.js",
      "./lib/lib.js", 
      "./lib/navigation.js",
      "./lib/observer.js",
      "./lib/processor.js",
      "./lib/styles.js",
      "./lib/tooltip.js",
      "./main.js"
    ],
    rules: {
      // Optional: you can add additional rules here if needed for specific files
    }
  }
];

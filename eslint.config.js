const js = require("@eslint/js");
const globals = require("globals");
const prettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = [
  js.configs.recommended,
  prettierRecommended,
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: "latest",
      sourceType: "commonjs",
    },
    rules: {
      "prettier/prettier": [
        "error",
        {
          semi: true,
          singleQuote: false,
          trailingComma: "es5",
        },
      ],
    },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    ignores: ["node_modules/**", "uploads/**"],
  },
];

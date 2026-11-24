const js = require("@eslint/js");
const globals = require("globals");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
    // 1. Base recommended rules
    js.configs.recommended,

    // 2. Project-specific settings for CommonJS & Node
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node, // Recognizes require, module, process, __dirname, etc.
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Ignores unused Express params like _next
            "no-console": "off",
        },
    },

    // 3. Turns off ESLint formatting rules that conflict with Prettier (must be last)
    eslintConfigPrettier,
];

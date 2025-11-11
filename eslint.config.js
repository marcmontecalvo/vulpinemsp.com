// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  // Base recommended rules
  js.configs.recommended,

  // Project-wide defaults: treat .js as ESM
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // <-- default to ESM everywhere
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // Ignore build artifacts
  { ignores: ['_site/**', 'node_modules/**', 'dist/**'] },

  // 1) Node ESM files (Eleventy config, 11ty JS templates, any Node-side scripts)
  {
    files: ['.eleventy.js', 'src/**/*.11ty.js', 'functions/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // <-- make sure ESLint parses these as ESM
      globals: {
        ...globals.node, // process, Buffer, etc. (doesn't *enable* require; only marks names as globals)
      },
    },
    rules: {
      // add Node-specific rules here if needed
    },
  },

  // 2) Browser assets (site JS + forms UI)
  {
    files: ['src/assets/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, // window, document, etc.
        bootstrap: 'readonly',
        IMask: 'readonly',
        showContactSuccessPopup: 'readonly',
        showContactErrorPopup: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // 3) (Optional) If you ever keep legacy CommonJS files around, parse only those as CJS
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
];

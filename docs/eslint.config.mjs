import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  { languageOptions: { globals: globals.browser } },
  { files: ['**/*.mjs'], languageOptions: { globals: globals.node } },
  js.configs.recommended,
  ...ts.configs.recommended,
  { ignores: ['dist/'] },
];

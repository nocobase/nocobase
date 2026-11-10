export default [
  {
    files: ['**/*.mjs', '**/*.js'],
    ignores: ['templates/**'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
];

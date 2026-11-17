/** Configuración de ESLint del proyecto (flat config). */
// @ts-check
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'expo/**',
      '.husky/**',
    ],
  },
]);

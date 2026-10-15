//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import prettier from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  {
    name: 'likehome/generated-files',
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      '.output/**',
      '.tanstack/**',
      '.nitro/**',
      '.vinxi/**',
      '.wrangler/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/generated/**',
      'src/routeTree.gen.ts',
    ],
  },
  ...tanstackConfig,
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
  prettier,
]

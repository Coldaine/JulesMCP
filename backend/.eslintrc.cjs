const path = require('node:path');

const tsResolver = path.resolve(__dirname, 'ts-resolver.cjs');

module.exports = {
  root: true,
  ignorePatterns: ['*.cjs', 'dist', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  env: {
    node: true,
    es2022: true
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  settings: {
    'import/resolver': {
      [tsResolver]: {
        project: [path.resolve(__dirname, 'tsconfig.json')],
        alwaysTryTypes: true
      },
      node: {
        extensions: ['.js', '.ts'],
        moduleDirectory: ['node_modules', 'src']
      }
    }
  },
  rules: {
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',   // node:* imports
          'external',  // npm packages
          'internal',  // @shared/* paths
          ['parent', 'sibling', 'index'],  // relative imports
          'type'       // import type statements
        ],
        'newlines-between': 'always',
        'alphabetize': { order: 'asc', caseInsensitive: true }
      }
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: { arguments: false }
      }
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off'
  }
};

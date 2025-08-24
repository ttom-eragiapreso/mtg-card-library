import js from '@eslint/js';

const eslintConfig = [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        // React globals
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        args: 'after-used'
      }],
      'no-console': 'off', // Allow console statements for debugging
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-duplicate-imports': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      '.env*',
    ],
  },
];

export default eslintConfig;

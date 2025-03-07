module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignorePatterns: [
    'dist-electron/',
    '.output/',
    'dist/',
    'public/',
    '**/*.min.js',
    '**/*.d.ts',
  ],
  extends: [
    'eslint:recommended',
    '@vue/typescript/recommended',
    'plugin:vue/vue3-recommended',
    '@vue/standard',
    '@vue/eslint-config-typescript/recommended',
    'eslint-config-prettier',
  ],
  rules: {
    'vue/singleline-html-element-content-newline': 0,
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/no-v-model-argument': 0,
    'vue/script-setup-uses-vars': 'error',
    '@typescript-eslint/no-var-requires': 0,
    'vue/no-v-html': 0,
  },
  globals: {
    _: true,
  },
};

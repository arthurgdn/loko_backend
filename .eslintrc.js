module.exports = {
  parser: 'babel-eslint',
  env: {node: true, 'jest/globals': true },
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended'
  ],
  settings: {'jest': {'version': 26}},
  rules: {
    'quotes': ['error', 'single'],
    'array-bracket-spacing': 'error',
    'comma-spacing': 'error',
    'computed-property-spacing': 'error',
    'indent': ['error', 2],
    'max-len': ['error', { 'code': 100 }],
    'no-multiple-empty-lines': 'error',
    'no-trailing-spaces': 'error',
    'space-before-blocks': 'error',
    'space-before-function-paren': 'error',
    'space-in-parens': 'error',
    'semi-style': 'error',
    'semi': 'error',
    'operator-assignment': 'error',
    'operator-linebreak': 'error',
    'prefer-exponentiation-operator': 'error',
    'prefer-object-spread': 'error',
    'nonblock-statement-body-position': 'error',
    'key-spacing': 'error',
    'no-extra-parens': 'error',
    'object-curly-newline': ['error', {
      'ObjectExpression': { 'multiline': true, 'minProperties': 3 },
      'ObjectPattern': { 'multiline': true, 'minProperties': 3 },
      'ImportDeclaration': { 'multiline': true, 'minProperties': 3 },
      'ExportDeclaration': { 'multiline': true, 'minProperties': 3 },
    }],
    'no-case-declarations': 'off',
    'jest/expect-expect': 'off'
  },
};
const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['dist/*']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.node
    }
  }
]

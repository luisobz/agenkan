import reactHooks from 'eslint-plugin-react-hooks'
import nodeConfig from './eslint.config.node.js'

/** Lint rules for React packages: node base + rules of hooks. */
export default [
  ...nodeConfig,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules
  }
]

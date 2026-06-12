import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/** Base lint rules for Node packages (API, shared schemas). */
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  eslintConfigPrettier
)

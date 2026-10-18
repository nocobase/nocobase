import shared from '@nocobase/dev-config/prettier';
import * as astroPlugin from 'prettier-plugin-astro';

// The repository's shared settings, plus the Astro plugin for `.astro` components. The plugin is passed as a module
// rather than by name so that Prettier run from the repository root (the pre-commit hook, `pnpm format`) finds it in
// this package's dependencies.
export default {
  ...shared,
  plugins: [astroPlugin],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};

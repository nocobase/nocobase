import { createNodeLibraryConfig } from '@nocobase/dev-config/eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

// The site is built by Node (configuration, integrations, Markdown plugins, scripts) and ships a few small browser
// scripts. The shared Node preset covers the former; the browser scripts and the `.astro` components' client
// `<script>` blocks get browser globals on top.
export default createNodeLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['.astro/**', 'docs/**'],
  environment: [
    ...astro.configs.recommended,
    {
      name: '@nocobase/docs/browser',
      files: [
        'src/scripts/**',
        'src/components/**/*.{mjs,ts}',
        '**/*.astro',
        '**/*.astro/*.ts',
      ],
      languageOptions: { globals: { ...globals.browser } },
    },
  ],
});

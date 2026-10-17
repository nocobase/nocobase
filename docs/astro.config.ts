import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import { defineConfig, passthroughImageService } from 'astro/config';
import remarkDirective from 'remark-directive';
import { SITE_ORIGIN } from './shared/site.ts';
import { remarkCallouts } from './src/markdown/callouts.ts';
import {
  rehypeHeadingAnchors,
  remarkStripTitle,
} from './src/markdown/headings.ts';
import { remarkDocLinks } from './src/markdown/links.ts';
import { rehypeTableWrapper } from './src/markdown/tables.ts';
import { docsSite } from './src/integrations/docs-site.ts';

const contentRoot = fileURLToPath(new URL('./docs', import.meta.url));

export default defineConfig({
  site: SITE_ORIGIN,
  // Pages are emitted as `x/index.html`, which the CDN's back-to-origin rules map extensionless URLs to. A page's
  // canonical URL keeps the slash shape of its source (`x/index.md` -> `/x/`, `x.md` -> `/x`), so both shapes are
  // accepted in development.
  build: { format: 'directory' },
  trailingSlash: 'ignore',
  // The site ships no client-side router and no prefetching; every page is a plain document.
  prefetch: false,
  devToolbar: { enabled: false },
  image: {
    // Images in the Markdown are published as they are, as the Rspress site did, rather than re-encoded.
    service: passthroughImageService(),
  },
  markdown: {
    processor: unified({
      // Rspress kept straight quotes; curly ones would change text people copy out of the prose.
      smartypants: false,
      remarkPlugins: [
        remarkDirective,
        remarkCallouts,
        [remarkDocLinks, { contentRoot }],
        remarkStripTitle,
      ],
      rehypePlugins: [
        rehypeHeadingIds,
        rehypeHeadingAnchors,
        rehypeTableWrapper,
      ],
    }),
    shikiConfig: { theme: 'github-light' },
  },
  integrations: [mdx(), docsSite({ contentRoot })],
  vite: {
    build: {
      rolldownOptions: {
        // Astro marks every Markdown module with the directive "use astro:head-inject", and the bundler warns once per
        // page that it cannot keep a module-level directive. The warning is about Astro's own marker and says
        // nothing about the site, so it is dropped to keep real warnings visible.
        onwarn(warning, warn) {
          if (
            warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
            warning.message.includes('astro:head-inject')
          )
            return;
          warn(warning);
        },
      },
    },
  },
});

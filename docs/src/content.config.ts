import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LANGUAGES } from '../shared/languages.ts';

/**
 * Every Markdown page of every language, read from `docs/<lang>/` where the structural checks in `check.sh` expect
 * it. The entry id is the source path without its extension, `en/capabilities/auth/index`, so it maps back to the
 * file and to the URL rules in `shared/routes.ts` without guessing.
 */
const docs = defineCollection({
  loader: glob({
    base: './docs',
    pattern: LANGUAGES.map(({ key }) => `${key}/**/[^_]*.{md,mdx}`),
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
    // Render when a page is built rather than caching the HTML in the content store, so a change to a Markdown
    // plugin takes effect without clearing `.astro/`.
    deferRender: true,
  }),
  schema: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
      /** Selects a hand-built page that renders instead of the Markdown body; see `src/lib/pages.ts`. */
      pageName: z.string().optional(),
      pageType: z.string().optional(),
    })
    .loose(),
});

export const collections = { docs };

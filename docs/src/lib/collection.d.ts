/**
 * The typed boundary to the `docs` content collection.
 *
 * `astro:content` gets its types from `.astro/types.d.ts`, which `astro sync` generates. The pull request checks run
 * this package's ESLint from the repository root on changed files before anything has generated it, and the
 * type-aware rules then see every collection entry as `any`. Declaring the shape here keeps the rest of the code typed
 * either way; `content.config.ts` is the schema it mirrors.
 */
export interface DocFrontmatter {
  title?: string;
  description?: string;
  keywords?: string;
  pageName?: string;
  pageType?: string;
}

export interface DocEntry {
  /** Source path without extension: `en/capabilities/auth/index`. */
  id: string;
  collection: 'docs';
  filePath?: string;
  body?: string;
  data: DocFrontmatter;
}

export function getDocEntries(): Promise<DocEntry[]>;

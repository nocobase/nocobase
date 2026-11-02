import fs from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import * as pagefind from 'pagefind';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../../shared/languages.ts';
import { checkLinks, readHtmlPages } from './html.ts';
import { buildSitemap } from './sitemap.ts';

export interface DocsSiteOptions {
  /** Absolute path of `docs/docs`, whose first-level directories are the languages. */
  contentRoot: string;
}

/**
 * The build steps that run over the finished site rather than over a single page:
 *
 * - copy each language's `docs/<lang>/public/` to that language's base, where the Rspress site served it;
 * - move a non-default language's 404 page to `<base>404.html`, the path the Rspress site used;
 * - fail the build on a link to a page, file or heading that does not exist;
 * - write `sitemap.xml` from the canonical, indexable pages that were actually emitted;
 * - write the Pagefind search index.
 */
export function docsSite(options: DocsSiteOptions): AstroIntegration {
  return {
    name: '@nocobase/docs-site',
    hooks: {
      'astro:server:setup': ({ server }) => {
        // Serve each language's `public/` under its base in development, as the build will.
        server.middlewares.use((request, response, next) => {
          const pathname = decodeURIComponent(
            (request.url ?? '/').split('?')[0],
          );
          for (const language of LANGUAGES) {
            if (!pathname.startsWith(language.base)) continue;
            const file = path.join(
              options.contentRoot,
              language.key,
              'public',
              pathname.slice(language.base.length),
            );
            if (
              file.startsWith(
                path.join(options.contentRoot, language.key, 'public'),
              ) &&
              isFile(file)
            ) {
              createReadStream(file).pipe(response);
              return;
            }
          }
          next();
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        await copyLanguagePublicDirectories(options.contentRoot, outDir);
        await moveLanguageNotFoundPages(outDir);

        const pages = await readHtmlPages(outDir);
        reportLinks(checkLinks(outDir, pages), logger);

        const sitemap = buildSitemap(pages);
        await fs.writeFile(path.join(outDir, 'sitemap.xml'), sitemap.xml);
        logger.info(`sitemap.xml: ${sitemap.count} URLs`);

        await writeSearchIndex(outDir, logger);
      },
    },
  };
}

function isFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

async function copyLanguagePublicDirectories(
  contentRoot: string,
  outDir: string,
) {
  for (const language of LANGUAGES) {
    const source = path.join(contentRoot, language.key, 'public');
    if (!existsSync(source)) continue;
    await fs.cp(source, path.join(outDir, language.base), { recursive: true });
  }
}

async function moveLanguageNotFoundPages(outDir: string) {
  for (const language of LANGUAGES) {
    if (language.key === DEFAULT_LANGUAGE) continue;
    const directory = path.join(outDir, language.base, '404');
    const page = path.join(directory, 'index.html');
    if (!existsSync(page)) continue;
    await fs.rename(page, path.join(outDir, language.base, '404.html'));
    await fs.rm(directory, { recursive: true, force: true });
  }
}

function reportLinks(
  problems: ReturnType<typeof checkLinks>,
  logger: AstroIntegrationLogger,
) {
  if (problems.length === 0) {
    logger.info('Link check: no broken links');
    return;
  }
  const lines = problems.map(
    ({ page, href, reason }) => `  ${page}: ${href} (${reason})`,
  );
  throw new Error(
    `Found ${problems.length} broken link(s):\n${lines.join('\n')}`,
  );
}

async function writeSearchIndex(
  outDir: string,
  logger: AstroIntegrationLogger,
) {
  try {
    const { index, errors } = await pagefind.createIndex({});
    if (!index)
      throw new Error(
        `Pagefind could not create an index: ${errors.join('; ')}`,
      );
    const added = await index.addDirectory({ path: outDir });
    if (added.errors.length > 0)
      throw new Error(`Pagefind indexing failed: ${added.errors.join('; ')}`);
    const written = await index.writeFiles({
      outputPath: path.join(outDir, 'pagefind'),
    });
    if (written.errors.length > 0)
      throw new Error(
        `Pagefind could not write its files: ${written.errors.join('; ')}`,
      );
    logger.info(`Pagefind: indexed ${added.page_count} pages`);
  } finally {
    await pagefind.close();
  }
}

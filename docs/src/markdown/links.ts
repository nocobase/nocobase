import fs from 'node:fs';
import path from 'node:path';
import type { Link, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { localizePath } from '../../shared/languages.ts';
import { isMarkdownFile, sourceToRoute } from '../../shared/routes.ts';

/** The part of a node's `data` that `remark-rehype` turns into HTML attributes. */
type LinkData = NonNullable<Link['data']> & {
  hProperties?: Record<string, unknown>;
};

export interface DocLinkOptions {
  /** Absolute path of the content root, `docs/docs`, whose first-level directories are the languages. */
  contentRoot: string;
}

const EXTERNAL = /^[a-z][a-z\d+.-]*:/i;

/**
 * Resolve a link written in a Markdown source to its public URL.
 *
 * Authors link to the file they mean, `./password.md` or `../authorization/index.md`, so the link survives renaming
 * the page's URL scheme and stays checkable. A link to a Markdown file that exists becomes the page URL with the
 * fragment kept (`/zh-CN/capabilities/auth/password#staff`). Anything that does not resolve is returned unchanged:
 * the build's link check then reports it against the emitted HTML, which is the one place every kind of link — in
 * Markdown, in the sidebar, in hand-written pages — can be checked the same way.
 */
export function resolveDocLink(
  url: string,
  sourceFile: string,
  contentRoot: string,
): string | undefined {
  if (!url || url.startsWith('#') || url.startsWith('/') || EXTERNAL.test(url))
    return undefined;
  const hashIndex = url.search(/[?#]/);
  const target = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const suffix = hashIndex >= 0 ? url.slice(hashIndex) : '';
  if (!isMarkdownFile(target)) return undefined;
  // `./index.md` also names `index.mdx`, as it did on the Rspress site.
  const absolute = withExistingExtension(
    path.resolve(path.dirname(sourceFile), decodeURI(target)),
  );
  if (!absolute) return undefined;
  const relative = path
    .relative(contentRoot, absolute)
    .split(path.sep)
    .join('/');
  if (relative.startsWith('..')) return undefined;
  const [language, ...rest] = relative.split('/');
  return localizePath(language, sourceToRoute(rest.join('/'))) + suffix;
}

function withExistingExtension(file: string): string | undefined {
  const base = file.replace(/\.mdx?$/, '');
  return [file, `${base}.md`, `${base}.mdx`].find((candidate) =>
    fs.existsSync(candidate),
  );
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Rewrite relative links to Markdown files into page URLs, and open external links in a new tab the way the Rspress
 * site did (`target="_blank" rel="noopener noreferrer"`).
 */
export function remarkDocLinks(options: DocLinkOptions) {
  return (tree: Root, file: { path?: string }) => {
    const sourceFile = file.path;
    visit(tree, 'link', (node: Link) => {
      if (isExternalUrl(node.url)) {
        const data: LinkData | undefined = node.data;
        Object.assign(node, {
          data: {
            ...data,
            hProperties: {
              ...data?.hProperties,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          },
        });
        return;
      }
      if (!sourceFile) return;
      const resolved = resolveDocLink(
        node.url,
        sourceFile,
        options.contentRoot,
      );
      if (resolved) node.url = resolved;
    });
  };
}

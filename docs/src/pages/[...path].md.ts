import type { APIRoute, GetStaticPaths } from 'astro';
import { markdownCopy } from '../lib/llms.ts';
import { getPages, type DocPage } from '../lib/pages.ts';

/** The Markdown copy of every page, next to it: `/capabilities/file.md`, `/zh-CN/capabilities/auth/index.md`. */
export const getStaticPaths = (async () =>
  (await getPages()).map((page) => ({
    params: { path: page.markdownPath.replace(/^\//, '').replace(/\.md$/, '') },
    props: { page },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ page: DocPage }> = async ({ props }) =>
  new Response(markdownCopy(props.page, await getPages()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });

import type { APIRoute, GetStaticPaths } from 'astro';
import { LANGUAGES } from '../../../shared/languages.ts';
import { llmsTxt } from '../../lib/llms.ts';
import { getPages } from '../../lib/pages.ts';

/** `/llms.txt` and `/zh-CN/llms.txt`: an index of every page's Markdown copy. */
export const getStaticPaths = (() =>
  LANGUAGES.map(({ key, base }) => ({
    params: { base: base.replace(/^\/|\/$/g, '') || undefined },
    props: { language: key },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ language: string }> = async ({ props }) =>
  new Response(llmsTxt(props.language, await getPages()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

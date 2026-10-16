import type { APIRoute, GetStaticPaths } from 'astro';
import { LANGUAGES } from '../../../shared/languages.ts';
import { llmsFullTxt } from '../../lib/llms.ts';
import { getPages } from '../../lib/pages.ts';

/** `/llms-full.txt` and `/zh-CN/llms-full.txt`: every page's Markdown copy in one file. */
export const getStaticPaths = (() =>
  LANGUAGES.map(({ key, base }) => ({
    params: { base: base.replace(/^\/|\/$/g, '') || undefined },
    props: { language: key },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ language: string }> = async ({ props }) =>
  new Response(llmsFullTxt(props.language, await getPages()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

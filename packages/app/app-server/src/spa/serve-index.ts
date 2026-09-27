import { readFile } from 'node:fs/promises';

import { injectSpaRuntimeHtml } from './runtime-html.js';
import type { SpaClientConfigMap } from './types.js';

export interface ServeSpaIndexOptions {
  readonly clientConfig?: SpaClientConfigMap;
  readonly publicConfig?: SpaClientConfigMap;
  /** The path the application is mounted at, which the page's relative URLs are resolved against. */
  readonly publicBasePath?: string;
}

export async function serveSpaIndex(
  indexPath: string,
  options: ServeSpaIndexOptions = {},
): Promise<Response> {
  const html = await readFile(indexPath, 'utf8');
  return new Response(injectSpaRuntimeHtml(html, options), {
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

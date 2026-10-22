import type { APIRoute } from 'astro';
import { absoluteUrl } from '../../shared/site.ts';

/** Every page may be crawled; `sitemap.xml` lists the canonical ones. */
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );

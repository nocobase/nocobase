import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const html = readFileSync(
  fileURLToPath(new URL('../../index.html', import.meta.url)),
  'utf8',
);

/** The markup the browser paints before the client script has started and the visitor's language is known. */
function bootstrapRoot(): string {
  const match = /<div id="root">([\s\S]*?)<\/div>\s*<script/u.exec(html);
  if (!match) throw new Error('index.html has no #root placeholder.');
  return match[1].replace(/<!--[\s\S]*?-->/gu, '');
}

describe('bootstrap loading in index.html', () => {
  it('shows no text in any language before the client starts', () => {
    const text = bootstrapRoot()
      .replace(/<[^>]*>/gu, '')
      .trim();

    expect(text).toBe('');
  });

  it('carries no accessible name a screen reader would read in the wrong language', () => {
    const root = bootstrapRoot();

    expect(root).not.toMatch(
      /aria-label|aria-labelledby|<title|role="status"/u,
    );
    expect(root).toContain('aria-busy="true"');
    expect(root).toMatch(/<svg[^>]*aria-hidden="true"/u);
  });

  it('keeps the brand mark still for reduced motion', () => {
    expect(html).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{\s*\.app-bootstrap-loading \.nocobase-loading-orbit\s*\{\s*animation: none;/u,
    );
  });
});

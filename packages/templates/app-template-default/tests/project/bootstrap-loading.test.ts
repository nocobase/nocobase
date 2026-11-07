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

/** The opening tag of the placeholder element, which carries its accessible semantics. */
function placeholderTag(): string {
  const tag = /<div\s+class="app-bootstrap-loading"[^>]*>/u.exec(
    bootstrapRoot(),
  );
  if (!tag) throw new Error('index.html has no bootstrap loading placeholder.');
  return tag[0].replace(/\s+/gu, ' ');
}

describe('bootstrap loading in index.html', () => {
  it('shows no text in any language before the client starts', () => {
    const text = bootstrapRoot()
      .replace(/<[^>]*>/gu, '')
      .trim();

    expect(text).toBe('');
  });

  it('is perceivable as loading without words in a language', () => {
    const tag = placeholderTag();
    const title = /<title>([^<]*)<\/title>/u.exec(html)?.[1];

    // An indeterminate progress bar: the screen reader announces the role in its own language.
    expect(tag).toContain('role="progressbar"');
    expect(tag).not.toMatch(/aria-valuenow|aria-valuetext/u);
    // Its name is the brand, which reads the same in every language and matches the document title.
    expect(title).toBeTruthy();
    expect(tag).toContain(`aria-label="${title}"`);
    expect(bootstrapRoot()).toMatch(/<svg[^>]*aria-hidden="true"/u);
  });

  it('leaves announcing the loading to the localized status of the client', () => {
    // A live region here would be announced, then announced again by the client's localized status.
    expect(bootstrapRoot()).not.toMatch(
      /role="status"|role="alert"|aria-live/u,
    );
  });

  it('keeps the brand mark still for reduced motion', () => {
    expect(html).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{\s*\.app-bootstrap-loading \.nocobase-loading-orbit\s*\{\s*animation: none;/u,
    );
  });
});

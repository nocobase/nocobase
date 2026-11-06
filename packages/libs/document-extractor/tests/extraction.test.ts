/** A file's text extracted as Markdown in a worker thread, for every type the knowledge base parses. */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { SUPPORTED_DOCUMENT_EXTENSIONS as KNOWLEDGE_PARSED_EXTENSIONS } from '../src/formats.js';
import { isParsed, workerExtractor } from '../src/index.js';
import { rowsToMarkdown } from '../src/worker.js';

const fixture = (name: string) =>
  new Uint8Array(
    readFileSync(path.resolve(import.meta.dirname, 'fixtures', name)),
  );

describe('extracting a file’s text', () => {
  const extract = workerExtractor({ timeoutMs: 60_000 });

  it.each(KNOWLEDGE_PARSED_EXTENSIONS.map((ext) => [ext]))(
    'reads a .%s file',
    async (ext) => {
      const result = await extract({ bytes: fixture(`sample.${ext}`), ext });
      expect(result.status).toBe('ready');
      if (result.status !== 'ready') return;
      expect(result.markdown.toLowerCase()).toContain(`quokka ${ext} marker`);
      expect(result.hasText).toBe(true);
    },
  );

  it('gives a section per sheet and a table per run of rows', async () => {
    const result = await extract({
      bytes: fixture('sample.xlsx'),
      ext: 'xlsx',
    });
    expect(result).toMatchObject({ status: 'ready' });
    if (result.status !== 'ready') return;
    expect(result.markdown).toContain('## Budget');
    expect(result.markdown).toContain('| item | note |');
    expect(rowsToMarkdown([['a|b', ''], ['x']])).toBe(
      '| a\\|b |\n| --- |\n| x |',
    );
  });

  it('stores images and other types only', async () => {
    expect(isParsed('png')).toBe(false);
    expect(isParsed('PDF')).toBe(true);
    expect(await extract({ bytes: fixture('sample.png'), ext: 'png' })).toEqual(
      { status: 'unsupported' },
    );
  });

  it('fails a file it cannot read, without failing the server', async () => {
    const result = await extract({
      bytes: new TextEncoder().encode('not a document'),
      ext: 'docx',
    });
    expect(result.status).toBe('failed');
  });
  it('preserves caller bytes, normalizes extensions and rejects excess output', async () => {
    const bytes = fixture('sample.docx');
    const original = bytes.slice();
    expect(await extract({ bytes, ext: 'DOCX' })).toMatchObject({
      status: 'ready',
    });
    expect(bytes).toEqual(original);
    expect(
      await extract({ bytes, ext: 'docx' }, { maxOutputChars: 2 }),
    ).toMatchObject({ code: 'too-large' });
    expect(
      await workerExtractor({ maxInputBytes: 1 })({ bytes, ext: 'docx' }),
    ).toMatchObject({ code: 'too-large' });
    expect(await extract({ bytes: new Uint8Array(), ext: 'txt' })).toEqual({
      status: 'ready',
      markdown: '',
      hasText: false,
    });
    expect(
      await extract({
        bytes: new TextEncoder().encode('{broken'),
        ext: 'json',
      }),
    ).toMatchObject({ markdown: expect.stringContaining('{broken') });
    expect(await extract({ bytes, ext: 'ppt' })).toEqual({
      status: 'unsupported',
    });
  });
  it('distinguishes generated page headings from actual text without changing Markdown', async () => {
    expect(
      await extract({ bytes: fixture('blank-pages.pdf'), ext: 'pdf' }),
    ).toEqual({
      status: 'ready',
      markdown: '## Page 1\n\n## Page 2',
      hasText: false,
    });
  });

  it('can omit embedded DOCX image data before the text budget while preserving default Markdown', async () => {
    const request = { bytes: fixture('image-text.docx'), ext: 'docx' };
    const original = await extract(request);
    expect(original).toMatchObject({ status: 'ready' });
    if (original.status === 'ready')
      expect(original.markdown).toContain('data:image/png;base64,');
    expect(await extract(request, { maxOutputChars: 100_000 })).toMatchObject({
      code: 'too-large',
    });
    const result = await extract(request, {
      maxOutputChars: 100_000,
      omitEmbeddedImages: true,
    });
    expect(result).toMatchObject({
      status: 'ready',
      hasText: true,
      markdown: 'Quokka embedded image text marker',
    });
    expect(
      await extract(request, { maxOutputChars: 1, omitEmbeddedImages: true }),
    ).toMatchObject({ code: 'too-large' });
    expect(
      await extract(
        { bytes: fixture('image-only.docx'), ext: 'docx' },
        { maxOutputChars: 100_000, omitEmbeddedImages: true },
      ),
    ).toMatchObject({ status: 'ready', markdown: '', hasText: false });
  });
});

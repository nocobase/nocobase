// @vitest-environment node
/** A file's text extracted as Markdown in a worker thread, for every type the knowledge base parses. */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { KNOWLEDGE_PARSED_EXTENSIONS } from '../shared/knowledge.js';
import { isParsed, workerExtractor } from '../server/parsing/index.js';
import { rowsToMarkdown } from '../server/parsing/worker.js';

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
});

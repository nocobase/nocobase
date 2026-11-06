// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { isParsed, workerExtractor } from '../server/index.js';
import { KNOWLEDGE_PARSED_EXTENSIONS } from '../shared/knowledge.js';

it('keeps the public parsing entry compatible with the shared extractor', async () => {
  expect(KNOWLEDGE_PARSED_EXTENSIONS).toHaveLength(11);
  expect(isParsed('DOCX')).toBe(true);
  expect(
    await workerExtractor()({
      bytes: readFileSync(new URL('./fixtures/sample.docx', import.meta.url)),
      ext: 'docx',
    }),
  ).toMatchObject({
    status: 'ready',
    markdown: expect.stringContaining('quokka docx marker'),
  });
});

it('keeps single-argument extractor injection and Knowledge-owned persisted text', async () => {
  const { createKnowledgeHarness } = await import('./harness.js');
  const h = await createKnowledgeHarness({
    extract: async (request) => ({
      status: 'ready',
      markdown: `## Custom\n\nInjected ${request.ext} content`,
    }),
  });
  try {
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    expect(h.knowledge.files.maxBytes).toBe(100 * 1024 * 1024);
    const file = await h.knowledge.files.upload(
      h.user('lead'),
      { scope: 'project', scopeId: 'p1' },
      new File(['fixture'], 'notes.txt'),
    );
    await h.knowledge.files.idle();
    const parsed = await h.knowledge.docs.get(h.user('lead'), file.id);
    expect(parsed.file?.parseStatus).toBe('ready');
    expect(parsed.content).toBe('## Custom\n\nInjected txt content');
    expect(
      await h.knowledge.docs.search(
        h.user('lead'),
        { scope: 'project', scopeId: 'p1' },
        'Injected',
      ),
    ).not.toHaveLength(0);
  } finally {
    await h.close();
  }
});

import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { createDocumentFixture } from './helpers/document-inputs.js';

let fixture: Awaited<ReturnType<typeof createDocumentFixture>> | undefined;
afterEach(async () => {
  await fixture?.close();
  fixture = undefined;
});

it.each(['text', 'only'] as const)(
  'extracts DOCX %s without passing embedded binary images as model text',
  async (mode) => {
    fixture = await createDocumentFixture();
    const bytes = readFileSync(
      new URL(`./fixtures/document-inputs/image-${mode}.docx`, import.meta.url),
    );
    const file = await fixture.h.services.chatAttachments.upload(
      'alice',
      new File([bytes], 'illustrated.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    );
    await fixture.agent.send(
      [{ role: 'user', content: 'Read this document.' }],
      {
        attachmentIds: [[file.id]],
      },
    );
    await fixture.settle();
    const rows = await fixture.rows();
    expect(rows.filter((row) => row.role === 'user')).toHaveLength(1);
    const original = rows[0].content.original;
    expect(original.parts.some((part) => part.type === 'file')).toBe(true);
    expect(JSON.stringify(original)).not.toContain('data:image/');
    if (mode === 'text') {
      expect(fixture.errors).toEqual([]);
      expect(fixture.prompts).toHaveLength(1);
      const user = fixture.prompts[0].filter(
        (message) => message.role === 'user',
      );
      expect(JSON.stringify(user)).toContain(
        'Quokka embedded image text marker',
      );
      expect(JSON.stringify(user)).not.toContain('data:image/');
      expect(JSON.stringify(rows)).not.toContain(
        'Quokka embedded image text marker',
      );
      expect(rows.at(-1)?.metadata.nativeOutcome).toBe('completed');
    } else {
      expect(fixture.prompts).toEqual([]);
      expect(fixture.errors).toHaveLength(1);
      expect(fixture.errors[0]).toMatchObject({
        message: expect.stringContaining('no readable text'),
      });
      expect(rows.at(-1)?.metadata.nativeOutcome).toBe('failed');
    }
  },
);

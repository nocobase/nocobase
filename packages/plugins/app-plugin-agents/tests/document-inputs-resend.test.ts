import { afterEach, expect, it, vi } from 'vitest';
import { createDocumentFixture } from './helpers/document-inputs.js';
import { ProtocolError } from '../server/kernel/errors.js';

let f: Awaited<ReturnType<typeof createDocumentFixture>> | undefined;
afterEach(async () => {
  await f?.close();
  f = undefined;
  vi.restoreAllMocks();
});

it('reprepares only the retained resend prefix and rolls back destructive admission when authorization fails', async () => {
  f = await createDocumentFixture();
  const own = await f.upload(
    'retained.txt',
    'text/plain',
    Buffer.from('retained-document-body'),
  );
  const tail = await f.upload(
    'suffix.txt',
    'text/plain',
    Buffer.from('discarded-document-body'),
  );
  await f.agent.send([{ role: 'user', content: 'first' }], {
    attachmentIds: [[own.id]],
  });
  await f.settle();
  const target = (await f.agent.history())[0];
  await f.agent.send([{ role: 'user', content: 'later' }], {
    attachmentIds: [[tail.id]],
  });
  await f.settle();
  const content = f.h.services.chatAttachments.content;
  const reads = vi
    .spyOn(f.h.services.chatAttachments, 'content')
    .mockImplementation(async (actor, id, conn) => {
      if (id === tail.id) throw new Error('Discarded suffix must not be read.');
      return content(actor, id, conn);
    });
  const parses = f.extracts.mock.calls.length;
  await f.agent.resend({ messageId: target.id, input: { text: 'edited' } });
  await f.settle();
  expect(reads).toHaveBeenCalledOnce();
  expect(reads.mock.calls[0][1]).toBe(own.id);
  expect(reads.mock.calls[0][2]).toBeDefined();
  expect(f.extracts).toHaveBeenCalledTimes(parses);
  const prompt = JSON.stringify(f.prompts.at(-1));
  expect(prompt).toContain('retained-document-body');
  expect(prompt).not.toContain('discarded-document-body');
  expect(prompt).not.toContain('suffix.txt');
  const retained = await f.agent.history();
  expect(retained).toHaveLength(2);
  expect(retained[0].id).toBe(target.id);
  expect(retained[0].parts).toContainEqual({ type: 'text', text: 'edited' });
  expect(JSON.stringify(retained)).not.toContain('retained-document-body');
  expect(JSON.stringify(await f.rows())).not.toContain(
    'retained-document-body',
  );
  reads.mockRejectedValueOnce(
    new ProtocolError('NOT_FOUND', 'Attachment not found.'),
  );
  await expect(
    f.agent.resend({ messageId: target.id, input: { text: 'denied edit' } }),
  ).rejects.toThrow('Attachment not found.');
  expect(await f.agent.history()).toEqual(retained);
});

it('keeps unsupported attachments nonfatal during edit/regeneration without forwarding originals', async () => {
  f = await createDocumentFixture();
  const file = await f.upload(
    'archive.zip',
    'application/zip',
    Buffer.from('private-archive-bytes'),
  );
  await f.agent.send([{ role: 'user', content: 'Explain what is readable.' }], {
    attachmentIds: [[file.id]],
  });
  await f.settle();
  const original = (await f.agent.history())[0];
  await f.agent.resend({
    messageId: original.id,
    input: { text: 'Continue without guessing.' },
  });
  await f.settle();
  expect(f.prompts).toHaveLength(2);
  expect(JSON.stringify(f.prompts.at(-1))).toContain('Attachment not parsed');
  expect(JSON.stringify(f.prompts.at(-1))).toContain('archive.zip');
  expect(JSON.stringify(f.prompts.at(-1))).not.toContain(
    'private-archive-bytes',
  );
  expect(f.extracts).not.toHaveBeenCalled();
  expect(
    (await f.agent.history())[0].parts.some((part) => part.type === 'file'),
  ).toBe(true);
  expect(f.errors).toEqual([]);
});

import type { NativeUIChunk } from '../server/online/agent/types.js';
import { afterEach, expect, it } from 'vitest';
import {
  fileInputFailureTitles,
  type FileInputFailureReason,
} from '../shared/file-input-failures.js';
import { FileInputError } from '../server/online/files/errors.js';
import { FileInputBudget } from '../server/online/files/input.js';
import { createDocumentFixture } from './helpers/document-inputs.js';

let fixture: Awaited<ReturnType<typeof createDocumentFixture>> | undefined;
afterEach(async () => {
  await fixture?.close();
  fixture = undefined;
});
const secret = 'private-provider-key/private-document-text';

it.each([
  'unreadable',
  'documentTooLarge',
  'extractionTimeout',
  'extractionFailed',
  'preparationFailed',
] as const)(
  'persists safe actionable %s guidance in canonical and public history',
  async (reason) => {
    fixture = await createDocumentFixture({
      extract: async () => {
        if (reason === 'preparationFailed') throw new Error(secret);
        if (reason === 'unreadable')
          return { status: 'ready', markdown: '', hasText: false };
        return {
          status: 'failed',
          error: secret,
          code:
            reason === 'documentTooLarge'
              ? 'too-large'
              : reason === 'extractionTimeout'
                ? 'timeout'
                : 'invalid-document',
        };
      },
    });
    const file = await fixture.upload();
    await fixture.agent.send(
      [{ role: 'user', content: 'Read this attachment.' }],
      { attachmentIds: [[file.id]] },
    );
    await fixture.settle();
    const history = await fixture.agent.history();
    const notice = history
      .at(-1)
      ?.parts.find((part) => part.type === 'data-notice');
    expect(notice).toMatchObject({
      id: 'execution-status',
      data: {
        type: 'failed',
        title: fileInputFailureTitles[reason],
        params: { fileInputReason: reason },
      },
    });
    const rows = await fixture.rows();
    expect(rows.filter((row) => row.role === 'user')).toHaveLength(1);
    expect(rows.at(-1)?.metadata.nativeOutcome).toBe('failed');
    expect(JSON.stringify(rows.at(-1)?.content)).toContain(reason);
    expect(JSON.stringify(rows)).not.toContain(secret);
    expect(JSON.stringify(history)).not.toContain(secret);
    expect(fixture.prompts).toEqual([]);
    expect(fixture.extracts).toHaveBeenCalledOnce();
  },
);

it('keeps Stop as cancellation rather than a preparation failure', async () => {
  const entered = Promise.withResolvers<void>();
  fixture = await createDocumentFixture({
    extract: async (_request, options) => {
      entered.resolve();
      return new Promise((resolve) => {
        options?.signal?.addEventListener(
          'abort',
          () => resolve({ status: 'failed', code: 'aborted', error: secret }),
          { once: true },
        );
      });
    },
  });
  const file = await fixture.upload();
  const sent = fixture.agent.send([{ role: 'user', content: 'Read' }], {
    attachmentIds: [[file.id]],
  });
  await entered.promise;
  await fixture.agent.abort();
  await sent;
  await fixture.settle();
  const history = await fixture.agent.history();
  const notice = history
    .at(-1)
    ?.parts.find((part) => part.type === 'data-notice');
  expect(notice).toMatchObject({
    data: { type: 'cancelled', title: 'Stopped' },
  });
  if (notice?.type === 'data-notice')
    expect(notice.data.params).toBeUndefined();
  expect(fixture.prompts).toEqual([]);
});

it('does not classify a later Provider failure as file preparation or expose its message', async () => {
  fixture = await createDocumentFixture({
    stream: async () => {
      throw new Error(secret);
    },
  });
  const file = await fixture.upload();
  await fixture.agent.send([{ role: 'user', content: 'Read' }], {
    attachmentIds: [[file.id]],
  });
  await fixture.settle();
  const history = await fixture.agent.history();
  const notice = history
    .at(-1)
    ?.parts.find((part) => part.type === 'data-notice');
  expect(notice).toMatchObject({
    data: { type: 'failed', title: 'Interrupted' },
  });
  if (notice?.type === 'data-notice')
    expect(notice.data.params).toBeUndefined();
  expect(JSON.stringify(history)).not.toContain(secret);
});

it.each([
  ['fileCount', () => new FileInputBudget(101, 100)],
  ['nativeFileCount', () => new FileInputBudget(1, 0).native()],
  [
    'inputTooLarge',
    () => new FileInputBudget(1, 100).source('fixture', 64 * 1024 * 1024 + 1),
  ],
  [
    'documentTooLarge',
    () => new FileInputBudget(1, 100).document('x'.repeat(100_001)),
  ],
  [
    'contextTooLarge',
    () => new FileInputBudget(1, 100).context('x'.repeat(200_001)),
  ],
] satisfies readonly [FileInputFailureReason, () => unknown][])(
  'retains the budget while classifying %s',
  (reason, run) => {
    expect(run).toThrow(FileInputError);
    expect(run).toThrow(expect.objectContaining({ fileInputReason: reason }));
  },
);

it('streams the same safe failure reason that history persists', async () => {
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  fixture = await createDocumentFixture({
    extract: async () => {
      entered.resolve();
      await release.promise;
      return { status: 'failed', code: 'timeout', error: secret };
    },
  });
  const file = await fixture.upload();
  const sent = fixture.agent.send([{ role: 'user', content: 'Read' }], {
    attachmentIds: [[file.id]],
  });
  await entered.promise;
  const stream = await fixture.agent.receive();
  if (!stream) throw new Error('Missing active response stream.');
  const chunks: NativeUIChunk[] = [];
  const reading = (async () => {
    const reader = stream.getReader();
    try {
      for (;;) {
        const result = await reader.read();
        if (result.done) break;
        chunks.push(result.value);
      }
    } finally {
      reader.releaseLock();
    }
  })();
  release.resolve();
  await sent;
  await reading;
  await fixture.settle();
  const history = await fixture.agent.history();
  const notice = history
    .at(-1)
    ?.parts.find((part) => part.type === 'data-notice');
  expect(chunks).toContainEqual(
    expect.objectContaining({
      type: 'data-notice',
      data: {
        type: 'failed',
        title: fileInputFailureTitles.extractionTimeout,
        params: { fileInputReason: 'extractionTimeout' },
      },
    }),
  );
  expect(notice).toMatchObject(
    chunks.find((chunk) => chunk.type === 'data-notice')!,
  );
  expect(JSON.stringify(chunks)).not.toContain(secret);
});

import { expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import type { TextExtractor } from '@nocobase/document-extractor';
import { ExtractedDocumentCache } from '../server/online/files/cache.js';
import {
  FileInputBudget,
  inlineBytes,
  localExtension,
  readBytes,
} from '../server/online/files/input.js';
import { NativeFileInputs } from '../server/online/files/service.js';
import type { ExecutionSnapshot } from '../server/online/files/types.js';
import { documentConnection, documentRef } from './helpers/document-inputs.js';

function snapshot(
  text = 'source',
  copies = 1,
  filename = 'notes.txt',
  mediaType = 'text/plain',
): ExecutionSnapshot {
  const message: ExecutionSnapshot['replay'][number] = {
    id: 'message',
    role: 'user',
    parts: Array.from({ length: copies }, () => ({
      type: 'file',
      filename,
      mediaType,
      url: `data:${mediaType};base64,${Buffer.from(text).toString('base64')}`,
    })),
  };
  return {
    original: [structuredClone(message)],
    replay: [message],
    files: message.parts.map((_, partIndex) => ({
      messageId: message.id,
      partIndex,
    })),
  };
}
function fixture(extract: TextExtractor) {
  const inputs = new NativeFileInputs({
    connectionFor: async () => documentConnection,
    extract,
    createModel: () => new MockLanguageModelV4(),
  });
  return {
    inputs,
    async prepare(
      source = snapshot(),
      userId = 'alice',
      signal = new AbortController().signal,
    ) {
      return inputs.prepare({
        model: await inputs.model(documentRef, 'session'),
        snapshot: source,
        userId,
        sessionId: 'session',
        signal,
      });
    },
  };
}

it('A15: uses UTF-8 byte and entry bounded LRU, non-sliding TTL, replacement and expiry pruning', () => {
  let now = 0;
  const cache = new ExtractedDocumentCache({
    now: () => now,
    ttlMs: 10,
    maxEntries: 2,
    maxBytes: 8,
  });
  cache.set('a', '😀');
  cache.set('b', 'abcd');
  expect(cache.get('a')).toBe('😀');
  cache.set('c', 'c');
  expect(cache.get('b')).toBeUndefined();
  cache.set('a', '12345678');
  expect(cache.get('c')).toBeUndefined();
  cache.set('large', '123456789');
  expect(cache.get('large')).toBeUndefined();
  expect(cache.get('a')).toBe('12345678');
  now = 9;
  expect(cache.get('a')).toBe('12345678');
  now = 10;
  expect(cache.get('a')).toBeUndefined();
  cache.set('old', '12345678');
  now = 20;
  cache.set('new', 'abcdefgh');
  expect(cache.get('old')).toBeUndefined();
  expect(cache.get('new')).toBe('abcdefgh');
  const disabled = new ExtractedDocumentCache({ maxEntries: 0 });
  disabled.set('key', 'text');
  expect(disabled.get('key')).toBeUndefined();
});

it('A07/A15: reuses completed local results, deduplicates one execution and isolates bytes/users/instances/extractors', async () => {
  const parse = vi.fn<TextExtractor>(async () => ({
    status: 'ready',
    markdown: 'parsed',
  }));
  const f = fixture(parse);
  const original = snapshot();
  await f.prepare(original);
  await f.prepare(snapshot('source', 2));
  expect(parse).toHaveBeenCalledTimes(1);
  expect(original.replay[0].parts[0].type).toBe('file');
  await f.prepare(snapshot('changed'));
  await f.prepare(snapshot(), 'bob');
  await f.prepare(snapshot('source', 1, 'renamed.txt'));
  expect(parse).toHaveBeenCalledTimes(4);
  await fixture(parse).prepare();
  expect(parse).toHaveBeenCalledTimes(5);
  const other = vi.fn<TextExtractor>(async () => ({
    status: 'ready',
    markdown: 'other parser',
  }));
  expect(JSON.stringify(await fixture(other).prepare())).toContain(
    'other parser',
  );
  expect(other).toHaveBeenCalledTimes(1);
});

it('A15: never caches failed, empty nonzero or cancelled extraction', async () => {
  const parse = vi
    .fn<TextExtractor>()
    .mockResolvedValueOnce({
      status: 'failed',
      error: 'fixture',
      code: 'timeout',
    })
    .mockResolvedValueOnce({ status: 'ready', markdown: '   ' })
    .mockResolvedValue({ status: 'ready', markdown: 'recovered' });
  const f = fixture(parse);
  await expect(f.prepare()).rejects.toThrow('timed out');
  await expect(f.prepare()).rejects.toThrow('no readable text');
  await f.prepare();
  await f.prepare();
  expect(parse).toHaveBeenCalledTimes(3);
  const controller = new AbortController();
  const aborted = vi
    .fn<TextExtractor>()
    .mockImplementationOnce(async () => {
      controller.abort();
      return { status: 'ready', markdown: 'too late' };
    })
    .mockResolvedValue({
      status: 'ready',
      markdown: 'fresh after cancellation',
    });
  const cancelled = fixture(aborted);
  await expect(
    cancelled.prepare(snapshot(), 'alice', controller.signal),
  ).rejects.toThrow();
  expect(JSON.stringify(await cancelled.prepare())).toContain(
    'fresh after cancellation',
  );
  expect(aborted).toHaveBeenCalledTimes(2);
});

it('A08/A15: independent executions never share a cancellable in-flight Promise', async () => {
  const started = Promise.withResolvers<void>();
  const secondStarted = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let calls = 0;
  const parse = vi.fn<TextExtractor>(async (_request, options) => {
    if (++calls === 1) {
      started.resolve();
      await new Promise<void>((resolve) =>
        options!.signal!.addEventListener('abort', () => resolve(), {
          once: true,
        }),
      );
      return { status: 'failed', error: 'cancelled', code: 'aborted' };
    }
    secondStarted.resolve();
    await release.promise;
    return { status: 'ready', markdown: 'second survived' };
  });
  const f = fixture(parse);
  const abort = new AbortController();
  const first = f.prepare(snapshot(), 'alice', abort.signal);
  const firstError = first.catch((error: unknown) => error);
  await started.promise;
  const second = f.prepare();
  await secondStarted.promise;
  abort.abort();
  expect(await firstError).toBeInstanceOf(Error);
  release.resolve();
  expect(JSON.stringify(await second)).toContain('second survived');
  await f.prepare();
  expect(parse).toHaveBeenCalledTimes(2);
});

it('A12: applies per-document and wrapped total budgets to fresh and cached text, counting Unicode code points', async () => {
  const parse = vi.fn<TextExtractor>(async () => ({
    status: 'ready',
    markdown: '😀'.repeat(99_900),
  }));
  const f = fixture(parse);
  await f.prepare();
  await expect(f.prepare(snapshot('source', 3))).rejects.toThrow(
    'conversation attachments exceed',
  );
  expect(parse).toHaveBeenCalledTimes(1);
  const oversized = vi.fn<TextExtractor>(async () => ({
    status: 'ready',
    markdown: 'x'.repeat(100_001),
  }));
  const invalid = fixture(oversized);
  await expect(invalid.prepare()).rejects.toThrow('extracted text budget');
  await expect(invalid.prepare()).rejects.toThrow('extracted text budget');
  expect(oversized).toHaveBeenCalledTimes(2);
  const empty = await f.prepare(snapshot(''));
  expect(JSON.stringify(empty)).toContain('(Empty file)');
  expect(parse).toHaveBeenCalledTimes(1);
});

it('A12: counts all native/reference inputs and distinct history bytes, not just extracted documents', () => {
  expect(() => new FileInputBudget(101, 100)).toThrow('100 file');
  const budget = new FileInputBudget(100, 1);
  budget.native();
  expect(() => budget.native()).toThrow('native file limit');
  budget.source('same', 64 * 1024 * 1024);
  budget.source('same', 64 * 1024 * 1024);
  expect(() => budget.source('new', 1)).toThrow('input byte budget');
});

it('A10/A11: rejects unknown binary names and conflicting formats rather than falling back to text', () => {
  expect(localExtension('no-extension', 'application/pdf')).toBe('pdf');
  expect(localExtension('README.MD', 'text/plain')).toBe('md');
  expect(localExtension('notes.txt', 'application/octet-stream')).toBe('txt');
  expect(() => localExtension('archive.txt', 'application/zip')).toThrow(
    'no local text extractor',
  );
  expect(() => localExtension('unknown.bin', 'text/plain')).toThrow(
    'no local text extractor',
  );
  expect(() => localExtension('report.docx', 'application/pdf')).toThrow(
    'different document formats',
  );
  expect(() =>
    inlineBytes('data:text/plain;base64,?invalid', 'text/plain'),
  ).toThrow();
  expect(() =>
    inlineBytes('data:application/pdf;base64,eA==', 'text/plain'),
  ).toThrow();
  expect(() => inlineBytes('data:text/plain;base64,A', 'text/plain')).toThrow();
});

it('A08/A12: actual stream limits cancel the source and Stop waits for stream cancellation', async () => {
  const cancelled = vi.fn();
  const megabyte = new Uint8Array(1024 * 1024);
  let chunks = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      chunks++;
      controller.enqueue(megabyte);
    },
    cancel: cancelled,
  });
  await expect(readBytes(body, new AbortController().signal)).rejects.toThrow(
    'byte budget',
  );
  expect(chunks).toBeLessThanOrEqual(22);
  expect(cancelled).toHaveBeenCalledOnce();
  expect(body.locked).toBe(false);
  const released = Promise.withResolvers<void>();
  const entered = Promise.withResolvers<void>();
  const abort = new AbortController();
  const blocked = new ReadableStream<Uint8Array>({
    cancel: () => {
      entered.resolve();
      return released.promise;
    },
  });
  let settled = false;
  const reading = readBytes(blocked, abort.signal).finally(() => {
    settled = true;
  });
  const rejected = reading.catch((error: unknown) => error);
  abort.abort();
  await entered.promise;
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(settled).toBe(false);
  released.resolve();
  expect(await rejected).toBeInstanceOf(Error);
  expect(blocked.locked).toBe(false);
});

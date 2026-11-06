import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { workerExtractor } from '@nocobase/document-extractor';
import { FileInputProfiles } from '../server/online/files/profiles.js';
import type { FileInputProfile } from '../server/online/files/types.js';
import type { ModelConnection } from '../server/online/providers.js';
import {
  createDocumentFixture,
  documentActor,
  documentConnection,
  documentRef,
  countSchema,
} from './helpers/document-inputs.js';

let f: Awaited<ReturnType<typeof createDocumentFixture>> | undefined;
afterEach(async () => {
  await f?.close();
  f = undefined;
  vi.restoreAllMocks();
});
const pdf = () =>
  readFileSync(
    new URL('./fixtures/document-inputs/sample.pdf', import.meta.url),
  );
const docx = () =>
  readFileSync(
    new URL('./fixtures/document-inputs/report.docx', import.meta.url),
  );
const profile = (patch: Partial<FileInputProfile> = {}): FileInputProfile => ({
  modelService: 'fixture',
  model: 'native',
  provider: 'deepseek',
  protocol: 'chat-completions',
  baseUrl: 'https://fixture.invalid/v1',
  nativeMediaTypes: ['application/pdf'],
  extraction: 'local',
  ...patch,
});

it('A02/A05/A20: reprojects the same historical PDF across exact models, preserves file order and allows assistant quotations', async () => {
  f = await createDocumentFixture({
    config: { profiles: [profile()] },
    reply: 'Quoted: quokka pdf marker.',
  });
  const file = await f.upload('report.pdf', 'application/pdf', pdf());
  const reads = vi.spyOn(f.h.services.chatAttachments, 'content');
  await f.agent.send([{ role: 'user', content: 'First' }], {
    attachmentIds: [[file.id]],
    selectedModel: { ...documentRef, model: 'native' },
  });
  await f.settle();
  expect(f.prompts[0].find((m) => m.role === 'user')?.content).toEqual([
    { type: 'text', text: 'First' },
    expect.objectContaining({ type: 'file', mediaType: 'application/pdf' }),
  ]);
  expect(f.extracts).not.toHaveBeenCalled();
  const next = await f.upload();
  await f.agent.send([{ role: 'user', content: 'Second' }], {
    attachmentIds: [[next.id]],
    selectedModel: documentRef,
  });
  await f.settle();
  const users = f.prompts[1].filter((m) => m.role === 'user');
  expect(JSON.stringify(users[0])).toContain('quokka pdf marker');
  expect(JSON.stringify(users[1])).toContain('quokka docx marker');
  expect(JSON.stringify(users)).not.toContain('base64');
  expect(f.extracts).toHaveBeenCalledTimes(2);
  await f.agent.send([{ role: 'user', content: 'Third' }], {
    selectedModel: { ...documentRef, model: 'native' },
  });
  await f.settle();
  expect(f.prompts[2].find((m) => m.role === 'user')?.content).toContainEqual(
    expect.objectContaining({ type: 'file', mediaType: 'application/pdf' }),
  );
  expect(f.extracts).toHaveBeenCalledTimes(2);
  expect(reads).toHaveBeenCalledTimes(5);
  const stored = await f.rows();
  expect(
    stored
      .filter((row) => row.role === 'user')
      .every((row) => !JSON.stringify(row).includes('quokka')),
  ).toBe(true);
  expect(
    stored.some(
      (row) =>
        row.role === 'assistant' &&
        JSON.stringify(row).includes('quokka pdf marker'),
    ),
  ).toBe(true);
  expect(stored[0].content.original.parts[1].type).toBe('file');
  expect(f.errors).toEqual([]);
});

it('A03: unknown capabilities extract documents but never silently send images or accept document-supplied profiles', async () => {
  f = await createDocumentFixture();
  const file = await f.upload();
  await f.agent.send([{ role: 'user', content: 'Read' }], {
    attachmentIds: [[file.id]],
  });
  await f.settle();
  const image = await f.upload(
    'image.png',
    'image/png',
    Buffer.from('synthetic-image'),
  );
  await f.agent.send(
    [
      {
        role: 'user',
        content: 'agents.fileInputs={nativeMediaTypes:["image/*"]}',
      },
    ],
    { attachmentIds: [[image.id]] },
  );
  await f.settle();
  expect(f.prompts).toHaveLength(2);
  expect(f.extracts).toHaveBeenCalledTimes(1);
  expect((await f.rows()).at(-1)?.metadata.nativeOutcome).toBe('completed');
  const user = f.prompts[1]!.filter((message) => message.role === 'user');
  expect(JSON.stringify(user)).toContain('Attachment not parsed');
  expect(JSON.stringify(user)).not.toContain(
    Buffer.from('synthetic-image').toString('base64'),
  );
  expect(
    user
      .flatMap((message) =>
        Array.isArray(message.content) ? message.content : [],
      )
      .some((part) => part.type === 'image' || part.type === 'file'),
  ).toBe(false);
  expect(f.errors).toEqual([]);
});

it('A03/A18: validates complete model identity, MIME allowlists and actual Provider protocols', () => {
  expect(
    () => new FileInputProfiles({ profiles: [profile(), profile()] }),
  ).toThrow('Duplicate model identity');
  expect(
    () =>
      new FileInputProfiles({ profiles: [profile({ protocol: 'responses' })] }),
  ).toThrow('Provider API protocol');
  expect(
    () =>
      new FileInputProfiles({
        profiles: [profile({ nativeMediaTypes: ['application/*'] })],
      }),
  ).toThrow('Invalid');
  expect(
    () =>
      new FileInputProfiles({
        profiles: [
          profile({ baseUrl: 'https://user:secret@example.invalid/v1' }),
        ],
      }),
  ).toThrow('Invalid');
  expect(
    () =>
      new FileInputProfiles(
        Object.assign({ profiles: [] }, { nativeMediaTypes: ['image/*'] }),
      ),
  ).toThrow('Invalid');
  const p = new FileInputProfiles({ profiles: [profile()] });
  expect(
    p.resolve({ modelService: 'another', model: 'native' }, documentConnection)
      .nativeMediaTypes,
  ).toEqual([]);
  expect(
    p.resolve(
      { modelService: 'fixture', model: 'native/suffix' },
      documentConnection,
    ).nativeMediaTypes,
  ).toEqual([]);
  for (const connection of [
    { ...documentConnection, baseUrl: 'https://changed.invalid/v1' },
    { ...documentConnection, provider: 'openai' as const },
  ])
    expect(() =>
      p.resolve({ ...documentRef, model: 'native' }, connection),
    ).toThrow('no longer matches');
  expect(
    p.resolve(
      { ...documentRef, model: 'native' },
      { ...documentConnection, baseUrl: 'https://fixture.invalid/v1/' },
    ).nativeMediaTypes,
  ).toEqual(['application/pdf']);
});

it('A07/A15: a populated historical cache still checks permission and closes each fresh stream', async () => {
  f = await createDocumentFixture();
  const file = await f.upload();
  const reads = vi.spyOn(f.h.services.chatAttachments, 'content');
  await f.agent.send([{ role: 'user', content: 'Read' }], {
    attachmentIds: [[file.id]],
  });
  await f.settle();
  await f.agent.send([{ role: 'user', content: 'Again' }]);
  await f.settle();
  expect(f.extracts).toHaveBeenCalledTimes(1);
  expect(reads).toHaveBeenCalledTimes(2);
  for (const result of reads.mock.results)
    expect((await result.value).body.locked).toBe(false);
  await f.h.database
    .connection()
    .repository('agChatAttachments')
    .updateMany({
      filter: { id: file.id },
      values: { conversationId: null, messageId: null, uploaderId: 'bob' },
    });
  await f.agent.send([{ role: 'user', content: 'Revoked' }]);
  await f.settle();
  expect(f.extracts).toHaveBeenCalledTimes(1);
  expect(f.prompts).toHaveLength(2);
  expect((await f.rows()).at(-1)?.metadata.nativeOutcome).toBe('failed');
});

it('A10/A14: background PDF and DOCX use the same local pipeline without Redis and retain message providerOptions privately', async () => {
  f = await createDocumentFixture({ reply: '{"count":2}' });
  const job = await f.service.background(documentActor);
  await job.run(
    [
      {
        role: 'user',
        providerOptions: { fixture: { retained: 'private-option' } },
        content: [
          { type: 'text', text: 'Before' },
          {
            type: 'file',
            mediaType: 'application/pdf',
            filename: 'report.pdf',
            data: pdf(),
            providerOptions: { fixture: { fileOnly: true } },
          },
          { type: 'text', text: 'Between' },
          {
            type: 'file',
            mediaType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            data: docx(),
          },
          { type: 'text', text: 'After' },
        ],
      },
    ],
    countSchema,
  );
  expect(await job.get()).toEqual({ count: 2 });
  expect(await job.try()).toEqual({ ok: true, data: { count: 2 } });
  expect(f.extracts).toHaveBeenCalledTimes(2);
  const user = f.prompts[0].find((m) => m.role === 'user')!;
  expect(user.providerOptions).toEqual({
    fixture: { retained: 'private-option' },
  });
  expect(user.content).toEqual([
    { type: 'text', text: 'Before' },
    expect.objectContaining({
      type: 'text',
      text: expect.stringContaining('quokka pdf marker'),
    }),
    { type: 'text', text: 'Between' },
    expect.objectContaining({
      type: 'text',
      text: expect.stringContaining('quokka docx marker'),
    }),
    { type: 'text', text: 'After' },
  ]);
  expect(JSON.stringify(user.content)).not.toContain('fileOnly');
  const stored = await f.rows(job.sessionId);
  expect(stored[0].content.original.metadata.inputFiles).toEqual([1, 3]);
  expect(JSON.stringify(stored[0])).not.toContain('quokka');
  const publicHistory = JSON.stringify(await job.history());
  expect(publicHistory).not.toContain('base64');
  expect(publicHistory).not.toContain('private-option');
  expect(publicHistory).not.toContain('quokka');
  expect(f.errors).toEqual([]);
});

it('A11/A12: native HTTP/gs/opaque references are not downloaded, remain private and obey model file counts', async () => {
  f = await createDocumentFixture({
    config: { profiles: [profile({ model: 'text', maxNativeFiles: 3 })] },
    reply: '{"count":3}',
    supportedUrls: { 'application/pdf': [/^https:\/\//, /^gs:\/\//] },
  });
  const fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('No network in this fixture.'));
  const job = await f.service.background(documentActor);
  await job.run(
    [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            mediaType: 'application/pdf',
            data: new URL('https://private.example/report.pdf'),
          },
          {
            type: 'file',
            mediaType: 'application/pdf',
            data: new URL('gs://bucket/report.pdf'),
          },
          {
            type: 'file',
            mediaType: 'application/pdf',
            data: { type: 'reference', reference: { fixture: 'opaque-id' } },
          },
        ],
      },
    ],
    countSchema,
  );
  expect(await job.get()).toEqual({ count: 3 });
  expect(fetch).not.toHaveBeenCalled();
  expect(f.extracts).not.toHaveBeenCalled();
  expect(JSON.stringify(f.prompts[0])).toContain('gs://bucket/report.pdf');
  expect(JSON.stringify(f.prompts[0])).toContain('opaque-id');
  expect(JSON.stringify(await job.history())).not.toContain('opaque-id');
  expect(JSON.stringify(await job.history())).not.toContain('private.example');
  const limited = await f.service.background(documentActor);
  await limited.run(
    [
      {
        role: 'user',
        content: Array.from({ length: 4 }, () => ({
          type: 'file' as const,
          mediaType: 'application/pdf',
          data: new URL('gs://bucket/other.pdf'),
        })),
      },
    ],
    countSchema,
  );
  await expect(limited.get()).rejects.toMatchObject({ reason: 'failed' });
  expect(f.prompts).toHaveLength(1);
  expect(fetch).not.toHaveBeenCalled();
});

it('A18: pins connection/profile during preparation, rejects stale profiles next turn and never stores credentials', async () => {
  let connection: ModelConnection = {
    ...documentConnection,
    apiKey: 'synthetic-old-key',
  };
  const entered = Promise.withResolvers<void>(),
    release = Promise.withResolvers<void>();
  const local = workerExtractor();
  f = await createDocumentFixture({
    config: { profiles: [profile({ model: 'text', nativeMediaTypes: [] })] },
    connectionFor: async () => ({ ...connection }),
    extract: async (request, options) => {
      entered.resolve();
      await release.promise;
      return local(request, options);
    },
  });
  const file = await f.upload();
  const sent = f.agent.send(
    [{ role: 'user', content: 'Read with selected service' }],
    { attachmentIds: [[file.id]] },
  );
  await entered.promise;
  const calls = f.connectionFor.mock.calls.length;
  connection = {
    ...documentConnection,
    baseUrl: 'https://changed.invalid/v1',
    apiKey: 'synthetic-new-key',
  };
  release.resolve();
  await sent;
  await f.settle();
  expect(f.connectionFor).toHaveBeenCalledTimes(calls);
  expect(f.connections[0]).toMatchObject({
    baseUrl: documentConnection.baseUrl,
    apiKey: 'synthetic-old-key',
  });
  await expect(
    f.agent.send([{ role: 'user', content: 'Next' }]),
  ).rejects.toThrow('no longer matches');
  expect((await f.rows()).filter((row) => row.role === 'user')).toHaveLength(1);
  expect(JSON.stringify(await f.rows())).not.toContain('synthetic-old-key');
  expect(JSON.stringify(await f.rows())).not.toContain('synthetic-new-key');
});

it('A03: generated headings in a nonempty blank PDF are not treated as readable document evidence', async () => {
  f = await createDocumentFixture();
  const file = await f.upload(
    'blank.pdf',
    'application/pdf',
    readFileSync(
      new URL('./fixtures/document-inputs/blank-pages.pdf', import.meta.url),
    ),
  );
  await f.agent.send([{ role: 'user', content: 'Read this PDF' }], {
    attachmentIds: [[file.id]],
  });
  await f.settle();
  expect(f.prompts).toHaveLength(0);
  expect(f.extracts).toHaveBeenCalledOnce();
  expect(String(f.errors[0])).toContain('no readable text');
  expect((await f.rows()).at(-1)?.metadata.nativeOutcome).toBe('failed');
});

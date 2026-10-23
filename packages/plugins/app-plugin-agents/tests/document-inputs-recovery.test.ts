import { Worker } from 'node:worker_threads';
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { isToolUIPart } from 'ai';
import { z } from 'zod';
import { workerExtractor } from '@nocobase/document-extractor';
import {
  createDocumentFixture,
  documentActor,
  documentReply,
  documentToolCall,
  countSchema,
} from './helpers/document-inputs.js';

let f: Awaited<ReturnType<typeof createDocumentFixture>> | undefined;
afterEach(async () => {
  await f?.close();
  f = undefined;
  vi.restoreAllMocks();
});

async function approvalFixture() {
  let step = 0;
  const business = vi.fn(async () => ({ done: true }));
  const confirm = vi.fn(async () => ({ confirmed: true }));
  f = await createDocumentFixture({
    initial: { tool: ['business', 'confirm'] },
    stream: async () =>
      step++ === 0
        ? documentToolCall('business', 'completed-business', true)
        : step === 2
          ? documentToolCall('confirm', 'pending-confirm')
          : documentReply('Approved or denied; original document retained.'),
    register(service) {
      service.configurator.registerTool('business', {
        version: 'fixture',
        definition: {
          inputSchema: z.object({}),
          execute: business,
          toModelOutput: async () => ({
            type: 'text',
            value: 'model-only-business-proof',
          }),
          public: { input: () => ({}), output: (value) => value },
        },
      });
      service.configurator.registerTool('confirm', {
        version: 'fixture',
        definition: {
          inputSchema: z.object({}),
          execute: confirm,
          needsApproval: true,
          public: { input: () => ({}), output: (value) => value },
        },
      });
    },
  });
  const file = await f.upload();
  const reads = vi.spyOn(f.h.services.chatAttachments, 'content');
  await f.agent.send(
    [{ role: 'user', content: 'Read the document, then confirm.' }],
    { attachmentIds: [[file.id]] },
  );
  const stream = await f.agent.receive();
  if (stream)
    for await (const _chunk of stream) {
      /* Drain through persisted approval. */
    }
  const waiting = (await f.agent.history()).at(-1)!;
  const tool = waiting.parts
    .filter(isToolUIPart)
    .find((part) => part.state === 'approval-requested')!;
  return {
    f,
    business,
    confirm,
    file,
    reads,
    input: {
      messageId: waiting.id,
      executionId: waiting.metadata!.executionId!,
      approval: { id: tool.approval!.id, approved: true },
    },
  };
}

it.each([true, false])(
  'A06/A14: approval=%s reauthorizes cached documents and preserves completed tools, private evidence and model outputs',
  async (approved) => {
    const a = await approvalFixture();
    expect(a.business).toHaveBeenCalledOnce();
    expect(a.confirm).not.toHaveBeenCalled();
    expect(a.f.extracts).toHaveBeenCalledOnce();
    expect(a.reads).toHaveBeenCalledOnce();
    await a.f.agent.approve({
      ...a.input,
      approval: { ...a.input.approval, approved },
    });
    await a.f.settle();
    expect(a.business).toHaveBeenCalledOnce();
    expect(a.confirm).toHaveBeenCalledTimes(approved ? 1 : 0);
    expect(a.reads).toHaveBeenCalledTimes(2);
    expect(a.f.extracts).toHaveBeenCalledOnce();
    expect(a.f.prompts).toHaveLength(3);
    const prompt = JSON.stringify(a.f.prompts.at(-1));
    expect(prompt).toContain('quokka docx marker');
    expect(prompt).toContain('completed-business');
    expect(prompt).toContain('model-only-business-proof');
    expect(prompt).toContain('private-document-thought');
    expect(prompt).toContain('private-document-signature');
    const rows = await a.f.rows();
    expect(rows.filter((row) => row.role === 'user')).toHaveLength(1);
    expect(JSON.stringify(rows[0])).not.toContain('quokka');
    expect(rows[0].content.original.parts[1].type).toBe('file');
    expect(JSON.stringify(rows)).toContain('private-document-signature');
    const publicHistory = JSON.stringify(await a.f.agent.history());
    expect(publicHistory).not.toContain('private-document-signature');
    // Reasoning text is public upstream; Provider signatures and document bodies remain private.
    expect(publicHistory).toContain('private-document-thought');
    expect(publicHistory).not.toContain('quokka');
    expect(a.f.errors).toEqual([]);
  },
);

it('A06/A07: removing an attachment before approval fails without repeating completed tools or using cached evidence', async () => {
  const a = await approvalFixture();
  await a.f.h.database
    .connection()
    .repository('agChatAttachments')
    .deleteMany({ filter: { id: a.file.id } });
  await a.f.agent.approve(a.input);
  await a.f.settle();
  expect(a.business).toHaveBeenCalledOnce();
  expect(a.confirm).not.toHaveBeenCalled();
  expect(a.f.extracts).toHaveBeenCalledOnce();
  expect(a.f.prompts).toHaveLength(2);
  const rows = await a.f.rows();
  expect(rows.at(-1)?.metadata.nativeOutcome).toBe('failed');
  expect(rows.filter((row) => row.role === 'user')).toHaveLength(1);
  expect(JSON.stringify(rows.at(-1)?.content.original)).toContain(
    'completed-business',
  );
});

it.each(['abort', 'shutdown'] as const)(
  'A08: %s waits for actual Worker termination and cleanup before releasing execution',
  async (operation) => {
    const started = Promise.withResolvers<void>(),
      terminated = Promise.withResolvers<void>(),
      release = Promise.withResolvers<void>();
    const originalTerminate = Worker.prototype.terminate;
    const terminate = vi
      .spyOn(Worker.prototype, 'terminate')
      .mockImplementation(async function (this: Worker) {
        const code = await originalTerminate.call(this);
        terminated.resolve();
        await release.promise;
        return code;
      });
    const local = workerExtractor();
    f = await createDocumentFixture({
      extract: (request, options) => {
        const pending = local(request, options);
        started.resolve();
        return pending;
      },
    });
    const file = await f.upload();
    const sending = f.agent.send(
      [{ role: 'user', content: 'Stop while parsing' }],
      { attachmentIds: [[file.id]] },
    );
    await started.promise;
    let finished = false;
    const stopping = (
      operation === 'abort' ? f.agent.abort() : f.service.shutdown()
    ).then(() => {
      finished = true;
    });
    await terminated.promise;
    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(finished).toBe(false);
      expect(await f.agent.status()).toBe('running');
      expect(f.prompts).toHaveLength(0);
    } finally {
      release.resolve();
    }
    await stopping;
    await sending;
    await f.settle();
    expect(terminate).toHaveBeenCalledOnce();
    expect((await f.rows()).at(-1)?.metadata.nativeOutcome).toBe('cancelled');
  },
);

it('A08/A09: a real Worker timeout fail accepted background get/try without Redis or resend', async () => {
  const terminate = vi.spyOn(Worker.prototype, 'terminate');
  f = await createDocumentFixture({
    extract: workerExtractor({ timeoutMs: 1 }),
    reply: '{"count":1}',
  });
  const job = await f.service.background(documentActor);
  await job.run(
    [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            mediaType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            data: readFileSync(
              new URL(
                './fixtures/document-inputs/report.docx',
                import.meta.url,
              ),
            ),
          },
        ],
      },
    ],
    countSchema,
  );
  await expect(job.get()).rejects.toMatchObject({ reason: 'failed' });
  expect(await job.try()).toMatchObject({ ok: false, reason: 'failed' });
  expect(await job.status()).toBe('idle');
  expect(terminate).toHaveBeenCalledOnce();
  expect(f.prompts).toHaveLength(0);
  expect(f.extracts).toHaveBeenCalledOnce();
  const rows = await f.rows(job.sessionId);
  expect(rows.filter((row) => row.role === 'user')).toHaveLength(1);
  expect(rows[0].searchText).toBe('');
  expect(rows[0].content.original.parts[0].type).toBe('file');
  expect((await job.history())[0].parts).toEqual([{ type: 'text', text: '' }]);
  expect(JSON.stringify(f.errors)).not.toContain('quokka');
});

it.each(['save', 'finish'] as const)(
  'A08: retryFinalization after %s failure retries only persistence after extraction/model/tool completion',
  async (phase) => {
    let step = 0;
    const business = vi.fn(async () => ({ done: true }));
    f = await createDocumentFixture({
      stream: async () =>
        step++ === 0
          ? documentToolCall('business', 'once')
          : documentReply('{"count":1}'),
      register(service) {
        service.configurator.registerTool('business', {
          version: 'fixture',
          definition: { inputSchema: z.object({}), execute: business },
        });
      },
    });
    const job = await f.service.background(documentActor, {
      tool: ['business'],
    });
    if (phase === 'save')
      vi.spyOn(f.sessions.native, 'save').mockRejectedValueOnce(
        new Error('Finalization pending'),
      );
    else
      vi.spyOn(f.sessions, 'finish').mockRejectedValueOnce(
        new Error('Finalization pending'),
      );
    await job.run(
      [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              mediaType:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              data: readFileSync(
                new URL(
                  './fixtures/document-inputs/report.docx',
                  import.meta.url,
                ),
              ),
            },
          ],
        },
      ],
      countSchema,
    );
    await vi.waitFor(() => expect(f!.errors).toHaveLength(1));
    expect(await job.status()).toBe('running');
    const parses = f.extracts.mock.calls.length,
      models = f.prompts.length;
    await expect(
      job.run([{ role: 'user', content: 'Too early' }], countSchema),
    ).rejects.toThrow('busy');
    await job.retryFinalization();
    await f.settle(job);
    expect(await job.get()).toEqual({ count: 1 });
    expect(f.extracts).toHaveBeenCalledTimes(parses);
    expect(parses).toBe(1);
    expect(f.prompts).toHaveLength(models);
    expect(models).toBe(2);
    expect(business).toHaveBeenCalledOnce();
    expect((await f.rows(job.sessionId)).at(-1)?.metadata.nativeOutcome).toBe(
      'completed',
    );
  },
);

it('A09: malformed inline DOCX fails get/try after one durable private user message', async () => {
  f = await createDocumentFixture();
  const job = await f.service.background(documentActor);
  await job.run(
    [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            filename: 'broken.docx',
            mediaType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            data: Buffer.from('not a docx'),
          },
        ],
      },
    ],
    countSchema,
  );
  await expect(job.get()).rejects.toMatchObject({ reason: 'failed' });
  expect(await job.try()).toMatchObject({ ok: false, reason: 'failed' });
  expect(await job.status()).toBe('idle');
  expect(f.prompts).toHaveLength(0);
  expect(f.extracts).toHaveBeenCalledOnce();
  const rows = await f.rows(job.sessionId);
  expect(rows.filter((row) => row.role === 'user')).toHaveLength(1);
  expect(rows[0].searchText).toBe('');
  expect(rows.at(-1)?.metadata.nativeOutcome).toBe('failed');
});

it('A08/A09: aborting background document preparation reports cancelled through get/try', async () => {
  const entered = Promise.withResolvers<void>();
  const local = workerExtractor();
  f = await createDocumentFixture({
    extract: (request, options) => {
      const task = local(request, options);
      entered.resolve();
      return task;
    },
  });
  const job = await f.service.background(documentActor);
  const running = job.run(
    [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            mediaType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            data: readFileSync(
              new URL(
                './fixtures/document-inputs/report.docx',
                import.meta.url,
              ),
            ),
          },
        ],
      },
    ],
    countSchema,
  );
  await entered.promise;
  await job.abort();
  await running;
  await expect(job.get()).rejects.toMatchObject({ reason: 'cancelled' });
  expect(await job.try()).toMatchObject({ ok: false, reason: 'cancelled' });
  expect(await job.status()).toBe('idle');
  expect(f.prompts).toHaveLength(0);
  expect(
    (await f.rows(job.sessionId)).filter((row) => row.role === 'user'),
  ).toHaveLength(1);
});

it('A12: actual native streams enforce the shared 64 MiB history budget even when stored sizes are small', async () => {
  f = await createDocumentFixture({
    config: {
      profiles: [
        {
          modelService: 'fixture',
          model: 'text',
          provider: 'deepseek',
          protocol: 'chat-completions',
          baseUrl: 'https://fixture.invalid/v1',
          nativeMediaTypes: ['application/pdf'],
          extraction: 'local',
        },
      ],
    },
  });
  const files = await Promise.all(
    Array.from({ length: 4 }, (_, i) =>
      f!.upload(
        `report-${i}.pdf`,
        'application/pdf',
        readFileSync(
          new URL('./fixtures/document-inputs/sample.pdf', import.meta.url),
        ),
      ),
    ),
  );
  const original = f.h.services.chatAttachments.content.bind(
    f.h.services.chatAttachments,
  );
  let active = 0,
    maximum = 0;
  const bodies: ReadableStream<Uint8Array>[] = [];
  const reads = vi
    .spyOn(f.h.services.chatAttachments, 'content')
    .mockImplementation(async (...args) => {
      const content = await original(...args);
      await content.body.cancel();
      let count = 0;
      const chunk = new Uint8Array(1024 * 1024);
      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (!count) maximum = Math.max(maximum, ++active);
          controller.enqueue(chunk);
          if (++count === 17) {
            active--;
            controller.close();
          }
        },
      });
      bodies.push(body);
      return { ...content, body };
    });
  await f.agent.send([{ role: 'user', content: 'First document' }], {
    attachmentIds: [[files[0].id]],
  });
  await f.settle();
  await f.agent.send([{ role: 'user', content: 'History must count too' }], {
    attachmentIds: [files.slice(1).map((file) => file.id)],
  });
  await f.settle();
  expect(reads).toHaveBeenCalledTimes(5);
  expect(maximum).toBe(1);
  expect(active).toBe(0);
  expect(bodies.every((body) => !body.locked)).toBe(true);
  expect(f.prompts).toHaveLength(1);
  expect(f.extracts).not.toHaveBeenCalled();
  expect((await f.rows()).at(-1)?.metadata.nativeOutcome).toBe('failed');
});

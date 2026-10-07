/**
 * Files people send with chat messages: uploading, sending them with a message, who may read them (the owner, a run
 * on the conversation by its token, nobody else), what the agent is told, the images an online agent's model is shown,
 * and the purge of uploads never sent.
 */
import { MockLanguageModelV4 } from 'ai/test';
import { afterEach, describe, expect, it } from 'vitest';

import { createServerExecutor } from '../server/online/index.js';
import { scriptedSteps } from '../server/online/scripted.js';
import { CHAT_ATTACHMENT_SIZE_MAX } from '../shared/conversations.js';
import { claim, createHarness, type Harness } from './harness.js';

const ALICE = 'alice';
const BOB = 'bob';
const base = '/agents/conversations';

/** A 1×1 PNG. */
const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  ),
);

describe('chat attachments', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  async function upload(
    user: string,
    name: string,
    body: BlobPart = 'hello',
    type = 'text/plain',
  ) {
    const form = new FormData();
    form.set('file', new File([body], name, { type }));
    return h.request('POST', '/agents/chatAttachments', { user, form });
  }

  async function uploaded(
    user: string,
    name: string,
    body?: BlobPart,
    type?: string,
  ) {
    const response = await upload(user, name, body, type);
    expect(response.status).toBe(201);
    return response.body.data as { id: string; contentUrl: string };
  }

  async function conversation(agentId: string, user = ALICE) {
    const created = await h.request('POST', base, {
      user,
      body: { agentId },
    });
    expect(created.status).toBe(201);
    return created.body.data.id as string;
  }

  const content = (
    id: string,
    options: { user?: string; runToken?: string; download?: boolean } = {},
  ) =>
    h.request(
      'GET',
      `/agents/chatAttachments/${id}/content${options.download ? '?download=true' : ''}`,
      {
        ...(options.user ? { user: options.user } : {}),
        ...(options.runToken ? { runToken: options.runToken } : {}),
      },
    );

  it('keeps an upload its uploader’s until it is sent, and refuses one too large', async () => {
    h = await createHarness();
    const file = await uploaded(ALICE, 'notes.txt');
    expect(file).toMatchObject({
      filename: 'notes.txt',
      ext: 'txt',
      mimeType: 'text/plain',
      size: 5,
      previewable: false,
      contentUrl: `/main/api/agents/chatAttachments/${file.id}/content`,
      downloadUrl: `/main/api/agents/chatAttachments/${file.id}/content?download=true`,
    });

    const own = await content(file.id, { user: ALICE });
    expect(own.status).toBe(200);
    expect(own.body).toBe('hello');
    expect(own.headers.get('content-disposition')).toContain(
      'attachment; filename="notes.txt"',
    );
    expect(own.headers.get('x-content-type-options')).toBe('nosniff');
    expect((await content(file.id, { user: BOB })).status).toBe(404);
    expect((await content('not-a-file', { user: ALICE })).status).toBe(404);

    // Only its uploader discards it.
    expect(
      (
        await h.request('DELETE', `/agents/chatAttachments/${file.id}`, {
          user: BOB,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('DELETE', `/agents/chatAttachments/${file.id}`, {
          user: ALICE,
        })
      ).status,
    ).toBe(204);
    expect((await content(file.id, { user: ALICE })).status).toBe(404);
    expect(h.chatFiles.removed).toHaveLength(1);

    const large = await upload(
      ALICE,
      'large.bin',
      new Uint8Array(CHAT_ATTACHMENT_SIZE_MAX + 1),
      'application/octet-stream',
    );
    expect(large.status).toBe(413);
    expect(large.body.error.reason).toBe('UPLOAD_TOO_LARGE');
    expect((await upload(ALICE, '')).status).toBe(400);
  });

  it('sends files with a message, shows them to the owner only, and refuses ids that are not the sender’s uploads', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const id = await conversation(agentId);
    const image = await uploaded(ALICE, 'screen.png', PNG, 'image/png');
    const log = await uploaded(ALICE, 'build.log', 'failed at step 3');

    const sent = await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: '', attachmentIds: [image.id, log.id] },
    });
    expect(sent.status).toBe(201);
    expect(sent.body.data.message.attachments).toEqual([
      expect.objectContaining({
        id: image.id,
        filename: 'screen.png',
        previewable: true,
      }),
      expect.objectContaining({
        id: log.id,
        filename: 'build.log',
        previewable: false,
      }),
    ]);
    // Reopened, the message still has them.
    const listed = await h.request('GET', `${base}/${id}/messages`, {
      user: ALICE,
    });
    expect(
      listed.body.data[0].attachments.map((file: { id: string }) => file.id),
    ).toEqual([image.id, log.id]);

    const inline = await content(image.id, { user: ALICE });
    expect(inline.status).toBe(200);
    expect(inline.headers.get('content-type')).toBe('image/png');
    expect(inline.headers.get('content-disposition')).toContain('inline;');
    expect(
      (await content(image.id, { user: ALICE, download: true })).headers.get(
        'content-disposition',
      ),
    ).toContain('attachment;');
    expect((await content(image.id, { user: BOB })).status).toBe(404);
    // Sent, it is no longer an upload to discard.
    expect(
      (
        await h.request('DELETE', `/agents/chatAttachments/${log.id}`, {
          user: ALICE,
        })
      ).status,
    ).toBe(404);

    // Sent once only, the sender's own, and only with something to send.
    const again = await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: 'Again', attachmentIds: [log.id] },
    });
    expect(again.status).toBe(400);
    const bobs = await uploaded(BOB, 'bob.txt');
    const foreign = await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: 'Mine?', attachmentIds: [bobs.id] },
    });
    expect(foreign.status).toBe(400);
    expect(foreign.body.error.metadata).toMatchObject({ fileId: bobs.id });
    expect(
      (
        await h.request('POST', `${base}/${id}/messages`, {
          user: ALICE,
          body: { content: '  ' },
        })
      ).status,
    ).toBe(400);
    // A refused message sends nothing: Bob's upload is still his.
    expect((await content(bobs.id, { user: BOB })).status).toBe(200);
    // Someone else's conversation is not theirs to post files in.
    const mine = await uploaded(BOB, 'mine.txt');
    const intrude = await h.request('POST', `${base}/${id}/messages`, {
      user: BOB,
      body: { content: 'Hi', attachmentIds: [mine.id] },
    });
    expect(intrude.status).toBe(404);
  });

  it('lists the files for the agent and lets its run on the conversation download them', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runner = await h.registerRunner();
    const id = await conversation(agentId);
    const log = await uploaded(ALICE, 'build.log', 'failed at step 3');
    const unsent = await uploaded(ALICE, 'later.txt');
    await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: 'Why did it fail?', attachmentIds: [log.id] },
    });

    const [payload] = await claim(h, runner);
    expect(payload.inputs[0].text).toContain(
      `Attached files (1):\n- build.log (text/plain, 16 bytes) [${log.id}]`,
    );
    expect(payload.prompt.system).toContain(
      '`acme conversation attachment download <file-id>`',
    );
    const runToken = payload.cli.credential.content.token as string;
    const downloaded = await content(log.id, { runToken });
    expect(downloaded.status).toBe(200);
    expect(downloaded.body).toBe('failed at step 3');
    // Not an upload its person has not sent.
    expect((await content(unsent.id, { runToken })).status).toBe(404);

    // A run on anything else reads no conversation's files, even its own person's.
    await h.enqueue(agentId, '9', { actorUserId: ALICE });
    const [other] = await claim(h, runner);
    expect(
      (
        await content(log.id, {
          runToken: other.cli.credential.content.token as string,
        })
      ).status,
    ).toBe(404);
  });

  it('quotes the files of earlier messages when a run starts a fresh session', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const id = await conversation(agentId);
    const log = await uploaded(ALICE, 'build.log');
    const first = await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: 'Look at this.', attachmentIds: [log.id] },
    });
    expect(first.status).toBe(201);
    await h.services.conversations.stop(ALICE, id);
    await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: 'And now?' },
    });
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.prompt.system).toContain('Earlier in this conversation');
    expect(payload.prompt.system).toContain(
      `- build.log (text/plain, 5 bytes) [${log.id}]`,
    );
  });

  it('shows an online agent’s model the images sent with the message', async () => {
    h = await createHarness();
    await h.services.online.services.create({
      title: 'Mock',
      provider: 'openai-compatible',
      baseUrl: 'http://127.0.0.1:9/v1',
      models: [{ value: 'm1', label: 'Model one' }],
    });
    const prompts: unknown[] = [];
    const port = scriptedSteps([
      async function* () {
        yield { type: 'text', delta: 'A red dot.' };
        yield {
          type: 'finish',
          reason: 'stop',
          model: 'm1',
          usage: { inputTokens: 10, outputTokens: 3 },
        };
      },
    ]);
    const executor = createServerExecutor(
      {
        clock: h.services.clock,
        claims: h.services.claims,
        reports: h.services.reports,
        runs: h.services.runs,
        conversations: h.services.conversations,
        commands: () => Promise.resolve(undefined),
        skill: () => Promise.reject(new Error('No skills here.')),
        images: (conversationId, ids, maxBytes) =>
          h.services.chatAttachments.images(conversationId, ids, maxBytes),
        gateway: {
          async languageModel(ref) {
            const inner = (await port.languageModel(
              ref,
            )) as MockLanguageModelV4;
            return new MockLanguageModelV4({
              modelId: ref.model,
              doStream: (options) => {
                prompts.push(options.prompt);
                return inner.doStream(options);
              },
            });
          },
        },
        signal: h.services.runners.signal,
      },
      { holderId: 'server:test' },
    );
    const agentId = await h.createAgent({
      name: 'Eye',
      type: 'online',
      modelEntries: [{ modelService: 'mock', model: 'm1' }],
    });
    const id = await conversation(agentId);
    const image = await uploaded(ALICE, 'dot.png', PNG, 'image/png');
    const log = await uploaded(ALICE, 'build.log');
    await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: 'What is this?', attachmentIds: [image.id, log.id] },
    });

    expect(await executor.drain()).toBe(1);
    const [prompt] = prompts as { role: string; content: unknown }[][];
    const user = prompt!.find((message) => message.role === 'user')!;
    const parts = user.content as {
      type: string;
      mediaType?: string;
      text?: string;
    }[];
    expect(parts.filter((part) => part.type === 'file')).toEqual([
      expect.objectContaining({ mediaType: 'image/png' }),
    ]);
    const text = parts.find((part) => part.type === 'text')?.text ?? '';
    expect(text).toContain(
      `- dot.png (image/png, ${PNG.length} bytes) [${image.id}]`,
    );
    expect(text).toContain(`- build.log (text/plain, 5 bytes) [${log.id}]`);
    const system = prompt!.find((message) => message.role === 'system');
    expect(JSON.stringify(system)).toContain(
      'The images among them are shown to you',
    );
  });

  it('purges uploads never sent after a day, and keeps the sent ones', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const id = await conversation(agentId);
    const sent = await uploaded(ALICE, 'sent.txt');
    const unsent = await uploaded(ALICE, 'unsent.txt');
    await h.request('POST', `${base}/${id}/messages`, {
      user: ALICE,
      body: { content: 'Here', attachmentIds: [sent.id] },
    });
    expect(await h.services.chatAttachments.purge()).toBe(0);
    h.clock.advance(25 * 60 * 60 * 1000);
    expect(await h.services.chatAttachments.purge(h.clock.now())).toBe(1);
    expect((await content(unsent.id, { user: ALICE })).status).toBe(404);
    expect((await content(sent.id, { user: ALICE })).status).toBe(200);
  });
});

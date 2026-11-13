/**
 * Files people send with chat messages: uploading, sending them with a message, who may read them (the owner, a run
 * on the conversation by its token, nobody else), what the agent is told, and the purge of uploads never sent.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { claim, createHarness, type Harness } from './harness.js';

const ALICE = 'alice';
const BOB = 'bob';

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
    return h.request('POST', '/agents/chatAttachments', {
      user,
      form,
    });
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
    return (await h.services.conversations.create(user, { agentId })).id;
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

  it('reads an existing attachment using its stored disk, not the current upload disk', async () => {
    h = await createHarness();
    const attachment = await h.services.chatAttachments.upload(
      ALICE,
      new File(['old disk'], 'old.txt'),
    );
    const limitForDisk = vi.fn(() => ({
      maxFileSizeMb: 50,
    }));
    const { service } = createChatAttachments({
      tx: h.services.tx,
      basePath: () => '/main',
      limitForDisk,
      storage: {
        store: async () => {
          throw new Error('Not uploading');
        },
        stream: async () => new Blob(['old disk']).stream(),
        bytes: async () => new Uint8Array(),
        remove: async () => {},
      },
    });
    const content = await service.content({ userId: ALICE }, attachment.id);
    expect(content.uploadLimit).toEqual({ maxFileSizeMb: 50 });
    expect(limitForDisk).toHaveBeenLastCalledWith('memory');
    expect(await new Response(content.body).text()).toBe('old disk');
  });

  it('accepts exactly 1 MiB and returns the configured 413 for both size guards', async () => {
    h = await createHarness({
      drive: {
        default: 'large',
        disks: {
          large: {
            driver: 'fs',
            location: '/unused',
            visibility: 'private',
            maxFileSizeMb: 1,
          },
        },
      },
    });
    for (const bytes of [
      1 * 1024 * 1024,
      1 * 1024 * 1024 + 1,
      2 * 1024 * 1024,
    ]) {
      const result = await upload(ALICE, 'limit.bin', new Uint8Array(bytes));
      expect(result.status).toBe(bytes === 1 * 1024 * 1024 ? 201 : 413);
      if (result.status === 413)
        expect(result.body.error).toMatchObject({
          reason: 'FILE_TOO_LARGE',
          message: 'A file may have at most 1 MB.',
          metadata: { maxFileSizeMb: 1 },
        });
    }
  });

  it('sends application-started conversation attachments with the first message', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const file = await uploaded(ALICE, 'screen.png', PNG, 'image/png');
    h.services.conversations.sources.register({
      key: 'intake',
      title: { key: 'intake', ns: 'test' },
    });
    const started = await h.services.conversations.start(ALICE, {
      source: 'intake',
      agentId,
      text: 'Read the image',
      attachmentIds: [file.id],
    });
    expect(started.message.attachments).toMatchObject([
      { id: file.id, filename: 'screen.png' },
    ]);
    expect((await content(file.id, { user: ALICE })).status).toBe(200);
    expect((await content(file.id, { user: BOB })).status).toBe(404);
  });

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
      new Uint8Array(20 * 1024 * 1024 + 1),
      'application/octet-stream',
    );
    expect(large.status).toBe(413);
    expect(large.body.error.reason).toBe('FILE_TOO_LARGE');
    expect((await upload(ALICE, '')).status).toBe(400);
  });

  it('sends files with a message, shows them to the owner only, and refuses ids that are not the sender’s uploads', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const id = await conversation(agentId);
    const image = await uploaded(ALICE, 'screen.png', PNG, 'image/png');
    const log = await uploaded(ALICE, 'build.log', 'failed at step 3');

    const sent = await h.services.conversations.send(ALICE, id, {
      content: '',
      attachmentIds: [image.id, log.id],
    });
    expect(sent.message.attachments).toEqual([
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
    const listed = await h.services.conversations.messages(ALICE, id, {});
    expect(listed.items[0].attachments.map((file) => file.id)).toEqual([
      image.id,
      log.id,
    ]);

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
    await expect(
      h.services.conversations.send(ALICE, id, {
        content: 'Again',
        attachmentIds: [log.id],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    const bobs = await uploaded(BOB, 'bob.txt');
    await expect(
      h.services.conversations.send(ALICE, id, {
        content: 'Mine?',
        attachmentIds: [bobs.id],
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
      details: { fileId: bobs.id },
    });
    await expect(
      h.services.conversations.send(ALICE, id, { content: '  ' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    expect((await content(bobs.id, { user: BOB })).status).toBe(200);
    const mine = await uploaded(BOB, 'mine.txt');
    await expect(
      h.services.conversations.send(BOB, id, {
        content: 'Hi',
        attachmentIds: [mine.id],
      }),
    ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
  });

  it('lists the files for the agent and lets its run on the conversation download them', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runner = await h.registerRunner();
    const id = await conversation(agentId);
    const log = await uploaded(ALICE, 'build.log', 'failed at step 3');
    const unsent = await uploaded(ALICE, 'later.txt');
    await h.services.conversations.send(ALICE, id, {
      content: 'Why did it fail?',
      attachmentIds: [log.id],
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
    const first = await h.services.conversations.send(ALICE, id, {
      content: 'Look at this.',
      attachmentIds: [log.id],
    });
    expect(first.message.attachments).toHaveLength(1);
    await h.services.conversations.stop(ALICE, id);
    await h.services.conversations.send(ALICE, id, { content: 'And now?' });
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.prompt.system).toContain('Earlier in this conversation');
    expect(payload.prompt.system).toContain(
      `- build.log (text/plain, 5 bytes) [${log.id}]`,
    );
  });

  it('sends a conversation run upload immediately, retains it and restricts its content to that conversation', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runner = await h.registerRunner();
    const id = await conversation(agentId);
    await h.services.conversations.send(ALICE, id, { content: 'Send a file' });
    const [payload] = await claim(h, runner);
    const runToken = payload.cli.credential.content.token as string;
    const form = new FormData();
    form.set('file', new File([PNG], 'result.png', { type: 'image/png' }));
    const response = await h.request('POST', '/agents/chatAttachments', {
      runToken,
      form,
    });
    expect(response.status).toBe(201);
    const file = response.body.data as { id: string; contentUrl: string };
    const messages = await h.services.conversations.messages(ALICE, id, {});
    expect(
      messages.items.filter((message) => message.role === 'assistant'),
    ).toMatchObject([
      {
        runId: payload.run.id,
        content: { content: '' },
        attachments: [{ id: file.id, filename: 'result.png' }],
      },
    ]);
    const row = await h.services.tx
      .read()
      .repository('agChatAttachments')
      .findOne({ filter: { id: file.id } });
    expect(row).toMatchObject({
      conversationId: id,
      messageId: messages.items.at(-1)!.id,
    });
    expect((await content(file.id, { runToken })).status).toBe(200);
    expect((await content(file.id, { user: BOB })).status).toBe(404);
    expect((await content(file.id)).status).toBe(401);
    const download = await content(file.id, { user: ALICE, download: true });
    expect(download.status).toBe(200);
    expect(download.headers.get('content-disposition')).toContain(
      'attachment;',
    );
    const otherConversation = await conversation(agentId);
    await h.services.conversations.send(ALICE, otherConversation, {
      content: 'Other conversation',
    });
    const [other] = await claim(h, runner);
    expect(
      (
        await content(file.id, {
          runToken: other.cli.credential.content.token as string,
        })
      ).status,
    ).toBe(404);
    h.clock.advance(25 * 60 * 60 * 1000);
    expect(await h.services.chatAttachments.purge()).toBe(0);
    expect((await content(file.id, { user: ALICE })).status).toBe(200);
    expect(
      (await h.services.conversations.messages(ALICE, id, {})).items.at(-1)!
        .attachments,
    ).toMatchObject([{ id: file.id }]);
  });

  it('leaves task run uploads unattached and purges them after a day', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runner = await h.registerRunner();
    await h.enqueue(agentId, '9', { actorUserId: ALICE });
    const [payload] = await claim(h, runner);
    const runToken = payload.cli.credential.content.token as string;
    const form = new FormData();
    form.set(
      'file',
      new File(['task output'], 'task.txt', { type: 'text/plain' }),
    );
    const response = await h.request('POST', '/agents/chatAttachments', {
      runToken,
      form,
    });
    expect(response.status).toBe(201);
    const file = response.body.data as { id: string };
    expect((await content(file.id, { user: ALICE })).status).toBe(200);
    expect((await content(file.id, { runToken })).status).toBe(404);
    h.clock.advance(25 * 60 * 60 * 1000);
    expect(await h.services.chatAttachments.purge()).toBe(1);
    expect((await content(file.id, { user: ALICE })).status).toBe(404);
  });

  it('purges uploads never sent after a day, and keeps the sent ones', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const id = await conversation(agentId);
    const sent = await uploaded(ALICE, 'sent.txt');
    const unsent = await uploaded(ALICE, 'unsent.txt');
    await h.services.conversations.send(ALICE, id, {
      content: 'Here',
      attachmentIds: [sent.id],
    });
    expect(await h.services.chatAttachments.purge()).toBe(0);
    h.clock.advance(25 * 60 * 60 * 1000);
    expect(await h.services.chatAttachments.purge(h.clock.now())).toBe(1);
    expect((await content(unsent.id, { user: ALICE })).status).toBe(404);
    expect((await content(sent.id, { user: ALICE })).status).toBe(200);
  });
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.addUser('bob');
});
afterEach(() => h.close());

const submit = (agentId?: string, user = 'alice') =>
  h.request('POST', '/organizeIntake', {
    user,
    body: { text: 'Keep the requirement', ...(agentId ? { agentId } : {}) },
  });

async function expectNothingStarted() {
  expect(
    (await h.agents.conversations.list('alice', { archived: 'all' })).items,
  ).toEqual([]);
  expect(await h.agents.runs.list({ subjectKind: 'conversation' })).toEqual([]);
}

describe('intake requires a runnable handoff', () => {
  it('rejects anonymous requests', async () => {
    const response = await h.request('POST', '/organizeIntake', {
      body: { text: 'Requirements' },
    });
    expect(response.status).toBe(401);
    await expectNothingStarted();
  });

  it('explains a missing default without creating a conversation', async () => {
    const response = await submit();
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_AGENT');
    await expectNothingStarted();
  });

  it('explains an absent runner and creates no queued work', async () => {
    const id = await h.createAgent();
    const response = await submit(id);
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_RUNNER');
    await expectNothingStarted();
  });

  it('explains an absent runner for the default agent too', async () => {
    await h.createAgent();
    const response = await submit();
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_RUNNER');
    await expectNothingStarted();
  });

  it('refuses an agent that is not enabled', async () => {
    const id = await h.createAgent();
    await h.database
      .connection()
      .query.updateTable('agAgents')
      .set({ status: 'disabled' })
      .where('id', '=', id)
      .execute();
    const response = await submit(id, 'bob');
    expect(response.status).toBe(403);
    expect(response.body.error.reason).toBe('INTAKE_AGENT_UNAVAILABLE');
    await expectNothingStarted();
  });
});

describe('intake source images become conversation attachments', () => {
  it('rejects unreadable source bytes before uploading any image and accepts an explicit retry', async () => {
    const agentId = await onlineAgent();
    const first = await source();
    const second = await source('other.png');
    const row = await h.database
      .connection()
      .repository<{ key: string }>('pmAttachments')
      .findOne({ filter: { id: second.id } });
    const bytes = h.stored.get(row!.key)!;
    h.stored.delete(row!.key);
    expect((await organize(agentId, [first.id, second.id])).status).toBe(400);
    await expectNothingStarted();
    expect(
      await h.database
        .connection()
        .repository('agChatAttachments')
        .findMany({}),
    ).toEqual([]);
    h.stored.set(row!.key, bytes);
    expect((await organize(agentId, [first.id, second.id])).status).toBe(200);
  });
  async function onlineAgent() {
    const agentId = await h.createAgent();
    await h.claimOne();
    return agentId;
  }
  async function source(
    name = 'screen.png',
    user = 'alice',
    type = 'image/png',
  ) {
    return h.projects.intake.upload(
      h.viewer(user),
      new File(['image bytes'], name, { type }),
    );
  }
  const organize = (agentId: string, imageFileIds: string[]) =>
    h.request('POST', '/organizeIntake', {
      user: 'alice',
      body: {
        agentId,
        text: 'Add the Retry action',
        imageFileIds,
        files: [{ name: 'notes.txt', text: 'Keep the blue card unchanged' }],
      },
    });

  it('attaches multiple image copies in order to the first message with text files, leaving the sources reusable', async () => {
    const agentId = await onlineAgent();
    const first = await source();
    const second = await source('second.jpg', 'alice', 'image/jpeg');
    const response = await organize(agentId, [second.id, first.id]);
    expect(response.status).toBe(200);
    const detail = response.body.data.conversation;
    const messages = await h.agents.conversations.messages(
      'alice',
      detail.id,
      {},
    );
    const message = messages.items[0];
    expect(message.attachments.map((file) => file.filename)).toEqual([
      'second.jpg',
      'screen.png',
    ]);
    expect(message.attachments.map((file) => file.id)).not.toContain(first.id);
    expect(message.content.content).toContain('Keep the blue card unchanged');
    expect(message.content.content).toContain('For every attached image');
    expect(message.content.content).toContain(
      'STOP without proposing a partial plan',
    );
    for (const file of message.attachments) {
      const content = await h.agents.chatAttachments.content(
        { userId: 'alice' },
        file.id,
      );
      expect(await new Response(content.body).text()).toBe('image bytes');
      await expect(
        h.agents.chatAttachments.content({ userId: 'bob' }, file.id),
      ).rejects.toThrow();
    }
    const retry = await organize(agentId, [first.id]);
    expect(retry.status).toBe(200);
    const retried = await h.agents.conversations.messages(
      'alice',
      retry.body.data.conversation.id,
      {},
    );
    expect(retried.items[0].attachments.map((file) => file.filename)).toEqual([
      'screen.png',
    ]);
    expect(retried.items[0].attachments[0].id).not.toBe(
      message.attachments[1].id,
    );
    expect(
      (
        await h.projects.intake.texts(h.viewer('alice'), {
          fileIds: [first.id],
        })
      ).files[0].state,
    ).toBe('image');
  });

  it('rejects another person’s source and missing sources before starting a conversation', async () => {
    const agentId = await onlineAgent();
    const own = await source();
    const other = await source('private.png', 'bob');
    for (const id of [other.id, crypto.randomUUID()]) {
      const response = await organize(agentId, [own.id, id]);
      expect(response.status).toBe(400);
      expect(response.body.error.reason).toBe('INTAKE_IMAGE_FAILED');
    }
    await expectNothingStarted();
    expect(
      await h.database
        .connection()
        .repository('agChatAttachments')
        .findMany({}),
    ).toEqual([]);
  });

  it('rejects unsupported image formats and can retry with a remaining valid image', async () => {
    const agentId = await onlineAgent();
    const svg = await source('diagram.svg', 'alice', 'image/svg+xml');
    const own = await source();
    expect((await organize(agentId, [own.id, svg.id])).status).toBe(400);
    await expectNothingStarted();
    expect((await organize(agentId, [own.id])).status).toBe(200);
  });

  it('leaves the source available when chat upload fails and starts no partial conversation', async () => {
    const agentId = await onlineAgent();
    const own = await source();
    const { vi } = await import('vitest');
    const upload = vi
      .spyOn(h.agents.chatAttachments, 'upload')
      .mockRejectedValueOnce(new Error('disk unavailable'));
    const failed = await organize(agentId, [own.id]);
    expect(failed.status).toBe(400);
    await expectNothingStarted();
    upload.mockRestore();
    expect((await organize(agentId, [own.id])).status).toBe(200);
  });
});

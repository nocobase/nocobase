/**
 * Deleting a conversation, by its owner or once it has stayed archived past the retention: its open run is cancelled,
 * its messages, files, links and kept sessions go, and runners are told its working directories may go.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { claim, createHarness, type Harness } from './harness.js';

const ALICE = 'alice';
const BOB = 'bob';

describe('deleting conversations', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.services.onlineAgent.shutdown();
    await h?.close();
  });

  async function withFile(agentId: string) {
    const form = new FormData();
    form.set('file', new File(['hello'], 'notes.txt', { type: 'text/plain' }));
    const uploaded = await h.request('POST', '/agents/chatAttachments', {
      user: ALICE,
      form,
    });
    const file = uploaded.body.data as { id: string };
    const id = (await h.services.conversations.create(ALICE, { agentId })).id;
    const sent = await h.services.conversations.send(ALICE, id, {
      content: 'Read this',
      attachmentIds: [file.id],
    });
    return { id, file, run: sent.run! };
  }

  it('deletes everything of the owner’s conversation, cancels its run and lets runners remove its directory', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runner = await h.registerRunner();
    const { id, file, run } = await withFile(agentId);
    await claim(h, runner);
    await h.request('POST', `/agents/runners/runs/${run.id}/start`, {
      runnerKey: runner.key,
      body: { workDir: '/work/chat', adapter: { kind: 'claude' } },
    });
    const conn = h.database.connection();
    await conn.repository('agSessions').createOne({
      values: {
        id: 'session-row',
        agentId,
        runnerId: runner.runnerId,
        subjectKind: 'conversation',
        subjectId: id,
        threadScope: 't0',
        sessionId: 'tool-session',
        workDir: '/work/chat',
        fingerprint: 'f',
        poisoned: false,
        updatedAt: new Date().toISOString(),
      },
    });

    // Only its owner may delete it.
    expect(
      (
        await h.request('DELETE', `/agents/conversations/${id}`, {
          user: BOB,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('DELETE', `/agents/conversations/${id}`, {
          user: ALICE,
        })
      ).status,
    ).toBe(204);

    expect(
      await conn.repository('agConversations').findOne({ filter: { id } }),
    ).toBeUndefined();
    expect(
      await conn
        .repository('agConversationMessages')
        .findMany({ filter: { conversationId: id } }),
    ).toEqual([]);
    expect(
      await conn
        .repository('agChatAttachments')
        .findOne({ filter: { id: file.id } }),
    ).toBeUndefined();
    expect(
      await conn
        .repository('agSessions')
        .findMany({ filter: { subjectId: id } }),
    ).toEqual([]);
    expect(
      (await h.services.runs.detail(run.id)).cancelRequestedAt,
    ).toBeTruthy();
    expect(
      (await h.request('GET', `/agents/conversations/${id}`, { user: ALICE }))
        .status,
    ).toBe(404);
    // Its work is over: once the run ended, the runner's report is told its directory may go.
    await h.request('POST', `/agents/runners/runs/${run.id}/cancelAck`, {
      runnerKey: runner.key,
      body: {},
    });
    const report = await h.request('POST', '/agents/runners/workspaces', {
      runnerKey: runner.key,
      body: {
        workspaces: [
          {
            runId: run.id,
            workDir: '/work/chat',
            unpushed: false,
            lastUsedAt: new Date().toISOString(),
          },
        ],
      },
    });
    expect(report.status).toBe(200);
    expect(report.body.data.remove).toEqual([run.id]);
    // Once ended, the run and what it recorded go with the next cleanup.
    expect(await h.services.conversations.purgeArchived(30)).toBe(0);
    expect(
      await conn.repository('agRuns').findOne({ filter: { id: run.id } }),
    ).toBeUndefined();
    expect(
      await conn
        .repository('agRunInputs')
        .findMany({ filter: { runId: run.id } }),
    ).toEqual([]);
  });

  it('deletes conversations archived longer than the retention, and keeps the rest', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const conversations = h.services.conversations;
    const old = (await conversations.create(ALICE, { agentId })).id;
    const recent = (await conversations.create(ALICE, { agentId })).id;
    const open = (await conversations.create(ALICE, { agentId })).id;
    await conversations.update(ALICE, old, { archived: true });
    await conversations.update(ALICE, recent, { archived: true });
    const repo = h.database.connection().repository('agConversations');
    await repo.updateMany({
      filter: { id: old },
      values: { archivedAt: new Date(Date.now() - 40 * 86_400_000) },
    });
    expect(await conversations.purgeArchived(0)).toBe(0);
    expect(await conversations.purgeArchived(30)).toBe(1);
    expect(await repo.findOne({ filter: { id: old } })).toBeUndefined();
    expect(await repo.findOne({ filter: { id: recent } })).not.toBeUndefined();
    expect(await repo.findOne({ filter: { id: open } })).not.toBeUndefined();
  });
});

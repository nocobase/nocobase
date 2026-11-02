import { databaseManagerToken } from '@nocobase/db';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { createStandaloneServer } from '../../server/standalone.js';

// A complete application host in a separate OS process. The parent owns its configuration/database.
const server = await createStandaloneServer({
  configPath: process.env.PM481_STARTUP_CONFIG!,
  viteDevUrl: false,
  env: { APP_STORAGE_DIR: process.env.PM481_STARTUP_STORAGE! },
});
const app = server.application;
const db = app.container.resolve(databaseManagerToken).connection();
const services = app.container.resolve(agentsToken);
const repo = db.repository('agConversations');
const messages = db.repository('agConversationMessages');
if (process.env.PM481_STARTUP_PHASE === 'prepare') {
  const now = new Date().toISOString();
  for (const id of [
    'unfinished',
    'saved',
    'approval',
    'background',
    'runner',
  ]) {
    const assistant = {
      id: `${id}-answer`,
      role: 'assistant',
      metadata: {
        conversationId: id,
        executionId: `${id}-execution`,
        createdAt: now,
        seq: 2,
        revision: 1,
      },
      parts:
        id === 'approval'
          ? [
              {
                type: 'tool-fixture',
                toolCallId: 'call',
                state: 'approval-requested',
                input: {},
                approval: { id: 'approval-id' },
              },
            ]
          : [
              {
                type: 'text',
                text: id === 'background' ? '{"count":7}' : 'Saved answer',
                state: 'done',
              },
            ],
    };
    await repo.createOne({
      values: {
        id,
        userId: 'fixture-owner',
        mode: 'online',
        modelService: 'fixture',
        model: 'chat',
        titleSource: 'auto',
        category: 'chat',
        source: 'fixture',
        showInChatList: id !== 'background',
        read: true,
        lastSeq: ['saved', 'approval', 'background'].includes(id)
          ? 2
          : id === 'unfinished'
            ? 1
            : 0,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
        metadata:
          id === 'runner'
            ? { runnerOnlineAgent: { version: 1, closingRunId: 'fixture-run' } }
            : {
                onlineAgent: {
                  version: 1,
                  kind: id === 'background' ? 'background' : 'realtime',
                  config: {
                    scope: [],
                    systemPrompt: '',
                    tool: [],
                    toolVersions: {},
                    model: ['fixture/chat'],
                  },
                  call: {
                    actorId: 'fixture-owner',
                    state: id === 'approval' ? 'waitingApproval' : 'running',
                    messageId: `${id}-answer`,
                    executionId: `${id}-execution`,
                    revision: id === 'unfinished' ? 0 : 1,
                    ...(id === 'saved'
                      ? { outcome: 'completed', closing: true }
                      : {}),
                    ...(id === 'background'
                      ? {
                          outcome: 'completed',
                          result: { count: 7 },
                          closing: true,
                        }
                      : {}),
                    ...(id === 'approval'
                      ? {
                          requiresEffectReview: true,
                          approvalExpiresAt: new Date(
                            Date.now() + 86400000,
                          ).toISOString(),
                        }
                      : {}),
                  },
                },
              },
      },
    });
    if (['unfinished', 'saved', 'approval', 'background'].includes(id)) {
      const user = {
        id: `${id}-input`,
        role: 'user',
        metadata: { conversationId: id, createdAt: now, seq: 1, revision: 1 },
        parts: [{ type: 'text', text: 'Accepted work', state: 'done' }],
      };
      await messages.createOne({
        values: {
          id: user.id,
          conversationId: id,
          seq: 1,
          role: 'user',
          content: { type: 'text', content: 'Accepted work', original: user },
          metadata: {},
          searchText: 'Accepted work',
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    if (['saved', 'approval', 'background'].includes(id))
      await messages.createOne({
        values: {
          id: assistant.id,
          conversationId: id,
          seq: 2,
          role: 'assistant',
          content: {
            type: 'text',
            content:
              id === 'background'
                ? '{"count":7}'
                : id === 'saved'
                  ? 'Saved answer'
                  : '',
            original: assistant,
          },
          metadata: {
            nativeOutcome: id === 'approval' ? undefined : 'completed',
          },
          searchText: '',
          createdAt: now,
          updatedAt: now,
        },
      });
  }
  process.send?.({ phase: 'prepared', pid: process.pid });
  // Deliberately no shutdown/finalization: the parent kills this process before starting the replacement.
  await new Promise(() => {});
} else {
  const read = async () => ({
    conversations: await repo.findMany({ sort: (s) => s.field('id').asc() }),
    messages: await messages.findMany({ sort: (s) => s.field('id').asc() }),
  });
  const first = await read();
  await services.onlineAgent.recoverAtStartup();
  const second = await read();
  process.send?.({ phase: 'recovered', pid: process.pid, first, second });
  await server.close();
}

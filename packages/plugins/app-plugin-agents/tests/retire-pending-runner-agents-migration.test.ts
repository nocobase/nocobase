import path from 'node:path';
import type { Knex } from 'knex';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { classifyPendingRunnerAgents } from '../database/migrations/202610310001_ag_retire_pending_runner_agents.js';

const name = '202610310001_ag_retire_pending_runner_agents';
const now = '2026-10-24T00:00:00.000Z';
const sources = [
  {
    packageName: '@nocobase/app-plugin-agents',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];
const references: [string, string, Record<string, unknown>][] = [
  [
    'agSessions',
    'agentId',
    {
      runnerId: 'r',
      subjectKind: 'sample',
      subjectId: 's',
      threadScope: 't',
      sessionId: 'session',
    },
  ],
  [
    'agRunTokens',
    'agentId',
    {
      runId: 'parent',
      runnerId: 'r',
      tokenHash: 'test',
      actorUserId: 'u',
      expiresAt: now,
    },
  ],
  [
    'agRunInputs',
    'actorId',
    {
      runId: 'parent',
      actorKind: 'agent',
      actorName: 'Agent',
      type: 'comment',
      text: '',
    },
  ],
  ['agRunRequests', 'agentId', {}],
  ['agRunRequests', 'inputActorId', { inputActorKind: 'agent' }],
  ['agConversations', 'agentId', {}],
  ['agConversations', 'fallbackFromAgentId', {}],
  ['agChatPreferences', 'defaultAgentId', {}],
  ['agAgentUsers', 'agentId', { userId: 'u' }],
  [
    'agAgentChanges',
    'agentId',
    { revision: 1, action: 'created', changes: [], actorUserId: 'u' },
  ],
  [
    'agSecrets',
    'scopeId',
    { scope: 'agent', name: 'TEST', valueEncrypted: 'test-only' },
  ],
  ['agSecretAudits', 'scopeId', { scope: 'agent', action: 'created', at: now }],
  ['agSkillAttachments', 'scopeId', { scope: 'agent', skillId: 'skill' }],
  ['pmIssues', 'executorId', { executorType: 'agent' }],
  ['pmComments', 'authorId', { authorType: 'agent' }],
  ['pmComments', 'deletedById', { deletedByType: 'agent' }],
  ['pmActivities', 'actorId', { actorType: 'agent' }],
  ['pmPlans', 'createdById', { createdByType: 'agent' }],
  ['pmPlans', 'executedById', {}],
  ['studioProjectInits', 'agentId', {}],
  ['studioDelegations', 'agentId', {}],
  ['studioStageRunGuards', 'agentId', {}],
  ['studioInboxNotices', 'actorId', { actorType: 'agent' }],
];
const jsonReferences: [string, string][] = [
  ['agSettings', 'value'],
  ['pmComments', 'origin'],
  ['pmActivities', 'details'],
  ['pmPlans', 'proposer'],
  ['pmPlans', 'sourceData'],
  ['pmPlanRows', 'params'],
  ['pmPlanRows', 'result'],
  ['studioSettings', 'value'],
  ['studioStageRunGuards', 'ruleConfig'],
  ['studioInboxNotices', 'data'],
];
const expected = [
  ...references.map(([t, c]) => `${t}-${c}`),
  ...jsonReferences.map(([t, c]) => `${t}-${c}`),
  'system-updated',
  'auto-business',
  ...[
    'queued',
    'dispatched',
    'running',
    'completed',
    'failed',
    'cancelled',
  ].map((s) => `run-${s}`),
];

describeMigration(name, {
  sources: [
    ...sources,
    {
      packageName: 'test-references',
      directory: path.resolve(
        import.meta.dirname,
        'fixtures/pending-runner-references',
      ),
    },
  ],
  before: async ({ connection: conn }) => {
    const agent = async (id: string, source = 'runner', status = 'pending') =>
      conn.repository('agAgents').createOne({
        values: {
          id,
          name: id,
          type: 'runner',
          source,
          status,
          ownerUserId: 'system',
          tool: 'codex',
          model: id,
          createdAt: now,
          updatedAt: now,
        },
      });
    for (const id of [
      'unused',
      'auto-only',
      'parent-agent',
      'wrong-kind',
      ...expected,
    ])
      await agent(id);
    await agent('enabled', 'runner', 'enabled');
    await agent('disabled', 'runner', 'disabled');
    await agent('system', 'system');
    await conn.repository('agSkills').createOne({
      values: {
        id: 'skill',
        slug: 'skill',
        name: 'Skill',
        description: '',
        createdAt: now,
        updatedAt: now,
      },
    });
    const run = {
      agentId: 'parent-agent',
      subjectKind: 'sample',
      subjectId: 's',
      threadScope: 't',
      actorUserId: 'u',
      createdAt: now,
      updatedAt: now,
    };
    await conn
      .repository('agRuns')
      .createOne({ values: { ...run, id: 'parent' } });
    for (const status of [
      'queued',
      'dispatched',
      'running',
      'completed',
      'failed',
      'cancelled',
    ])
      await conn.repository('agRuns').createOne({
        values: {
          ...run,
          id: `history-${status}`,
          status,
          agentId: `run-${status}`,
        },
      });
    const defaults: Record<string, Record<string, unknown>> = {
      agRunRequests: {
        agentId: 'parent-agent',
        subjectKind: 'sample',
        subjectId: 's',
        threadScope: 't',
        responsibleUserId: 'u',
        requestedByUserId: 'u',
        inputType: 'comment',
        inputActorKind: 'user',
        inputActorId: 'u',
        inputActorName: 'User',
        inputText: '',
        expiresAt: now,
      },
      agConversations: {
        agentId: 'parent-agent',
        userId: 'u',
        titleSource: 'user',
        category: 'chat',
        source: 'panel',
        lastMessageAt: now,
        archivedAt: now,
      },
    };
    const insert = async (table: string, values: Record<string, unknown>) => {
      const schema = (await conn.collections.get(table))!;
      const fields = new Set(schema.fields?.map((field) => field.name));
      await conn.repository(table).createOne({
        values: Object.fromEntries(
          Object.entries(values).filter(([key]) => fields.has(key)),
        ),
      });
    };
    for (const [table, column, values] of references) {
      const id = `${table}-${column}`;
      await insert(table, {
        id,
        userId: id,
        createdAt: now,
        updatedAt: now,
        ...defaults[table],
        ...values,
        [column]: id,
      });
    }
    for (const [table, column] of jsonReferences) {
      const id = `${table}-${column}`;
      // Both decoded JSON objects and double-encoded JSON strings occur in historical settings.
      const value = {
        targets: [{ agent: { type: 'agent', id } }],
        pendingWakes: [{ actorId: id }],
      };
      await insert(table, {
        id,
        key: id,
        updatedAt: now,
        [column]: table === 'agSettings' ? JSON.stringify(value) : value,
      });
    }
    await conn.repository('pmIssues').createOne({
      values: {
        id: 'person',
        executorType: 'user',
        executorId: 'wrong-kind',
      },
    });
    await conn.repository('agSecretAudits').createOne({
      values: {
        id: 'workdir-audit',
        scope: 'workdir',
        scopeId: 'wrong-kind',
        action: 'created',
        at: now,
      },
    });
    const automaticAudits = [
      { id: 'auto-initial', agentId: 'auto-only', revision: 1, changes: [] },
      // Neither a later revision nor nonempty changes makes a system creation audit a reference.
      {
        id: 'auto-later',
        agentId: 'auto-only',
        revision: 7,
        changes: [{ field: 'name', before: 'Old', after: 'New' }],
      },
      {
        id: 'auto-before-update',
        agentId: 'system-updated',
        revision: 1,
        changes: [],
      },
      {
        id: 'auto-before-business',
        agentId: 'auto-business',
        revision: 1,
        changes: [],
      },
    ];
    for (const audit of automaticAudits)
      await conn.repository('agAgentChanges').createOne({
        values: {
          ...audit,
          action: 'created',
          actorUserId: null,
          createdAt: now,
        },
      });
    await conn.repository('agAgentChanges').createOne({
      values: {
        id: 'system-update',
        agentId: 'system-updated',
        revision: 2,
        action: 'updated',
        actorUserId: null,
        changes: [],
        createdAt: now,
      },
    });
    await conn.repository('pmIssues').createOne({
      values: {
        id: 'business-use',
        executorType: 'agent',
        executorId: 'auto-business',
      },
    });
    const audits = await conn.repository('agAgentChanges').findMany();
    const client = await conn.client<Knex>();
    const sql: string[] = [];
    const listen = (query: { sql: string }) => sql.push(query.sql);
    client.on('query', listen);
    let before;
    try {
      before = await classifyPendingRunnerAgents(conn);
    } finally {
      client.off('query', listen);
    }
    expect(sql.length).toBeGreaterThan(0);
    expect(
      sql.filter((statement) =>
        /^(insert|update|delete)|for update/i.test(statement),
      ),
    ).toEqual([]);
    expect(await conn.repository('agAgentChanges').findMany()).toEqual(audits);
    expect(before.remove.sort()).toEqual(['auto-only', 'unused', 'wrong-kind']);
    expect(before.disable.sort()).toEqual(['parent-agent', ...expected].sort());
    expect(before.reasons['agAgentChanges.agentId']).toBe(2);
    expect(before.candidates.length).toBe(
      before.remove.length + before.disable.length,
    );
    await conn.repository('agSettings').createOne({
      values: { key: 'malformed', value: '{invalid', updatedAt: now },
    });
    await expect(classifyPendingRunnerAgents(conn)).rejects.toThrow(
      'invalid JSON',
    );
    expect(
      await conn.repository('agAgents').findOne({ filter: { id: 'unused' } }),
    ).toMatchObject({ status: 'pending' });
    await conn
      .repository('agSettings')
      .deleteMany({ filter: { key: 'malformed' } });
  },
  up: async ({ connection: conn }) => {
    const rows = await conn.repository('agAgents').findMany();
    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.has('unused')).toBe(false);
    expect(byId.has('auto-only')).toBe(false);
    expect(byId.has('wrong-kind')).toBe(false);
    for (const id of ['parent-agent', ...expected])
      expect(byId.get(id)).toMatchObject({
        status: 'disabled',
        updatedAt: expect.anything(),
      });
    expect(byId.get('enabled')).toMatchObject({ status: 'enabled' });
    expect(byId.get('disabled')).toMatchObject({ status: 'disabled' });
    expect(byId.get('system')).toMatchObject({
      status: 'pending',
      source: 'system',
    });
    const audits = await conn.repository('agAgentChanges').findMany();
    expect(audits.map((audit) => audit.id).sort()).toEqual([
      'agAgentChanges-agentId',
      'auto-before-business',
      'auto-before-update',
      'system-update',
    ]);
    expect(
      audits.find((audit) => audit.id === 'agAgentChanges-agentId'),
    ).toMatchObject({
      action: 'created',
      actorUserId: 'u',
      revision: 1,
      changes: [],
    });
    expect(audits.find((audit) => audit.id === 'system-update')).toMatchObject({
      action: 'updated',
      actorUserId: null,
      revision: 2,
      changes: [],
    });
    expect(await classifyPendingRunnerAgents(conn)).toMatchObject({
      candidates: [],
      remove: [],
      disable: [],
    });
  },
  down: async ({ connection }) => {
    expect(
      await connection
        .repository('agAgents')
        .findOne({ filter: { id: 'auto-only' } }),
    ).toBeUndefined();
    expect(
      await connection
        .repository('agAgentChanges')
        .findOne({ filter: { id: 'auto-later' } }),
    ).toBeUndefined();
    expect(
      await connection
        .repository('agAgents')
        .findOne({ filter: { id: 'unused' } }),
    ).toBeUndefined();
    expect(
      await connection
        .repository('agAgents')
        .findOne({ filter: { id: 'agAgentChanges-agentId' } }),
    ).toMatchObject({ status: 'disabled' });
  },
});

// Optional Projects/Studio collections are absent on a standalone plugin installation.
describeMigration(name, {
  sources,
  before: async ({ connection }) => {
    await connection.repository('agAgents').createOne({
      values: {
        id: 'standalone-unused',
        name: 'Unused',
        type: 'runner',
        source: 'runner',
        status: 'pending',
        ownerUserId: 'system',
        createdAt: now,
        updatedAt: now,
      },
    });
  },
  up: async ({ connection }) =>
    expect(
      await connection
        .repository('agAgents')
        .findOne({ filter: { id: 'standalone-unused' } }),
    ).toBeUndefined(),
});

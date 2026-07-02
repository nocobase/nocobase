/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import { MockServer, createMockServer } from '@nocobase/test';

import PluginAgentGatewayServer from '../plugin';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

describe('agent gateway action audit', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'system-settings',
        'field-sort',
        'users',
        'departments',
        'auth',
        'acl',
        'data-source-manager',
        'error-handler',
        [PluginAgentGatewayServer, { packageName: '@nocobase/plugin-agent-gateway' }],
      ],
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootAgent = await app.agent().login(rootUser);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function seedCodexSession() {
    const now = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        id: randomUUID(),
        runCode: `audit-source-${randomUUID()}`,
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: 'Audit source',
        },
        executionPayloadJson: {
          commandKey: 'codex',
          args: ['exec', '--json', 'Audit source'],
        },
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        completedAt: now,
        finishedAt: now,
      },
    });
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId: 'audit-thread-1',
        rootRunId: run.get('id'),
        latestRunId: run.get('id'),
        status: 'ended',
        capabilitiesJson: {
          resumeWithMessage: true,
        },
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: run.get('id'),
      values: {
        agentSessionId: session.get('id'),
        agentSessionProvider: 'codex',
        agentSessionProviderId: 'audit-thread-1',
      },
    });
    return {
      run,
      session,
    };
  }

  it('records accepted, succeeded, and deduped resume audits without leaking sensitive message text', async () => {
    const { session } = await seedCodexSession();
    const message = 'Continue with password=AUDIT_SECRET and token=SECOND_SECRET';
    const first = await rootAgent.post(`/api/agent-gateway/agent-sessions/${session.get('id')}/resume`).send({
      message,
      idempotencyKey: 'audit-resume-click',
    });
    const second = await rootAgent.post(`/api/agent-gateway/agent-sessions/${session.get('id')}/resume`).send({
      message,
      idempotencyKey: 'audit-resume-click',
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(getData(second).deduped).toBe(true);

    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        action: 'resume',
        sessionId: session.get('id'),
      },
      sort: ['createdAt'],
    });
    expect(audits.map((audit) => audit.get('resultStatus'))).toEqual([
      'accepted',
      'succeeded',
      'accepted',
      'succeeded',
    ]);
    const succeededAudits = audits.filter((audit) => audit.get('resultStatus') === 'succeeded');
    expect((succeededAudits[0].get('metadataJson') as Record<string, unknown>).deduped).toBe(false);
    expect((succeededAudits[1].get('metadataJson') as Record<string, unknown>).deduped).toBe(true);
    for (const audit of audits) {
      expect(audit.get('contentHash')).toBe(hashText(message));
      expect(audit.get('contentSize')).toBe(Buffer.byteLength(message));
      expect(String(audit.get('redactedPreview'))).toContain('[REDACTED]');
      expect(JSON.stringify(audit.toJSON())).not.toContain('AUDIT_SECRET');
      expect(JSON.stringify(audit.toJSON())).not.toContain('SECOND_SECRET');
    }

    const apiLogs = await app.db.getRepository('agApiCallLogs').find({
      filter: {
        path: `/api/agent-gateway/agent-sessions/${session.get('id')}/resume`,
      },
    });
    expect(apiLogs.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(apiLogs.map((log) => log.toJSON()))).not.toContain('AUDIT_SECRET');
    expect(JSON.stringify(apiLogs.map((log) => log.toJSON()))).not.toContain('SECOND_SECRET');
  });
});

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
  let rootUserId: unknown;

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
    rootUserId = rootUser?.get('id');
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

  async function seedActiveCodexRun() {
    const now = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        id: randomUUID(),
        runCode: `audit-active-${randomUUID()}`,
        status: 'running',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: 'Audit active source',
        },
        executionPayloadJson: {
          commandKey: 'codex',
        },
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        terminalBackend: 'tmux',
        terminalSessionName: `ag-run-${randomUUID()}`,
        terminalStatus: 'active',
      },
    });
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId: `audit-active-thread-${randomUUID()}`,
        rootRunId: run.get('id'),
        latestRunId: run.get('id'),
        status: 'active',
        capabilitiesJson: {
          interrupt: true,
          terminate: true,
          liveSemanticMessage: false,
          stdinMessage: false,
        },
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: run.get('id'),
      values: {
        agentSessionId: session.get('id'),
        agentSessionProvider: 'codex',
        agentSessionProviderId: session.get('providerSessionId'),
      },
    });
    return {
      run,
      session,
    };
  }

  async function createUserAgent(username: string, snippets: string[]) {
    const roleName = `${username}-role`;
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets,
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username,
        roles: [roleName],
      },
    });
    return await app.agent().login(user);
  }

  function registerTestSnippet(name: string, actions: string[]) {
    app.acl.registerSnippet({
      name,
      actions,
    });
    return name;
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

  it('records unsupported message and raw-write denied audits without leaking sensitive input', async () => {
    const { run, session } = await seedActiveCodexRun();
    const message = 'Live message password=AUDIT_MESSAGE_SECRET token=AUDIT_MESSAGE_TOKEN';
    const input = 'raw input password=AUDIT_RAW_SECRET token=AUDIT_RAW_TOKEN';

    const messageResponse = await rootAgent
      .post(`/api/agent-gateway/agent-sessions/${session.get('id')}/message`)
      .send({
        message,
      });
    expect(messageResponse.status).toBe(409);
    expect(JSON.stringify(messageResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const rawResponse = await rootAgent.post(`/api/agent-gateway/runs/${run.get('id')}/terminal:send`).send({
      input,
      appendEnter: true,
    });
    expect(rawResponse.status).toBe(403);
    expect(JSON.stringify(rawResponse.body)).toContain('TERMINAL_RAW_WRITE_DISABLED');

    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        sessionId: session.get('id'),
      },
      sort: ['createdAt'],
    });
    expect(audits.map((audit) => audit.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'message',
          operatorId: rootUserId,
          permissionKey: 'agentGateway.messageAgentSession',
          resultStatus: 'denied',
          contentHash: hashText(message),
          contentSize: Buffer.byteLength(message),
          metadataJson: expect.objectContaining({
            reason: 'unsupported-capability',
          }),
        }),
        expect.objectContaining({
          action: 'rawTerminalWriteDenied',
          permissionKey: 'agentGateway.writeTerminalRaw',
          resultStatus: 'denied',
          metadataJson: expect.objectContaining({
            code: 'TERMINAL_RAW_WRITE_DISABLED',
            inputPresent: true,
            inputSizeBytes: Buffer.byteLength(input),
            inputType: 'string',
          }),
        }),
      ]),
    );
    const serializedAudits = JSON.stringify(audits.map((audit) => audit.toJSON()));
    expect(serializedAudits).not.toContain('AUDIT_MESSAGE_SECRET');
    expect(serializedAudits).not.toContain('AUDIT_MESSAGE_TOKEN');
    expect(serializedAudits).not.toContain('AUDIT_RAW_SECRET');
    expect(serializedAudits).not.toContain('AUDIT_RAW_TOKEN');
  });

  it('records denied control audits without creating control requests', async () => {
    const { run } = await seedActiveCodexRun();
    const runId = String(run.get('id'));
    const readOnlyAgent = await createUserAgent('agent-gateway-audit-readonly', ['agentGateway.readRuns']);

    expect(
      (
        await readOnlyAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
          idempotencyKey: 'audit-denied-interrupt',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await readOnlyAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({
          idempotencyKey: 'audit-denied-terminate',
        })
      ).status,
    ).toBe(403);
    expect(
      await app.db.getRepository('agRunControlRequests').count({
        filter: {
          runId,
        },
      }),
    ).toBe(0);

    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        runId,
        resultStatus: 'denied',
      },
    });
    expect(audits.map((audit) => audit.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'interrupt',
          permissionKey: 'agentGateway.interruptRun',
        }),
        expect.objectContaining({
          action: 'terminate',
          permissionKey: 'agentGateway.terminateRun',
        }),
      ]),
    );
  });

  it('records denied run detail reads without exposing prompt data', async () => {
    const { run } = await seedCodexSession();
    const runId = String(run.get('id'));
    const readOnlyAgent = await createUserAgent('agent-gateway-audit-run-detail-readonly', ['agentGateway.readRuns']);

    const response = await readOnlyAgent.get(`/api/agent-gateway/runs:get/${runId}`);

    expect(response.status).toBe(403);
    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        action: 'readRunDetails',
        runId,
        resultStatus: 'denied',
      },
    });
    expect(audits.map((audit) => audit.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'readRunDetails',
          runId,
          permissionKey: 'agentGateway.readRunDetails',
          resultStatus: 'denied',
          metadataJson: expect.objectContaining({
            routeAction: 'runs:get',
            phase: 'permission',
          }),
        }),
      ]),
    );
    expect(JSON.stringify(audits.map((audit) => audit.toJSON()))).not.toContain('Audit source');
  });

  it('serves browser audit records only through readAudit with redacted fields', async () => {
    const { run, session } = await seedActiveCodexRun();
    const runId = String(run.get('id'));
    const sessionId = String(session.get('id'));
    const secretPreview = 'terminal token=AUDIT_BROWSER_SECRET';
    const audit = await app.db.getRepository('agAgentActionAudits').create({
      values: {
        id: randomUUID(),
        action: 'readTerminal',
        runId,
        sessionId,
        operatorId: rootUserId,
        redactedPreview: secretPreview,
        contentHash: hashText(secretPreview),
        contentSize: Buffer.byteLength(secretPreview),
        permissionKey: 'agentGateway.readTerminal',
        resultStatus: 'denied',
        provider: 'codex',
        metadataJson: {
          safe: 'visible audit metadata',
          token: 'AUDIT_METADATA_SECRET',
        },
      },
    });
    const auditReader = await createUserAgent('agent-gateway-audit-reader', ['agentGateway.readAudit']);

    const listResponse = await auditReader.get(`/api/agent-gateway/audits:list?runId=${runId}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: audit.get('id'),
          action: 'readTerminal',
          runId,
          sessionId,
          permissionKey: 'agentGateway.readTerminal',
          resultStatus: 'denied',
          metadataJson: expect.objectContaining({
            safe: 'visible audit metadata',
            token: '[REDACTED]',
          }),
        }),
      ]),
    );
    const serializedList = JSON.stringify(listResponse.body.data);
    expect(serializedList).not.toContain('AUDIT_BROWSER_SECRET');
    expect(serializedList).not.toContain('AUDIT_METADATA_SECRET');
    expect(serializedList).not.toContain(hashText(secretPreview));

    const standardResponse = await auditReader.get(
      `/api/agAgentActionAudits:list?filter=${encodeURIComponent(JSON.stringify({ runId, action: 'readTerminal' }))}`,
    );
    expect(standardResponse.status).toBe(200);
    expect(standardResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: audit.get('id'),
          runId,
        }),
      ]),
    );

    expect((await auditReader.get('/api/agRuns:list')).status).toBe(403);

    const rawAuditSnippet = registerTestSnippet('agentGateway.test.rawAuditCollection', ['agAgentActionAudits:list']);
    const rawAuditAgent = await createUserAgent('agent-gateway-raw-audit-reader', [rawAuditSnippet]);
    expect((await rawAuditAgent.get('/api/agAgentActionAudits:list')).status).toBe(403);
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { MockServer, createMockServer } from '@nocobase/test';

import { AgentProviderKey, normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import { consumeTerminalStreamTicket } from '../actions/terminalStreamTickets';
import PluginAgentGatewayServer from '../plugin';
import { createStreamToken } from '../security';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

interface ProviderRun {
  nodeId: string;
  profileId: string;
  runId: string;
  sessionId?: string;
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function getManagedSessionName(runId: string) {
  return `ag-run-${runId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 32)}`;
}

describe('agent gateway provider capability enforcement', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let rootUserId: string | number;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'file-manager',
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
    rootUserId = rootUser.get('id') as string | number;
    rootAgent = await app.agent().login(rootUser);
  });

  afterEach(async () => {
    await app?.destroy();
  });

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

  async function createStoredStreamTicket(runId: string) {
    const ticket = createStreamToken();
    await app.db.getRepository('agTerminalStreamTickets').create({
      values: {
        id: randomUUID(),
        ticketHash: ticket.tokenHash,
        ticketLast4: ticket.tokenLast4,
        runId,
        userId: rootUserId,
        authenticator: 'basic',
        currentRole: 'root',
        currentRoles: ['root'],
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    return {
      ticket: ticket.token,
    };
  }

  async function seedProviderRun(
    provider: AgentProviderKey,
    options: {
      status?: string;
      terminal?: boolean;
      session?: boolean;
      providerSessionId?: string;
      profileCapabilities?: Record<string, unknown>;
      rawProfileCapabilities?: Record<string, unknown>;
      runProvider?: boolean;
      sessionCapabilities?: Record<string, unknown>;
      rawSessionCapabilities?: Record<string, unknown>;
    } = {},
  ): Promise<ProviderRun> {
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        id: randomUUID(),
        nodeKey: `provider-capability-${provider}-${randomUUID()}`,
        displayName: `Provider ${provider}`,
        status: 'active',
        authMode: 'node-token',
        capabilitiesJson: {
          maxConcurrency: 4,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        id: randomUUID(),
        nodeId,
        profileKey: provider,
        provider,
        displayName: provider,
        agentType: 'code',
        driver: 'exec',
        status: 'active',
        capabilitiesJson:
          options.rawProfileCapabilities ?? normalizeAgentProviderCapabilities(provider, options.profileCapabilities),
      },
    });
    const profileId = String(profile.get('id'));
    const runId = randomUUID();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        id: runId,
        runCode: `provider-capability-${provider}-${randomUUID()}`,
        status: options.status || 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: `Provider capability ${provider}`,
        },
        executionPayloadJson: {
          commandKey: provider,
          profileKey: provider,
          args: ['run', provider],
        },
        sourceType: 'provider-capability-test',
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        finishedAt: options.status === 'running' ? null : now,
        nodeId,
        agentProfileId: profileId,
        agentSessionProvider: options.runProvider ? provider : null,
        agentSessionProviderId: options.runProvider ? `${provider}-run-provider-${randomUUID()}` : null,
        terminalBackend: options.terminal ? 'tmux' : null,
        terminalStatus: options.terminal ? 'active' : null,
        terminalSessionName: options.terminal ? getManagedSessionName(runId) : null,
      },
    });

    if (!options.session) {
      return {
        nodeId,
        profileId,
        runId: String(run.get('id')),
      };
    }

    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider,
        providerSessionId: options.providerSessionId || `${provider}-session-${randomUUID()}`,
        rootRunId: run.get('id'),
        latestRunId: run.get('id'),
        status: options.status === 'running' ? 'active' : 'ended',
        capabilitiesJson:
          options.rawSessionCapabilities ?? normalizeAgentProviderCapabilities(provider, options.sessionCapabilities),
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: run.get('id'),
      values: {
        agentSessionId: session.get('id'),
        agentSessionProvider: provider,
        agentSessionProviderId: session.get('providerSessionId'),
      },
    });

    return {
      nodeId,
      profileId,
      runId: String(run.get('id')),
      sessionId: String(session.get('id')),
    };
  }

  it('returns normalized provider capabilities in run details', async () => {
    const seeded = await Promise.all(
      (['codex', 'opencode', 'claude-code', 'generic-cli'] as AgentProviderKey[]).map((provider) =>
        seedProviderRun(provider),
      ),
    );

    for (const entry of seeded) {
      const response = await rootAgent.get(`/agentGatewayApi:getRun/${entry.runId}`);
      expect(response.status).toBe(200);
      const run = getData(response);
      expect(run.agentProviderCapabilitiesJson).toMatchObject(
        normalizeAgentProviderCapabilities(String(run.agentProvider)),
      );
    }

    expect(normalizeAgentProviderCapabilities('codex', { liveSemanticMessage: true })).toMatchObject({
      liveSemanticMessage: false,
    });

    const optimisticCodexSession = await seedProviderRun('codex', {
      session: true,
      rawSessionCapabilities: {
        liveSemanticMessage: true,
        resumeSession: true,
      },
    });
    const optimisticCodexResponse = await rootAgent.get(`/agentGatewayApi:getRun/${optimisticCodexSession.runId}`);
    expect(optimisticCodexResponse.status).toBe(200);
    expect(getData(optimisticCodexResponse).agentProviderCapabilitiesJson).toMatchObject({
      liveSemanticMessage: false,
      resumeSession: true,
    });
  });

  it('rejects unsupported resume and terminal control server-side', async () => {
    const codex = await seedProviderRun('codex', { session: true });
    const opencodeResumeOnly = await seedProviderRun('opencode', {
      session: true,
      rawSessionCapabilities: {
        resumeSession: true,
      },
    });
    const genericEnded = await seedProviderRun('generic-cli', {
      session: true,
    });
    const genericRunning = await seedProviderRun('generic-cli', {
      status: 'running',
      terminal: true,
      session: true,
    });

    const resumeResponse = await rootAgent.post(`/agentGatewayApi:resumeAgentSession/${genericEnded.sessionId}`).send({
      message: 'Continue generic',
      idempotencyKey: 'generic-resume',
    });
    expect(resumeResponse.status).toBe(409);
    expect(JSON.stringify(resumeResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const codexResumeResponse = await rootAgent.post(`/agentGatewayApi:resumeAgentSession/${codex.sessionId}`).send({
      message: 'Continue codex',
      idempotencyKey: 'codex-resume',
    });
    expect(codexResumeResponse.status).toBe(200);

    const opencodeRunResponse = await rootAgent.get(`/agentGatewayApi:getRun/${opencodeResumeOnly.runId}`);
    expect(opencodeRunResponse.status).toBe(200);
    expect(getData(opencodeRunResponse).agentProviderCapabilitiesJson).toMatchObject({
      resumeSession: false,
      resumeWithMessage: false,
    });

    const opencodeResumeResponse = await rootAgent
      .post(`/agentGatewayApi:resumeAgentSession/${opencodeResumeOnly.sessionId}`)
      .send({
        message: 'Continue opencode',
        idempotencyKey: 'opencode-resume-only',
      });
    expect(opencodeResumeResponse.status).toBe(409);
    expect(JSON.stringify(opencodeResumeResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    for (const provider of ['opencode', 'claude-code'] as AgentProviderKey[]) {
      const rawResumeWithMessage = await seedProviderRun(provider, {
        session: true,
        rawSessionCapabilities: {
          resumeWithMessage: true,
        },
      });
      const runResponse = await rootAgent.get(`/agentGatewayApi:getRun/${rawResumeWithMessage.runId}`);
      expect(runResponse.status).toBe(200);
      expect(getData(runResponse).agentProviderCapabilitiesJson).toMatchObject({
        resumeSession: false,
        resumeWithMessage: false,
      });
      const response = await rootAgent
        .post(`/agentGatewayApi:resumeAgentSession/${rawResumeWithMessage.sessionId}`)
        .send({
          message: `Continue ${provider}`,
          idempotencyKey: `${provider}-resume-with-message-raw`,
        });
      expect(response.status).toBe(409);
      expect(JSON.stringify(response.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    }

    const interruptResponse = await rootAgent.post(`/agentGatewayApi:interruptTerminal/${genericRunning.runId}`).send({
      idempotencyKey: 'generic-interrupt',
    });
    expect(interruptResponse.status).toBe(409);
    expect(JSON.stringify(interruptResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const terminateResponse = await rootAgent.post(`/agentGatewayApi:terminateTerminal/${genericRunning.runId}`).send({
      idempotencyKey: 'generic-terminate',
    });
    expect(terminateResponse.status).toBe(200);
  });

  it('uses run capability summary when enforcing resume requests', async () => {
    const profileDisabledResume = await seedProviderRun('codex', {
      session: true,
      profileCapabilities: {
        resumeSession: false,
        resumeWithMessage: false,
      },
      rawSessionCapabilities: {},
    });

    const runResponse = await rootAgent.get(`/agentGatewayApi:getRun/${profileDisabledResume.runId}`);
    expect(runResponse.status).toBe(200);
    expect(getData(runResponse)).toMatchObject({
      agentProvider: 'codex',
      agentProviderCapabilitySource: 'profile',
      agentProviderCapabilitiesJson: {
        resumeSession: false,
        resumeWithMessage: false,
      },
    });

    const resumeResponse = await rootAgent
      .post(`/agentGatewayApi:resumeAgentSession/${profileDisabledResume.sessionId}`)
      .send({
        message: 'Continue codex with profile-disabled resume',
        idempotencyKey: 'codex-profile-disabled-resume',
      });
    expect(resumeResponse.status).toBe(409);
    expect(JSON.stringify(resumeResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const continuationRun = await app.db.getRepository('agRuns').findOne({
      filter: {
        agentSessionId: profileDisabledResume.sessionId,
        sourceType: 'agent-session-resume',
      },
    });
    expect(continuationRun).toBeFalsy();
  });

  it('rechecks run capability summary before returning an idempotent resume request', async () => {
    const profileBackedResume = await seedProviderRun('codex', {
      session: true,
      rawSessionCapabilities: {},
    });
    const idempotencyKey = 'codex-profile-rechecked-resume';
    const firstResponse = await rootAgent
      .post(`/agentGatewayApi:resumeAgentSession/${profileBackedResume.sessionId}`)
      .send({
        message: 'Continue codex once',
        idempotencyKey,
      });
    expect(firstResponse.status).toBe(200);
    expect(getData(firstResponse)).toMatchObject({
      resumedFromRunId: profileBackedResume.runId,
      deduped: false,
    });

    await app.db.getRepository('agAgentProfiles').update({
      filterByTk: profileBackedResume.profileId,
      values: {
        capabilitiesJson: normalizeAgentProviderCapabilities('codex', {
          resumeSession: false,
          resumeWithMessage: false,
        }),
      },
    });

    const runResponse = await rootAgent.get(`/agentGatewayApi:getRun/${profileBackedResume.runId}`);
    expect(runResponse.status).toBe(200);
    expect(getData(runResponse)).toMatchObject({
      agentProvider: 'codex',
      agentProviderCapabilitySource: 'profile',
      agentProviderCapabilitiesJson: {
        resumeSession: false,
        resumeWithMessage: false,
      },
    });

    const replayResponse = await rootAgent
      .post(`/agentGatewayApi:resumeAgentSession/${profileBackedResume.sessionId}`)
      .send({
        message: 'Continue codex once',
        idempotencyKey,
      });
    expect(replayResponse.status).toBe(409);
    expect(JSON.stringify(replayResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const continuationCount = await app.db.getRepository('agRuns').count({
      filter: {
        agentSessionId: profileBackedResume.sessionId,
        continuationReason: 'user-message',
      },
    });
    expect(continuationCount).toBe(1);
  });

  it('does not let capability bypass permissions', async () => {
    const generic = await seedProviderRun('generic-cli', {
      status: 'running',
      terminal: true,
      session: true,
    });
    const readOnlyAgent = await createUserAgent('provider-capability-read-only', ['agentGateway.readRuns']);
    const response = await readOnlyAgent.post(`/agentGatewayApi:terminateTerminal/${generic.runId}`).send({
      idempotencyKey: 'generic-terminate-no-permission',
    });

    expect(response.status).toBe(403);
  });

  it('returns unsupported states for generic artifacts and raw logs without leaking data', async () => {
    const generic = await seedProviderRun('generic-cli');
    await app.db.sequelize.transaction(async (transaction) => {
      await app.db.getRepository('agRunEvents').create({
        values: {
          id: randomUUID(),
          runId: generic.runId,
          claimAttempt: 1,
          source: 'agent',
          sequence: 1,
          level: 'info',
          eventType: 'agent.output',
          message: 'must-not-leak',
          payloadJson: {
            secret: 'RAW_EVENT_SECRET',
          },
          emittedAt: new Date(),
        },
        transaction,
      });
    });
    await app.db.getRepository('agRunArtifacts').create({
      values: {
        id: randomUUID(),
        runId: generic.runId,
        claimAttempt: 1,
        artifactKey: 'secret-artifact',
        artifactType: 'stdout',
        mimeType: 'text/plain',
        sizeBytes: 16,
        contentText: 'ARTIFACT_SECRET',
        metadataJson: {},
      },
    });

    const eventsResponse = await rootAgent.get(`/agentGatewayApi:listRunEvents/${generic.runId}`);
    expect(eventsResponse.status).toBe(409);
    expect(JSON.stringify(eventsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(eventsResponse.body)).not.toContain('RAW_EVENT_SECRET');

    const artifactsResponse = await rootAgent.get(`/agentGatewayApi:listRunArtifacts/${generic.runId}`);
    expect(artifactsResponse.status).toBe(409);
    expect(JSON.stringify(artifactsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(artifactsResponse.body)).not.toContain('ARTIFACT_SECRET');

    const directEventsResponse = await rootAgent.get('/api/agRunEvents:list');
    expect(directEventsResponse.status).toBe(403);
    expect(JSON.stringify(directEventsResponse.body)).not.toContain('RAW_EVENT_SECRET');

    const directArtifactsResponse = await rootAgent.get('/api/agRunArtifacts:list');
    expect(directArtifactsResponse.status).toBe(403);
    expect(JSON.stringify(directArtifactsResponse.body)).not.toContain('ARTIFACT_SECRET');
  });

  it('applies the generic capability floor to runs without provider identity', async () => {
    const now = new Date();
    const runId = randomUUID();
    await app.db.getRepository('agRuns').create({
      values: {
        id: runId,
        runCode: `provider-capability-fallback-${randomUUID()}`,
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: 'Fallback provider capability',
        },
        executionPayloadJson: {
          args: ['run'],
        },
        sourceType: 'provider-capability-test',
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        finishedAt: now,
      },
    });
    await app.db.sequelize.transaction(async (transaction) => {
      await app.db.getRepository('agRunEvents').create({
        values: {
          id: randomUUID(),
          runId,
          claimAttempt: 1,
          source: 'agent',
          sequence: 1,
          level: 'info',
          eventType: 'agent.output',
          message: 'must-not-leak-fallback',
          payloadJson: {
            secret: 'FALLBACK_RAW_EVENT_SECRET',
          },
          emittedAt: now,
        },
        transaction,
      });
    });
    await app.db.getRepository('agRunArtifacts').create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt: 1,
        artifactKey: 'fallback-secret-artifact',
        artifactType: 'stdout',
        mimeType: 'text/plain',
        sizeBytes: 24,
        contentText: 'FALLBACK_ARTIFACT_SECRET',
        metadataJson: {},
      },
    });

    const runResponse = await rootAgent.get(`/agentGatewayApi:getRun/${runId}`);
    expect(runResponse.status).toBe(200);
    expect(getData(runResponse)).toMatchObject({
      agentProvider: 'generic-cli',
      agentProviderCapabilitySource: 'fallback',
      agentProviderCapabilitiesJson: {
        structuredEvents: false,
        artifacts: false,
      },
    });

    const eventsResponse = await rootAgent.get(`/agentGatewayApi:listRunEvents/${runId}`);
    expect(eventsResponse.status).toBe(409);
    expect(JSON.stringify(eventsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(eventsResponse.body)).not.toContain('FALLBACK_RAW_EVENT_SECRET');

    const artifactsResponse = await rootAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`);
    expect(artifactsResponse.status).toBe(409);
    expect(JSON.stringify(artifactsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(artifactsResponse.body)).not.toContain('FALLBACK_ARTIFACT_SECRET');
  });

  it('ignores legacy command keys when an explicit profile provider is stored', async () => {
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        id: randomUUID(),
        nodeKey: `provider-capability-profile-key-${randomUUID()}`,
        displayName: 'Provider profile key fallback',
        status: 'active',
        authMode: 'node-token',
        capabilitiesJson: {
          maxConcurrency: 1,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        id: randomUUID(),
        nodeId: node.get('id'),
        profileKey: 'codex',
        provider: 'codex',
        displayName: 'Legacy Codex Named Profile',
        agentType: 'code',
        driver: 'exec',
        status: 'active',
        capabilitiesJson: {},
      },
    });
    const runId = randomUUID();
    await app.db.getRepository('agRuns').create({
      values: {
        id: runId,
        runCode: `provider-capability-profile-key-${randomUUID()}`,
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: 'Canonical-looking profile key must not imply Codex',
        },
        executionPayloadJson: {
          commandKey: 'node',
          profileKey: 'codex',
        },
        sourceType: 'provider-capability-test',
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        finishedAt: now,
        nodeId: node.get('id'),
        agentProfileId: profile.get('id'),
      },
    });
    await app.db.sequelize.transaction(async (transaction) => {
      await app.db.getRepository('agRunEvents').create({
        values: {
          id: randomUUID(),
          runId,
          claimAttempt: 1,
          source: 'agent',
          sequence: 1,
          level: 'info',
          eventType: 'agent.output',
          message: 'must-not-leak-profile-key',
          payloadJson: {
            secret: 'PROFILE_KEY_RAW_EVENT_SECRET',
          },
          emittedAt: now,
        },
        transaction,
      });
    });
    await app.db.getRepository('agRunArtifacts').create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt: 1,
        artifactKey: 'profile-key-secret-artifact',
        artifactType: 'stdout',
        mimeType: 'text/plain',
        sizeBytes: 25,
        contentText: 'PROFILE_KEY_ARTIFACT_SECRET',
        metadataJson: {},
      },
    });

    const runResponse = await rootAgent.get(`/agentGatewayApi:getRun/${runId}`);
    expect(runResponse.status).toBe(200);
    expect(getData(runResponse)).toMatchObject({
      agentProvider: 'codex',
      agentProviderCapabilitySource: 'profile',
      agentProviderCapabilitiesJson: {
        structuredEvents: true,
        artifacts: true,
      },
    });

    const eventsResponse = await rootAgent.get(`/agentGatewayApi:listRunEvents/${runId}`);
    expect(eventsResponse.status).toBe(200);
    expect(JSON.stringify(eventsResponse.body)).toContain('PROFILE_KEY_RAW_EVENT_SECRET');

    const artifactsResponse = await rootAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`);
    expect(artifactsResponse.status).toBe(200);
    expect(JSON.stringify(artifactsResponse.body)).not.toContain('PROFILE_KEY_ARTIFACT_SECRET');
  });

  it('uses explicit payload provider fields when no stored provider is available', async () => {
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        id: randomUUID(),
        nodeKey: `provider-capability-payload-provider-${randomUUID()}`,
        displayName: 'Payload Provider Node',
        status: 'active',
        authMode: 'node-token',
        capabilitiesJson: {
          maxConcurrency: 1,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const cases = [
      {
        payload: {
          provider: 'opencode',
        },
        expectedProvider: 'opencode',
      },
      {
        payload: {
          agentProvider: 'claude-code',
        },
        expectedProvider: 'claude-code',
      },
    ] as const;

    for (const entry of cases) {
      const runId = randomUUID();
      await app.db.getRepository('agRuns').create({
        values: {
          id: runId,
          runCode: `provider-capability-payload-provider-${randomUUID()}`,
          status: 'succeeded',
          claimAttempt: 1,
          leaseVersion: 1,
          cancelRequested: false,
          promptSnapshot: {
            text: `Payload provider ${entry.expectedProvider}`,
          },
          executionPayloadJson: entry.payload,
          sourceType: 'provider-capability-test',
          requestedAt: now,
          queuedAt: now,
          startedAt: now,
          finishedAt: now,
          nodeId: node.get('id'),
          agentProfileId: null,
        },
      });

      const runResponse = await rootAgent.get(`/agentGatewayApi:getRun/${runId}`);
      expect(runResponse.status).toBe(200);
      expect(getData(runResponse)).toMatchObject({
        agentProvider: entry.expectedProvider,
        agentProviderCapabilitySource: 'payload',
        agentProviderCapabilitiesJson: {
          terminalOutput: true,
          structuredEvents: true,
          liveSemanticMessage: false,
        },
      });
    }
  });

  it('does not let command key upgrade an explicitly generic payload provider', async () => {
    const now = new Date();
    const runId = randomUUID();
    await app.db.getRepository('agRuns').create({
      values: {
        id: runId,
        runCode: `provider-capability-explicit-generic-${randomUUID()}`,
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: 'Explicit generic provider beats command key',
        },
        executionPayloadJson: {
          provider: 'generic-cli',
          commandKey: 'codex',
        },
        sourceType: 'provider-capability-test',
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        finishedAt: now,
      },
    });
    await app.db.sequelize.transaction(async (transaction) => {
      await app.db.getRepository('agRunEvents').create({
        values: {
          id: randomUUID(),
          runId,
          claimAttempt: 1,
          source: 'agent',
          sequence: 1,
          level: 'info',
          eventType: 'agent.output',
          message: 'must-not-leak-explicit-generic',
          payloadJson: {
            secret: 'EXPLICIT_GENERIC_RAW_EVENT_SECRET',
          },
          emittedAt: now,
        },
        transaction,
      });
    });
    await app.db.getRepository('agRunArtifacts').create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt: 1,
        artifactKey: 'explicit-generic-secret-artifact',
        artifactType: 'stdout',
        mimeType: 'text/plain',
        sizeBytes: 32,
        contentText: 'EXPLICIT_GENERIC_ARTIFACT_SECRET',
        metadataJson: {},
      },
    });

    const runResponse = await rootAgent.get(`/agentGatewayApi:getRun/${runId}`);
    expect(runResponse.status).toBe(200);
    expect(getData(runResponse)).toMatchObject({
      agentProvider: 'generic-cli',
      agentProviderCapabilitySource: 'payload',
      agentProviderCapabilitiesJson: {
        structuredEvents: false,
        artifacts: false,
      },
    });

    const eventsResponse = await rootAgent.get(`/agentGatewayApi:listRunEvents/${runId}`);
    expect(eventsResponse.status).toBe(409);
    expect(JSON.stringify(eventsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(eventsResponse.body)).not.toContain('EXPLICIT_GENERIC_RAW_EVENT_SECRET');

    const artifactsResponse = await rootAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`);
    expect(artifactsResponse.status).toBe(409);
    expect(JSON.stringify(artifactsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(artifactsResponse.body)).not.toContain('EXPLICIT_GENERIC_ARTIFACT_SECRET');
  });

  it('rechecks provider capability before returning an idempotent terminal control request', async () => {
    const codex = await seedProviderRun('codex', {
      status: 'running',
      terminal: true,
    });
    const idempotencyKey = 'codex-interrupt-recheck';
    const firstResponse = await rootAgent.post(`/agentGatewayApi:interruptTerminal/${codex.runId}`).send({
      idempotencyKey,
    });
    expect(firstResponse.status).toBe(200);

    await app.db.getRepository('agAgentProfiles').update({
      filterByTk: codex.profileId,
      values: {
        capabilitiesJson: normalizeAgentProviderCapabilities('codex', {
          interrupt: false,
        }),
      },
    });

    const replayResponse = await rootAgent.post(`/agentGatewayApi:interruptTerminal/${codex.runId}`).send({
      idempotencyKey,
    });
    expect(replayResponse.status).toBe(409);
    expect(JSON.stringify(replayResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(replayResponse.body)).toContain('Agent CLI interrupt is not supported by this provider');
  });

  it('uses profile and stored session capability overrides when read routes resolve run capabilities', async () => {
    const profileOverride = await seedProviderRun('opencode', {
      profileCapabilities: {
        artifacts: false,
      },
      runProvider: true,
    });
    await app.db.getRepository('agRunArtifacts').create({
      values: {
        id: randomUUID(),
        runId: profileOverride.runId,
        claimAttempt: 1,
        artifactKey: 'profile-override-artifact',
        artifactType: 'stdout',
        mimeType: 'text/plain',
        sizeBytes: 23,
        contentText: 'PROFILE_OVERRIDE_SECRET',
        metadataJson: {},
      },
    });

    const profileRunResponse = await rootAgent.get(`/agentGatewayApi:getRun/${profileOverride.runId}`);
    expect(profileRunResponse.status).toBe(200);
    expect(getData(profileRunResponse).agentProvider).toBe('opencode');
    expect(getData(profileRunResponse).agentProviderCapabilitySource).toBe('profile');
    expect(getData(profileRunResponse).agentProviderCapabilitiesJson).toMatchObject({
      artifacts: false,
    });

    const artifactsResponse = await rootAgent.get(`/agentGatewayApi:listRunArtifacts/${profileOverride.runId}`);
    expect(artifactsResponse.status).toBe(409);
    expect(JSON.stringify(artifactsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(artifactsResponse.body)).not.toContain('PROFILE_OVERRIDE_SECRET');

    const partialSession = await seedProviderRun('opencode', {
      session: true,
      profileCapabilities: {
        artifacts: false,
      },
      rawSessionCapabilities: {},
    });
    const partialSessionRunResponse = await rootAgent.get(`/agentGatewayApi:getRun/${partialSession.runId}`);
    expect(partialSessionRunResponse.status).toBe(200);
    expect(getData(partialSessionRunResponse).agentProvider).toBe('opencode');
    expect(getData(partialSessionRunResponse).agentProviderCapabilitySource).toBe('profile');
    expect(getData(partialSessionRunResponse).agentProviderCapabilitiesJson).toMatchObject({
      artifacts: false,
    });

    const sessionOverride = await seedProviderRun('codex', {
      status: 'running',
      terminal: true,
      session: true,
      sessionCapabilities: {
        terminalOutput: false,
      },
    });

    const terminalResponse = await rootAgent.get(`/agentGatewayApi:getTerminalSnapshot/${sessionOverride.runId}`);
    expect(terminalResponse.status).toBe(409);
    expect(JSON.stringify(terminalResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(terminalResponse.body)).not.toContain(getManagedSessionName(sessionOverride.runId));

    const streamTicketResponse = await rootAgent.post(
      `/agentGatewayApi:createTerminalStreamTicket/${sessionOverride.runId}`,
    );
    expect(streamTicketResponse.status).toBe(409);
    expect(JSON.stringify(streamTicketResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const storedTicket = await createStoredStreamTicket(sessionOverride.runId);
    await expect(
      consumeTerminalStreamTicket({
        app,
        runId: sessionOverride.runId,
        ticket: storedTicket.ticket,
      }),
    ).rejects.toMatchObject({
      terminalCode: 'TERMINAL_PERMISSION_DENIED',
      message: 'Agent CLI terminal output is not supported by this provider',
    });

    const profileAliasOverride = await seedProviderRun('opencode', {
      rawProfileCapabilities: {
        supportsArtifacts: false,
      },
      runProvider: true,
    });
    await app.db.getRepository('agRunArtifacts').create({
      values: {
        id: randomUUID(),
        runId: profileAliasOverride.runId,
        claimAttempt: 1,
        artifactKey: 'profile-alias-artifact',
        artifactType: 'stdout',
        mimeType: 'text/plain',
        sizeBytes: 28,
        contentText: 'PROFILE_ALIAS_ARTIFACT_SECRET',
        metadataJson: {},
      },
    });

    const profileAliasRunResponse = await rootAgent.get(`/agentGatewayApi:getRun/${profileAliasOverride.runId}`);
    expect(profileAliasRunResponse.status).toBe(200);
    expect(getData(profileAliasRunResponse).agentProviderCapabilitySource).toBe('profile');
    expect(getData(profileAliasRunResponse).agentProviderCapabilitiesJson).toMatchObject({
      artifacts: false,
    });
    const profileAliasArtifactsResponse = await rootAgent.get(
      `/agentGatewayApi:listRunArtifacts/${profileAliasOverride.runId}`,
    );
    expect(profileAliasArtifactsResponse.status).toBe(409);
    expect(JSON.stringify(profileAliasArtifactsResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(JSON.stringify(profileAliasArtifactsResponse.body)).not.toContain('PROFILE_ALIAS_ARTIFACT_SECRET');

    const nestedSessionOverride = await seedProviderRun('opencode', {
      status: 'running',
      terminal: true,
      session: true,
      rawSessionCapabilities: {
        terminalStream: false,
        terminal: {
          interrupt: false,
        },
        terminalControl: {
          terminate: false,
        },
      },
    });
    const nestedRunResponse = await rootAgent.get(`/agentGatewayApi:getRun/${nestedSessionOverride.runId}`);
    expect(nestedRunResponse.status).toBe(200);
    expect(getData(nestedRunResponse).agentProviderCapabilitySource).toBe('session');
    expect(getData(nestedRunResponse).agentProviderCapabilitiesJson).toMatchObject({
      terminalOutput: false,
      interrupt: false,
      terminate: false,
    });

    const nestedTerminalResponse = await rootAgent.get(
      `/agentGatewayApi:getTerminalSnapshot/${nestedSessionOverride.runId}`,
    );
    expect(nestedTerminalResponse.status).toBe(409);
    expect(JSON.stringify(nestedTerminalResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const nestedInterruptResponse = await rootAgent
      .post(`/agentGatewayApi:interruptTerminal/${nestedSessionOverride.runId}`)
      .send({
        idempotencyKey: 'nested-session-interrupt',
      });
    expect(nestedInterruptResponse.status).toBe(409);
    expect(JSON.stringify(nestedInterruptResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const nestedTerminateResponse = await rootAgent
      .post(`/agentGatewayApi:terminateTerminal/${nestedSessionOverride.runId}`)
      .send({
        idempotencyKey: 'nested-session-terminate',
      });
    expect(nestedTerminateResponse.status).toBe(409);
    expect(JSON.stringify(nestedTerminateResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
  });
});

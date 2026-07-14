/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  AGENT_GATEWAY_API_ACTIONS,
  AGENT_GATEWAY_API_CONTRACTS,
  AGENT_GATEWAY_RUN_EXECUTION_PAYLOAD_FIELDS,
  AgentGatewayContractError,
  getAgentGatewayApiActionFromPath,
  getAgentGatewayApiPath,
  getAgentGatewayApiUrl,
  getUnknownRunExecutionPayloadField,
  parseAgentGatewayActionRequest,
  parseAgentGatewayActionQuery,
  parseAgentGatewayActionResponse,
} from '..';
import { normalizeAgentProviderCapabilities } from '../../providerCapabilities';

describe('Agent Gateway canonical API contracts', () => {
  it('defines exactly one contract for every action', () => {
    expect(Object.keys(AGENT_GATEWAY_API_CONTRACTS).sort()).toEqual(Object.values(AGENT_GATEWAY_API_ACTIONS).sort());
    for (const action of Object.values(AGENT_GATEWAY_API_ACTIONS)) {
      expect(AGENT_GATEWAY_API_CONTRACTS[action].action).toBe(action);
    }
  });

  it('builds canonical action URLs and paths', () => {
    expect(getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, 'run/1')).toBe('agentGatewayApi:getRun/run%2F1');
    expect(getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.getRun, 'run/1')).toBe(
      '/api/agentGatewayApi:getRun/run%2F1',
    );
    expect(getAgentGatewayApiActionFromPath('/api/agentGatewayApi:getRun/run%2F1?include=detail')).toBe(
      AGENT_GATEWAY_API_ACTIONS.getRun,
    );
  });

  it.each([
    [AGENT_GATEWAY_API_ACTIONS.createNodeInvitation, { expectedNodeKey: 'node-1', metadata: {} }],
    [AGENT_GATEWAY_API_ACTIONS.registerNode, { inviteToken: 'token', nodeKey: 'node-1', capabilities: {} }],
    [AGENT_GATEWAY_API_ACTIONS.upsertAgentSession, { provider: 'codex', capabilities: {} }],
    [AGENT_GATEWAY_API_ACTIONS.appendRunEvents, { eventType: 'run.started', payloadJson: {} }],
    [AGENT_GATEWAY_API_ACTIONS.appendConversationEvents, { events: [{ type: 'agent.message' }] }],
    [AGENT_GATEWAY_API_ACTIONS.importExternalRun, { provider: 'codex', metadata: {} }],
    [AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion, { skillKey: 'skill-1', manifest: {} }],
    [AGENT_GATEWAY_API_ACTIONS.createTaskTemplate, { templateKey: 'task', title: 'Legacy title' }],
  ])('rejects legacy fields for %s', (action, request) => {
    expect(() => parseAgentGatewayActionRequest(action, request)).toThrow(AgentGatewayContractError);
  });

  it('rejects unknown request fields instead of silently accepting them', () => {
    expect(() =>
      parseAgentGatewayActionRequest(AGENT_GATEWAY_API_ACTIONS.createNodeInvitation, {
        expectedNodeKey: 'node-1',
        metadataJson: {},
        unexpected: true,
      }),
    ).toThrow('Unknown request field: unexpected');
  });

  it('validates canonical query fields separately from request bodies', () => {
    expect(
      parseAgentGatewayActionQuery(AGENT_GATEWAY_API_ACTIONS.listRuns, {
        page: 2,
        pageSize: 20,
        filter: '{"status":"running"}',
      }),
    ).toEqual({ page: 2, pageSize: 20, filter: '{"status":"running"}' });
    expect(() =>
      parseAgentGatewayActionQuery(AGENT_GATEWAY_API_ACTIONS.listRuns, {
        page: 2,
        metadata: {},
      }),
    ).toThrow('Unknown query field: metadata');
    expect(
      parseAgentGatewayActionQuery(AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats, {
        runId: 'run-1',
        nodeId: 'node-1',
      }),
    ).toEqual({ runId: 'run-1', nodeId: 'node-1' });
    expect(() =>
      parseAgentGatewayActionQuery(AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats, {
        runId: 'run-1',
        includeGlobalStats: true,
      }),
    ).toThrow('Unknown query field: includeGlobalStats');
  });

  it('rejects non-canonical provider aliases', () => {
    expect(() =>
      parseAgentGatewayActionRequest(AGENT_GATEWAY_API_ACTIONS.importExternalRun, {
        provider: 'claude',
        externalRunKey: 'external-1',
      }),
    ).toThrow('provider is required and must be canonical');
  });

  it('parses response shapes and rejects public legacy response fields', () => {
    expect(
      parseAgentGatewayActionResponse(AGENT_GATEWAY_API_ACTIONS.listRuns, [
        { id: 'run-1', contentJson: { status: 'ok' } },
      ]),
    ).toEqual([{ id: 'run-1', contentJson: { status: 'ok' } }]);
    expect(
      parseAgentGatewayActionResponse(AGENT_GATEWAY_API_ACTIONS.listRuns, {
        rows: [{ id: 'run-1' }],
        count: 1,
        page: 1,
        pageSize: 20,
        totalPage: 1,
        taskTemplates: [],
      }),
    ).toMatchObject({ rows: [{ id: 'run-1' }], count: 1 });
    expect(() =>
      parseAgentGatewayActionResponse(AGENT_GATEWAY_API_ACTIONS.listRunEvents, [
        { id: 'event-1', payloadJson: { status: 'legacy' } },
      ]),
    ).toThrow('Legacy response[0] field is not allowed: payloadJson');
    expect(() => parseAgentGatewayActionResponse(AGENT_GATEWAY_API_ACTIONS.listRuns, {})).toThrow(
      'response.rows must be an array',
    );
  });

  it('preserves scheduling fields while removing legacy capability aliases', () => {
    expect(
      normalizeAgentProviderCapabilities('codex', {
        maxConcurrency: 4,
        executionPolicyKey: 'codex',
        terminalStream: false,
        terminalInput: true,
        supportsArtifacts: false,
      }),
    ).toMatchObject({
      maxConcurrency: 4,
      executionPolicyKey: 'codex',
      terminalOutput: true,
      stdinMessage: false,
      artifacts: true,
    });
    expect(
      normalizeAgentProviderCapabilities('codex', {
        terminalStream: false,
        terminalInput: true,
        supportsArtifacts: false,
      }),
    ).not.toMatchObject({
      terminalStream: expect.anything(),
      terminalInput: expect.anything(),
      supportsArtifacts: expect.anything(),
    });
  });

  it('defines a strict allowlist for claimed run execution payloads', () => {
    const canonicalPayload = Object.fromEntries(
      AGENT_GATEWAY_RUN_EXECUTION_PAYLOAD_FIELDS.map((field) => [field, null]),
    );

    expect(getUnknownRunExecutionPayloadField(canonicalPayload)).toBeUndefined();
    expect(
      getUnknownRunExecutionPayloadField({
        executionPolicyKey: 'codex',
        prompt: 'Build a page',
        cwd: '.',
        unexpectedField: true,
      }),
    ).toBe('unexpectedField');
  });

  it('accepts canonical nested conversation events', () => {
    expect(
      parseAgentGatewayActionRequest(AGENT_GATEWAY_API_ACTIONS.appendConversationEvents, {
        claimToken: 'claim',
        claimAttempt: 1,
        leaseVersion: 1,
        events: [
          {
            source: 'codex',
            sequence: 1,
            eventType: 'agent.message',
            contentJson: { text: 'done' },
          },
        ],
      }),
    ).toMatchObject({
      events: [{ eventType: 'agent.message', contentJson: { text: 'done' } }],
    });
  });

  it.each([
    [
      AGENT_GATEWAY_API_ACTIONS.createNodeInvitation,
      { expectedNodeKey: 'node-1', serverUrl: 'https://nocobase.example.test' },
    ],
    [
      AGENT_GATEWAY_API_ACTIONS.resumeAgentSession,
      { message: 'Continue', idempotencyKey: 'resume-1', resumedFromRunId: 'run-1' },
    ],
    [
      AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate,
      { templateId: 'template-1', collectionName: 'tickets', recordId: 1 },
    ],
    [
      AGENT_GATEWAY_API_ACTIONS.updateRunTerminal,
      {
        claimToken: 'claim',
        claimAttempt: 1,
        leaseVersion: 1,
        terminalStartedAt: '2026-07-13T00:00:00.000Z',
        terminalEndedAt: '2026-07-13T00:01:00.000Z',
      },
    ],
  ])('accepts canonical fields for %s', (action, request) => {
    expect(parseAgentGatewayActionRequest(action, request)).toEqual(request);
  });
});

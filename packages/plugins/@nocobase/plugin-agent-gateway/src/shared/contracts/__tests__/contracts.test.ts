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
  getAgentGatewayApiPath,
  getAgentGatewayApiUrl,
  getUnknownRunExecutionPayloadField,
  parseAgentGatewayActionRequest,
} from '..';

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

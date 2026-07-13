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
  AGENT_GATEWAY_ACCEPTANCE_PROVIDERS,
  AGENT_GATEWAY_BROWSER_SCENARIOS,
  AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS,
  AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS,
  AgentGatewayAcceptanceEvidence,
  AgentGatewayReleaseGateInput,
  evaluateAgentGatewayReleaseGate,
} from '../acceptance';

const startedAt = '2026-07-13T20:00:00.000Z';
const capturedAt = '2026-07-13T20:01:00.000Z';
const executionId = '019faaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee';
const anchors = {
  nodeId: 'node-1',
  runId: 'run-1',
  skillVersionId: 'skill-version-1',
  provider: 'codex' as const,
  providerSessionId: 'codex-session-1',
};

function createEvidence(): AgentGatewayAcceptanceEvidence {
  return {
    schemaVersion: 1,
    executionId,
    capturedAt,
    anchors,
    browser: Object.fromEntries(
      AGENT_GATEWAY_BROWSER_SCENARIOS.map((scenario) => [
        scenario,
        {
          status: 'passed',
          executionId,
          capturedAt,
          anchors,
          snapshotPath: `${scenario}/snapshot.json`,
          actionResultPath: `${scenario}/action.json`,
          mediaPaths: [`${scenario}/screen.png`],
          networkEvidencePaths: [`${scenario}/network.har`],
          consoleErrors: [],
        },
      ]),
    ),
    providers: Object.fromEntries(
      AGENT_GATEWAY_ACCEPTANCE_PROVIDERS.map((provider) => [
        provider,
        provider === 'codex'
          ? {
              status: 'passed',
              releaseRequired: true,
              source: 'real',
              executionId,
              capturedAt,
              runId: 'run-1',
              providerSessionId: 'codex-session-1',
              evidenceFiles: ['providers/codex.json'],
            }
          : {
              status: 'skipped',
              releaseRequired: false,
              source: 'real',
              executionId,
              capturedAt,
              evidenceFiles: [],
              reason: `${provider} is not required by this release matrix`,
            },
      ]),
    ),
    websocket: Object.fromEntries(
      AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS.map((scenario) => [
        scenario,
        scenario === 'crossOrigin'
          ? {
              status: 'passed',
              executionId,
              capturedAt,
              runId: 'run-1',
              expectedHttpStatus: 403,
              actualHttpStatus: 403,
              evidenceFiles: ['ws/cross-origin.har'],
            }
          : {
              status: 'passed',
              executionId,
              capturedAt,
              runId: 'run-1',
              expectedCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
              actualCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
              relatedRunId: scenario === 'crossRun' ? 'run-2' : undefined,
              evidenceFiles: [`ws/${scenario}.json`],
            },
      ]),
    ),
    multiInstance: {
      mode: 'multi-instance',
      file: 'passed',
      terminal: 'passed',
      executionId,
      capturedAt,
      evidenceFiles: ['multi-instance/file.json', 'multi-instance/terminal.json'],
    },
    findings: [],
  };
}

function createInput(): AgentGatewayReleaseGateInput {
  return {
    context: {
      schemaVersion: 1,
      executionId,
      startedAt,
      requiredProviders: ['codex'],
    },
    checks: AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS.map((id) => ({
      id,
      status: 'passed',
      startedAt,
      finishedAt: capturedAt,
      durationMs: 1,
      command: id,
      logPath: `logs/${id}.log`,
      warnings: [],
    })),
    packageEvidence: {
      status: 'passed',
      fileCount: 10,
      files: ['dist/server/index.js'],
      bannedFiles: [],
    },
    evidence: createEvidence(),
    generatedAt: capturedAt,
  };
}

describe('Agent Gateway release gate', () => {
  it('completes only when automated and live evidence is current and anchored', () => {
    expect(evaluateAgentGatewayReleaseGate(createInput())).toMatchObject({
      status: 'complete',
      failures: [],
      incomplete: [],
    });
  });

  it('rejects stale browser evidence and fixture provider passes', () => {
    const input = createInput();
    const evidence = input.evidence as AgentGatewayAcceptanceEvidence;
    const admin = evidence.browser?.admin;
    const codex = evidence.providers?.codex;
    expect(admin).toBeTruthy();
    expect(codex).toBeTruthy();
    if (admin) {
      admin.executionId = 'old-execution';
    }
    if (codex) {
      codex.source = 'fixture';
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('fixture evidence'),
        expect.stringContaining('Browser scenario admin is stale'),
      ]),
    );
  });

  it('does not treat generic WebSocket failures or empty anchors as successful denial evidence', () => {
    const input = createInput();
    const evidence = input.evidence as AgentGatewayAcceptanceEvidence;
    if (evidence.anchors) {
      evidence.anchors.runId = '';
    }
    const forged = evidence.websocket?.forgedTicket;
    expect(forged).toBeTruthy();
    if (forged) {
      forged.actualCode = 'SOCKET_CLOSED';
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toEqual(
      expect.arrayContaining([
        'Acceptance entity anchors must all be non-empty',
        expect.stringContaining('forgedTicket WebSocket denial'),
      ]),
    );
  });

  it('reports missing required tests and browser evidence as incomplete', () => {
    const input = createInput();
    input.checks = input.checks.filter((check) => check.id !== 'server.collections');
    input.evidence = undefined;

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('incomplete');
    expect(summary.incomplete).toEqual(
      expect.arrayContaining([
        'Required automated check server.collections has no result',
        'Live provider, browser, WebSocket, and multi-instance evidence is missing',
      ]),
    );
  });
});

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
  AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS,
  AGENT_GATEWAY_BROWSER_SCENARIOS,
  AGENT_GATEWAY_PROVIDER_MARKERS,
  AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS,
  AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS,
  AgentGatewayAcceptanceEvidence,
  AgentGatewayAcceptanceEvidenceFileValidation,
  AgentGatewayReleaseGateInput,
  evaluateAgentGatewayReleaseGate,
  getAgentGatewayLiveSourceProvenanceError,
  parseAgentGatewayVitestSkips,
} from '../acceptance';

const startedAt = '2026-07-13T20:00:00.000Z';
const capturedAt = '2026-07-13T20:01:00.000Z';
const executionId = '019faaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee';
const commit = '0123456789abcdef0123456789abcdef01234567';
const anchors = {
  nodeId: 'node-1',
  runId: 'run-1',
  skillVersionId: 'skill-version-1',
  provider: 'codex' as const,
  providerSessionId: 'codex-session-1',
};
const sourceInstanceId = 'instance-a';
const targetInstanceId = 'instance-b';
const terminalMarker = 'AGW_TERMINAL_CROSS_INSTANCE_019faaaa';

function createEvidence(): AgentGatewayAcceptanceEvidence {
  return {
    schemaVersion: 1,
    executionId,
    capturedAt,
    anchors: { ...anchors },
    browser: Object.fromEntries(
      AGENT_GATEWAY_BROWSER_SCENARIOS.map((scenario) => [
        scenario,
        {
          status: 'passed',
          executionId,
          capturedAt,
          anchors: { ...anchors },
          snapshotPath: `${scenario}/snapshot.json`,
          actionResultPath: `${scenario}/action.json`,
          consoleEvidencePath: `${scenario}/console-errors.json`,
          mediaPaths: [`${scenario}/screen.png`],
          networkEvidencePaths: [`${scenario}/network.har`],
          consoleErrors: [],
          checks: Object.fromEntries(AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS[scenario].map((check) => [check, true])),
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
              nodeId: 'node-1',
              skillVersionId: 'skill-version-1',
              outcome: 'succeeded',
              marker: AGENT_GATEWAY_PROVIDER_MARKERS.codex,
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
      skillUpload: 'passed',
      artifactPreview: 'passed',
      terminal: 'passed',
      executionId,
      capturedAt,
      evidenceFiles: ['multi-instance/file.json', 'multi-instance/terminal.json'],
      fileEvidencePath: 'multi-instance/file.json',
      terminalEvidencePath: 'multi-instance/terminal.json',
      sourceInstanceId,
      targetInstanceId,
      terminalMarker,
    },
    findings: [],
  };
}

function createInput(): AgentGatewayReleaseGateInput {
  const evidence = createEvidence();
  return {
    context: {
      schemaVersion: 1,
      executionId,
      startedAt,
      requiredProviders: ['codex'],
      repository: {
        branch: 'ai-task-platform-improve',
        commit,
        clean: true,
      },
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
    evidence,
    evidenceFiles: createEvidenceFileValidations(evidence),
    generatedAt: capturedAt,
  };
}

function createEvidenceFileValidations(evidence: AgentGatewayAcceptanceEvidence) {
  const validations: AgentGatewayAcceptanceEvidenceFileValidation[] = [];
  const add = (
    filePath: string,
    kind: AgentGatewayAcceptanceEvidenceFileValidation['kind'],
    content?: AgentGatewayAcceptanceEvidenceFileValidation['content'],
  ) => {
    validations.push({
      path: filePath,
      status: 'passed',
      kind,
      contained: true,
      regularFile: true,
      sizeBytes: 10,
      content,
    });
  };
  for (const browserEvidence of Object.values(evidence.browser || {})) {
    if (!browserEvidence) {
      continue;
    }
    const content = { executionId, ...anchors };
    add(browserEvidence.snapshotPath, 'json', content);
    add(browserEvidence.actionResultPath, 'json', { ...content, checks: browserEvidence.checks });
    add(browserEvidence.consoleEvidencePath, 'json', content);
    browserEvidence.mediaPaths.forEach((filePath) => add(filePath, 'media'));
    browserEvidence.networkEvidencePaths.forEach((filePath) => add(filePath, 'network'));
  }
  for (const [provider, providerEvidence] of Object.entries(evidence.providers || {})) {
    providerEvidence?.evidenceFiles.forEach((filePath) =>
      add(filePath, 'json', {
        executionId,
        provider: provider as 'codex' | 'claude-code' | 'opencode',
        runId: providerEvidence.runId,
        providerSessionId: providerEvidence.providerSessionId,
        nodeId: providerEvidence.nodeId,
        skillVersionId: providerEvidence.skillVersionId,
        outcome: providerEvidence.outcome,
        marker: providerEvidence.marker,
      }),
    );
  }
  for (const [scenario, denial] of Object.entries(evidence.websocket || {})) {
    denial?.evidenceFiles.forEach((filePath) =>
      add(filePath, filePath.endsWith('.har') ? 'network' : 'json', {
        executionId,
        runId: denial.runId,
        actualCode: denial.actualCode,
        actualHttpStatus: denial.actualHttpStatus,
        relatedRunId: scenario === 'crossRun' ? denial.relatedRunId : undefined,
      }),
    );
  }
  if (evidence.multiInstance?.mode === 'multi-instance') {
    add(evidence.multiInstance.fileEvidencePath || '', 'json', {
      executionId,
      ...anchors,
      sourceInstanceId,
      targetInstanceId,
      skillUpload: true,
      artifactPreview: true,
    });
    add(evidence.multiInstance.terminalEvidencePath || '', 'json', {
      executionId,
      ...anchors,
      sourceInstanceId,
      targetInstanceId,
      terminalMarker,
    });
  }
  return validations;
}

describe('Agent Gateway release gate', () => {
  it('requires canonical, refactor feature, security, upload, and cluster suites', () => {
    expect(AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS).toEqual(
      expect.arrayContaining([
        'static.repository-context',
        'static.api-alias-scan',
        'static.clean-tree',
        'contracts.canonical',
        'daemon.supervisor-modules',
        'daemon.execution-modules',
        'client.runs-features',
        'client.terminal-a11y',
        'server.security',
        'server.api-call-logging',
        'server.file-uploads',
        'server.run-domains',
        'multi-instance.terminal',
      ]),
    );
  });

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

  it('rejects browser evidence that does not prove the required scenario workflow', () => {
    const input = createInput();
    const evidence = input.evidence as AgentGatewayAcceptanceEvidence;
    const admin = evidence.browser?.admin;
    expect(admin).toBeTruthy();
    if (admin) {
      admin.checks.invitationCreated = false;
      const action = input.evidenceFiles?.find((file) => file.path === admin.actionResultPath);
      if (action?.content?.checks) {
        action.content.checks.invitationCreated = false;
      }
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toEqual(
      expect.arrayContaining([
        'Browser scenario admin did not prove invitationCreated',
        'Browser scenario admin action evidence does not prove invitationCreated',
      ]),
    );
  });

  it('rejects browser action files that contradict a passing scenario manifest', () => {
    const input = createInput();
    const admin = input.evidence?.browser?.admin;
    const action = input.evidenceFiles?.find((file) => file.path === admin?.actionResultPath);
    expect(action?.content?.checks).toBeTruthy();
    if (action?.content?.checks) {
      action.content.checks.invitationCreated = false;
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toContain('Browser scenario admin action evidence does not prove invitationCreated');
  });

  it('rejects copied console evidence without the current entity anchors', () => {
    const input = createInput();
    const consoleEvidence = input.evidenceFiles?.find((file) => file.path === 'admin/console-errors.json');
    expect(consoleEvidence?.content).toBeTruthy();
    if (consoleEvidence?.content) {
      consoleEvidence.content.skillVersionId = undefined;
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toContain(
      'Browser scenario admin evidence file admin/console-errors.json does not contain the current anchors',
    );
  });

  it('rejects arbitrary provider markers and incomplete multi-instance file flows', () => {
    const input = createInput();
    const evidence = input.evidence as AgentGatewayAcceptanceEvidence;
    const codex = evidence.providers?.codex;
    expect(codex).toBeTruthy();
    if (codex) {
      codex.marker = 'AGW_REAL_OTHER';
    }
    if (evidence.multiInstance) {
      evidence.multiInstance.skillUpload = 'pending';
      evidence.multiInstance.artifactPreview = 'failed';
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toEqual(
      expect.arrayContaining([
        'Provider codex pass is missing successful real-run proof',
        'Multi-instance artifact preview validation failed',
      ]),
    );
    expect(summary.incomplete).toContain('Multi-instance Skill upload validation is pending');
  });

  it('rejects provider file proof that does not match an otherwise valid provider manifest', () => {
    const input = createInput();
    const providerFile = input.evidenceFiles?.find((file) => file.path === 'providers/codex.json');
    expect(providerFile?.content).toBeTruthy();
    if (providerFile?.content) {
      providerFile.content.marker = 'AGW_REAL_OTHER';
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toContain(
      'Provider codex evidence files do not contain the current successful real-run proof',
    );
  });

  it('rejects false or misplaced multi-instance file and terminal semantics', () => {
    const input = createInput();
    const fileProof = input.evidenceFiles?.find((file) => file.path === 'multi-instance/file.json');
    const terminalProof = input.evidenceFiles?.find((file) => file.path === 'multi-instance/terminal.json');
    expect(fileProof?.content).toBeTruthy();
    expect(terminalProof?.content).toBeTruthy();
    if (fileProof?.content) {
      fileProof.content.skillUpload = false;
      fileProof.content.artifactPreview = false;
      fileProof.content.terminalMarker = terminalMarker;
    }
    if (terminalProof?.content) {
      terminalProof.content.artifactPreview = true;
      terminalProof.content.terminalMarker = 'OTHER_TERMINAL_MARKER';
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toEqual(
      expect.arrayContaining([
        'Multi-instance file evidence does not contain the current cross-instance file proof',
        'Multi-instance terminal evidence does not contain the current cross-instance terminal proof',
      ]),
    );
  });

  it('rejects multi-instance manifests that reuse one instance or omit exact evidence paths', () => {
    const input = createInput();
    const multiInstance = input.evidence?.multiInstance;
    expect(multiInstance).toBeTruthy();
    if (multiInstance) {
      multiInstance.targetInstanceId = sourceInstanceId;
      multiInstance.terminalEvidencePath = '';
      multiInstance.terminalMarker = '';
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toEqual(
      expect.arrayContaining([
        'Multi-instance evidence is missing file, terminal, instance, or marker proof',
        'Multi-instance evidence must identify distinct source and target instances',
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

  it('rejects dirty repository context and invalid or mismatched evidence files', () => {
    const input = createInput();
    input.context.repository.clean = false;
    const snapshot = input.evidenceFiles?.find((file) => file.path === 'admin/snapshot.json');
    expect(snapshot).toBeTruthy();
    if (snapshot) {
      snapshot.status = 'failed';
      snapshot.sizeBytes = 0;
      snapshot.reason = 'empty file';
      snapshot.content = { ...snapshot.content, runId: 'other-run' };
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('failed');
    expect(summary.failures).toEqual(
      expect.arrayContaining([
        'Acceptance context must be bound to a clean repository branch and commit',
        expect.stringContaining('Evidence file admin/snapshot.json is invalid'),
        expect.stringContaining('does not contain the current anchors'),
      ]),
    );
  });

  it('keeps required checks incomplete when Vitest reports internal skips', () => {
    const input = createInput();
    const runsCheck = input.checks.find((check) => check.id === 'client.runs-features');
    expect(runsCheck).toBeTruthy();
    if (runsCheck) {
      runsCheck.skippedTests = 2;
      runsCheck.skipDetails = ['Tests  10 passed | 2 skipped'];
    }

    const summary = evaluateAgentGatewayReleaseGate(input);
    expect(summary.status).toBe('incomplete');
    expect(summary.incomplete).toContain(
      'Required automated check client.runs-features contains 2 internally skipped test(s)',
    );
  });

  it('parses Vitest summary and individual skipped test output', () => {
    expect(
      parseAgentGatewayVitestSkips(`
 ↓ feature suite > requires a provider binary
 Test Files  1 passed (1)
      Tests  9 passed | 1 skipped (10)
`),
    ).toMatchObject({
      count: 1,
      details: expect.arrayContaining([expect.stringContaining('requires a provider binary')]),
    });
  });

  it('rejects stale or cross-execution raw live evidence provenance', () => {
    const context = createInput().context;
    expect(
      getAgentGatewayLiveSourceProvenanceError(context, {
        executionId,
        capturedAt,
      }),
    ).toBeUndefined();
    expect(
      getAgentGatewayLiveSourceProvenanceError(context, {
        executionId: 'old-execution',
        capturedAt,
      }),
    ).toContain('another acceptance execution');
    expect(
      getAgentGatewayLiveSourceProvenanceError(context, {
        executionId,
        capturedAt: '2026-07-13T19:59:59.000Z',
      }),
    ).toContain('stale');
    expect(
      getAgentGatewayLiveSourceProvenanceError(
        { ...context, startedAt: 'invalid' },
        {
          executionId,
          capturedAt,
        },
      ),
    ).toContain('invalid acceptance start timestamp');
  });
});

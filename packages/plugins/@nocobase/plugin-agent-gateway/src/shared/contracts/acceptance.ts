/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AGENT_GATEWAY_ACCEPTANCE_PROVIDERS = ['codex', 'claude-code', 'opencode'] as const;
export type AgentGatewayAcceptanceProvider = (typeof AGENT_GATEWAY_ACCEPTANCE_PROVIDERS)[number];

export const AGENT_GATEWAY_BROWSER_SCENARIOS = ['admin', 'union', 'restricted'] as const;
export type AgentGatewayBrowserScenario = (typeof AGENT_GATEWAY_BROWSER_SCENARIOS)[number];

export const AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS = [
  'missingTicket',
  'forgedTicket',
  'replayedTicket',
  'crossRun',
  'crossOrigin',
] as const;
export type AgentGatewayWebSocketDenialScenario = (typeof AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS)[number];

export const AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS = [
  'static.eslint',
  'static.diff',
  'static.build',
  'static.pack',
  'contracts.release-gate',
  'packaging.bootstrap',
  'daemon.runner',
  'daemon.lifecycle',
  'daemon.skill-sync',
  'daemon.terminal-stream',
  'daemon.exec-driver',
  'client.runs',
  'client.artifacts',
  'client.skills',
  'client.admin',
  'server.collections',
  'server.permissions',
  'server.node-lifecycle',
  'server.api-call-logging',
  'server.run-lifecycle',
  'server.external-imports',
  'server.run-observability',
  'server.conversation-events',
  'server.skill-versions',
  'server.terminal-auth',
  'server.terminal-broker',
  'integration.terminal-daemon',
  'server.retention',
  'server.maintenance-lease',
  'multi-instance.file',
  'multi-instance.terminal',
  'stress.backpressure',
  'fixtures.codex-adapter',
  'fixtures.claude-code-adapter',
  'fixtures.opencode-adapter',
] as const;
export type AgentGatewayAcceptanceCheckId = (typeof AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS)[number];

export type AgentGatewayAcceptanceCheckStatus = 'passed' | 'failed' | 'skipped';
export type AgentGatewayAcceptanceEvidenceStatus = 'passed' | 'failed' | 'skipped' | 'pending';
export type AgentGatewayReleaseGateStatus = 'complete' | 'failed' | 'incomplete';

export interface AgentGatewayAcceptanceContext {
  schemaVersion: 1;
  executionId: string;
  startedAt: string;
  requiredProviders: AgentGatewayAcceptanceProvider[];
}

export interface AgentGatewayAcceptanceCheck {
  id: AgentGatewayAcceptanceCheckId;
  status: AgentGatewayAcceptanceCheckStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  command: string;
  logPath: string;
  reason?: string;
  warnings: string[];
}

export interface AgentGatewayPackageEvidence {
  status: AgentGatewayAcceptanceEvidenceStatus;
  fileCount: number;
  files: string[];
  bannedFiles: string[];
  warning?: string;
}

export interface AgentGatewayAcceptanceAnchors {
  nodeId: string;
  runId: string;
  skillVersionId: string;
  provider: AgentGatewayAcceptanceProvider;
  providerSessionId: string;
}

export interface AgentGatewayConsoleErrorEvidence {
  message: string;
  explained: boolean;
  explanation?: string;
}

export interface AgentGatewayBrowserEvidence {
  status: AgentGatewayAcceptanceEvidenceStatus;
  executionId: string;
  capturedAt: string;
  anchors: AgentGatewayAcceptanceAnchors;
  snapshotPath: string;
  actionResultPath: string;
  mediaPaths: string[];
  networkEvidencePaths: string[];
  consoleErrors: AgentGatewayConsoleErrorEvidence[];
  reason?: string;
}

export interface AgentGatewayProviderEvidence {
  status: AgentGatewayAcceptanceEvidenceStatus;
  releaseRequired: boolean;
  source: 'real' | 'fixture';
  executionId: string;
  capturedAt: string;
  runId?: string;
  providerSessionId?: string;
  evidenceFiles: string[];
  reason?: string;
}

export interface AgentGatewayWebSocketDenialEvidence {
  status: AgentGatewayAcceptanceEvidenceStatus;
  executionId: string;
  capturedAt: string;
  runId: string;
  expectedCode?: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH';
  actualCode?: string;
  expectedHttpStatus?: 403;
  actualHttpStatus?: number;
  relatedRunId?: string;
  evidenceFiles: string[];
  reason?: string;
}

export interface AgentGatewayMultiInstanceEvidence {
  mode: 'multi-instance' | 'single-instance-fail-fast';
  file: AgentGatewayAcceptanceEvidenceStatus;
  terminal: AgentGatewayAcceptanceEvidenceStatus;
  failFast?: AgentGatewayAcceptanceEvidenceStatus;
  executionId: string;
  capturedAt: string;
  evidenceFiles: string[];
  reason?: string;
}

export interface AgentGatewayAcceptanceFinding {
  severity: 'Critical' | 'Important' | 'Minor';
  status: 'open' | 'resolved';
  message: string;
}

export interface AgentGatewayAcceptanceEvidence {
  schemaVersion: 1;
  executionId: string;
  capturedAt: string;
  anchors?: AgentGatewayAcceptanceAnchors;
  browser?: Partial<Record<AgentGatewayBrowserScenario, AgentGatewayBrowserEvidence>>;
  providers?: Partial<Record<AgentGatewayAcceptanceProvider, AgentGatewayProviderEvidence>>;
  websocket?: Partial<Record<AgentGatewayWebSocketDenialScenario, AgentGatewayWebSocketDenialEvidence>>;
  multiInstance?: AgentGatewayMultiInstanceEvidence;
  findings?: AgentGatewayAcceptanceFinding[];
}

export interface AgentGatewayReleaseGateInput {
  context: AgentGatewayAcceptanceContext;
  checks: AgentGatewayAcceptanceCheck[];
  packageEvidence?: AgentGatewayPackageEvidence;
  evidence?: AgentGatewayAcceptanceEvidence;
  generatedAt: string;
}

export interface AgentGatewayReleaseGateSummary extends AgentGatewayReleaseGateInput {
  status: AgentGatewayReleaseGateStatus;
  failures: string[];
  incomplete: string[];
  warnings: string[];
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function isCurrentEvidence(context: AgentGatewayAcceptanceContext, executionId: string, capturedAt: string) {
  return executionId === context.executionId && Date.parse(capturedAt) >= Date.parse(context.startedAt);
}

function sameAnchors(left: AgentGatewayAcceptanceAnchors, right: AgentGatewayAcceptanceAnchors) {
  return (
    left.nodeId === right.nodeId &&
    left.runId === right.runId &&
    left.skillVersionId === right.skillVersionId &&
    left.provider === right.provider &&
    left.providerSessionId === right.providerSessionId
  );
}

function evaluateChecks(input: AgentGatewayReleaseGateInput, failures: string[], incomplete: string[]) {
  const checksById = new Map(input.checks.map((check) => [check.id, check]));
  for (const id of AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS) {
    const check = checksById.get(id);
    if (!check) {
      incomplete.push(`Required automated check ${id} has no result`);
      continue;
    }
    if (check.status === 'failed') {
      failures.push(`Required automated check ${id} failed`);
    }
    if (check.status === 'skipped') {
      incomplete.push(`Required automated check ${id} was skipped: ${check.reason || 'no reason provided'}`);
    }
  }
}

function evaluatePackage(input: AgentGatewayReleaseGateInput, failures: string[], incomplete: string[]) {
  const packageEvidence = input.packageEvidence;
  if (!packageEvidence) {
    incomplete.push('Package inventory evidence is missing');
    return;
  }
  if (packageEvidence.status === 'failed') {
    failures.push('Package inventory validation failed');
  } else if (packageEvidence.status !== 'passed') {
    incomplete.push(`Package inventory validation is ${packageEvidence.status}`);
  }
  if (packageEvidence.bannedFiles.length) {
    failures.push(`Package contains banned files: ${packageEvidence.bannedFiles.join(', ')}`);
  }
}

function evaluateProviders(
  context: AgentGatewayAcceptanceContext,
  evidence: AgentGatewayAcceptanceEvidence,
  failures: string[],
  incomplete: string[],
) {
  const requiredProviders = new Set(context.requiredProviders);
  for (const provider of AGENT_GATEWAY_ACCEPTANCE_PROVIDERS) {
    const providerEvidence = evidence.providers?.[provider];
    if (!providerEvidence) {
      incomplete.push(`Provider ${provider} has no explicit real-run or skipped evidence`);
      continue;
    }
    const required = requiredProviders.has(provider) || providerEvidence.releaseRequired;
    if (!isCurrentEvidence(context, providerEvidence.executionId, providerEvidence.capturedAt)) {
      failures.push(`Provider ${provider} evidence is stale or belongs to another execution`);
    }
    if (providerEvidence.status === 'failed') {
      failures.push(
        `Provider ${provider} real-run acceptance failed: ${providerEvidence.reason || 'no reason provided'}`,
      );
      continue;
    }
    if (providerEvidence.status === 'passed') {
      if (providerEvidence.source !== 'real') {
        failures.push(`Provider ${provider} fixture evidence is labeled as a real provider pass`);
      }
      if (!hasText(providerEvidence.runId) || !hasText(providerEvidence.providerSessionId)) {
        failures.push(`Provider ${provider} pass is missing run or provider session anchors`);
      }
      if (
        evidence.anchors?.provider === provider &&
        (providerEvidence.runId !== evidence.anchors.runId ||
          providerEvidence.providerSessionId !== evidence.anchors.providerSessionId)
      ) {
        failures.push(`Provider ${provider} pass does not match the current browser run and session anchors`);
      }
      if (!providerEvidence.evidenceFiles.length) {
        failures.push(`Provider ${provider} pass has no evidence files`);
      }
      continue;
    }
    if (required) {
      incomplete.push(`Required provider ${provider} did not complete a real run`);
      continue;
    }
    if (providerEvidence.status !== 'skipped' || !hasText(providerEvidence.reason)) {
      incomplete.push(`Optional provider ${provider} must pass a real run or be skipped with a reason`);
    }
  }
}

function evaluateBrowser(
  context: AgentGatewayAcceptanceContext,
  evidence: AgentGatewayAcceptanceEvidence,
  failures: string[],
  incomplete: string[],
) {
  if (!evidence.anchors) {
    incomplete.push('Current node, run, Skill version, and provider session anchors are missing');
    return;
  }
  const anchors = evidence.anchors;
  if (
    !hasText(anchors.nodeId) ||
    !hasText(anchors.runId) ||
    !hasText(anchors.skillVersionId) ||
    !hasText(anchors.providerSessionId)
  ) {
    failures.push('Acceptance entity anchors must all be non-empty');
  }
  for (const scenario of AGENT_GATEWAY_BROWSER_SCENARIOS) {
    const browserEvidence = evidence.browser?.[scenario];
    if (!browserEvidence) {
      incomplete.push(`Browser scenario ${scenario} has no evidence`);
      continue;
    }
    if (browserEvidence.status === 'failed') {
      failures.push(`Browser scenario ${scenario} failed: ${browserEvidence.reason || 'no reason provided'}`);
    } else if (browserEvidence.status !== 'passed') {
      incomplete.push(`Browser scenario ${scenario} is ${browserEvidence.status}`);
    }
    if (!isCurrentEvidence(context, browserEvidence.executionId, browserEvidence.capturedAt)) {
      failures.push(`Browser scenario ${scenario} is stale or belongs to another execution`);
    }
    if (!sameAnchors(anchors, browserEvidence.anchors)) {
      failures.push(`Browser scenario ${scenario} does not match the current entity anchors`);
    }
    if (
      !hasText(browserEvidence.snapshotPath) ||
      !hasText(browserEvidence.actionResultPath) ||
      !browserEvidence.mediaPaths.length ||
      !browserEvidence.networkEvidencePaths.length
    ) {
      failures.push(`Browser scenario ${scenario} is missing snapshot, action, media, or network evidence`);
    }
    for (const consoleError of browserEvidence.consoleErrors) {
      if (!consoleError.explained || !hasText(consoleError.explanation)) {
        failures.push(`Browser scenario ${scenario} has an unexplained console error: ${consoleError.message}`);
      }
    }
  }
}

function evaluateWebSocket(
  context: AgentGatewayAcceptanceContext,
  evidence: AgentGatewayAcceptanceEvidence,
  failures: string[],
  incomplete: string[],
) {
  for (const scenario of AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS) {
    const denial = evidence.websocket?.[scenario];
    if (!denial) {
      incomplete.push(`WebSocket denial scenario ${scenario} has no evidence`);
      continue;
    }
    if (denial.status === 'failed') {
      failures.push(`WebSocket denial scenario ${scenario} failed: ${denial.reason || 'no reason provided'}`);
    } else if (denial.status !== 'passed') {
      incomplete.push(`WebSocket denial scenario ${scenario} is ${denial.status}`);
    }
    if (!isCurrentEvidence(context, denial.executionId, denial.capturedAt)) {
      failures.push(`WebSocket denial scenario ${scenario} is stale or belongs to another execution`);
    }
    if (!denial.evidenceFiles.length) {
      failures.push(`WebSocket denial scenario ${scenario} has no HAR or frame evidence`);
    }
    if (evidence.anchors && denial.runId !== evidence.anchors.runId) {
      failures.push(`WebSocket denial scenario ${scenario} does not match the current run anchor`);
    }
    if (scenario === 'crossRun' && (!hasText(denial.relatedRunId) || denial.relatedRunId === evidence.anchors?.runId)) {
      failures.push('Cross-run WebSocket denial must identify a distinct related run');
    }
    if (scenario === 'crossOrigin') {
      if (denial.expectedHttpStatus !== 403 || denial.actualHttpStatus !== 403) {
        failures.push('Cross-origin WebSocket denial must return HTTP 403');
      }
    } else if (
      denial.expectedCode !== 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH' ||
      denial.actualCode !== 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH'
    ) {
      failures.push(`${scenario} WebSocket denial must return TERMINAL_STREAM_TICKET_SCOPE_MISMATCH`);
    }
  }
}

function evaluateMultiInstance(
  context: AgentGatewayAcceptanceContext,
  evidence: AgentGatewayAcceptanceEvidence,
  failures: string[],
  incomplete: string[],
) {
  const multiInstance = evidence.multiInstance;
  if (!multiInstance) {
    incomplete.push('Multi-instance file and terminal evidence is missing');
    return;
  }
  if (!isCurrentEvidence(context, multiInstance.executionId, multiInstance.capturedAt)) {
    failures.push('Multi-instance evidence is stale or belongs to another execution');
  }
  if (!multiInstance.evidenceFiles.length) {
    failures.push('Multi-instance evidence has no attached files');
  }
  if (multiInstance.mode === 'single-instance-fail-fast') {
    if (multiInstance.failFast === 'failed') {
      failures.push('Single-instance fail-fast validation failed');
    } else if (multiInstance.failFast !== 'passed') {
      incomplete.push('Single-instance mode does not have a passing fail-fast check');
    }
    return;
  }
  if (multiInstance.file === 'failed') {
    failures.push('Multi-instance file validation failed');
  } else if (multiInstance.file !== 'passed') {
    incomplete.push(`Multi-instance file validation is ${multiInstance.file}`);
  }
  if (multiInstance.terminal === 'failed') {
    failures.push('Multi-instance terminal validation failed');
  } else if (multiInstance.terminal !== 'passed') {
    incomplete.push(`Multi-instance terminal validation is ${multiInstance.terminal}`);
  }
}

export function evaluateAgentGatewayReleaseGate(input: AgentGatewayReleaseGateInput): AgentGatewayReleaseGateSummary {
  const failures: string[] = [];
  const incomplete: string[] = [];
  const warnings = input.checks.flatMap((check) => check.warnings.map((warning) => `${check.id}: ${warning}`));

  if (input.context.schemaVersion !== 1 || !hasText(input.context.executionId)) {
    failures.push('Acceptance context schema or execution ID is invalid');
  }

  evaluateChecks(input, failures, incomplete);
  evaluatePackage(input, failures, incomplete);

  const evidence = input.evidence;
  if (!evidence) {
    incomplete.push('Live provider, browser, WebSocket, and multi-instance evidence is missing');
  } else {
    if (evidence.schemaVersion !== 1) {
      failures.push('Acceptance evidence schema version is invalid');
    }
    if (!isCurrentEvidence(input.context, evidence.executionId, evidence.capturedAt)) {
      failures.push('Acceptance evidence is stale or belongs to another execution');
    }
    evaluateProviders(input.context, evidence, failures, incomplete);
    evaluateBrowser(input.context, evidence, failures, incomplete);
    evaluateWebSocket(input.context, evidence, failures, incomplete);
    evaluateMultiInstance(input.context, evidence, failures, incomplete);
    for (const finding of evidence.findings || []) {
      if ((finding.severity === 'Critical' || finding.severity === 'Important') && finding.status !== 'resolved') {
        failures.push(`Unresolved ${finding.severity} finding: ${finding.message}`);
      }
    }
  }

  return {
    ...input,
    status: failures.length ? 'failed' : incomplete.length ? 'incomplete' : 'complete',
    failures,
    incomplete,
    warnings,
  };
}

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

export const AGENT_GATEWAY_PROVIDER_MARKERS = {
  codex: 'AGW_REAL_CODEX',
  'claude-code': 'AGW_REAL_CLAUDE_CODE',
  opencode: 'AGW_REAL_OPENCODE',
} as const satisfies Record<AgentGatewayAcceptanceProvider, string>;

export const AGENT_GATEWAY_BROWSER_SCENARIOS = ['admin', 'union', 'restricted'] as const;
export type AgentGatewayBrowserScenario = (typeof AGENT_GATEWAY_BROWSER_SCENARIOS)[number];

export const AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS = {
  admin: [
    'adminShellVisible',
    'invitationCreated',
    'nodeRegistered',
    'skillUploaded',
    'taskCreated',
    'runVisible',
    'terminalVisible',
    'conversationVisible',
    'eventsVisible',
    'snapshotsVisible',
    'artifactsVisible',
    'apiLogsVisible',
    'controlMatrixVerified',
    'externalImportsVerified',
    'taskTemplatesVisible',
    'configPagesVisible',
  ],
  union: ['unionRole', 'runVisible', 'terminalVisible'],
  restricted: ['runDenied', 'rawLogsDenied', 'artifactsDenied', 'terminalDenied', 'controlDenied', 'uiDenied'],
} as const satisfies Record<AgentGatewayBrowserScenario, readonly string[]>;

export const AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS = [
  'missingTicket',
  'forgedTicket',
  'replayedTicket',
  'crossRun',
  'crossOrigin',
] as const;
export type AgentGatewayWebSocketDenialScenario = (typeof AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS)[number];

export const AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS = [
  'static.repository-context',
  'static.eslint',
  'static.diff',
  'static.api-alias-scan',
  'static.build',
  'static.pack',
  'static.clean-tree',
  'contracts.release-gate',
  'contracts.canonical',
  'packaging.bootstrap',
  'daemon.runner',
  'daemon.lifecycle',
  'daemon.skill-sync',
  'daemon.terminal-stream',
  'daemon.exec-driver',
  'daemon.tmux-terminal',
  'daemon.run-control-requests',
  'daemon.supervisor-modules',
  'daemon.execution-modules',
  'client.runs',
  'client.runs-features',
  'client.skills',
  'client.admin',
  'client.terminal-a11y',
  'server.collections',
  'server.permissions',
  'server.security',
  'server.node-lifecycle',
  'server.api-call-logging',
  'server.file-uploads',
  'server.dispatch-bindings',
  'server.run-lifecycle',
  'server.run-terminal',
  'server.run-domains',
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
  repository: AgentGatewayAcceptanceRepositoryContext;
}

export interface AgentGatewayAcceptanceRepositoryContext {
  branch: string;
  commit: string;
  clean: boolean;
}

export interface AgentGatewayLiveSourceProvenance {
  executionId?: string;
  capturedAt?: string;
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
  skippedTests?: number;
  skipDetails?: string[];
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
  consoleEvidencePath: string;
  mediaPaths: string[];
  networkEvidencePaths: string[];
  consoleErrors: AgentGatewayConsoleErrorEvidence[];
  checks: Record<string, boolean>;
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
  nodeId?: string;
  skillVersionId?: string;
  outcome?: 'succeeded';
  marker?: string;
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
  skillUpload: AgentGatewayAcceptanceEvidenceStatus;
  artifactPreview: AgentGatewayAcceptanceEvidenceStatus;
  terminal: AgentGatewayAcceptanceEvidenceStatus;
  failFast?: AgentGatewayAcceptanceEvidenceStatus;
  executionId: string;
  capturedAt: string;
  evidenceFiles: string[];
  fileEvidencePath?: string;
  terminalEvidencePath?: string;
  sourceInstanceId?: string;
  targetInstanceId?: string;
  terminalMarker?: string;
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

export interface AgentGatewayAcceptanceEvidenceFileContent {
  executionId?: string;
  nodeId?: string;
  runId?: string;
  skillVersionId?: string;
  provider?: AgentGatewayAcceptanceProvider;
  providerSessionId?: string;
  outcome?: string;
  marker?: string;
  checks?: Record<string, boolean>;
  sourceInstanceId?: string;
  targetInstanceId?: string;
  skillUpload?: boolean;
  artifactPreview?: boolean;
  terminalMarker?: string;
  actualCode?: string;
  actualHttpStatus?: number;
  relatedRunId?: string;
}

export interface AgentGatewayAcceptanceEvidenceFileValidation {
  path: string;
  status: 'passed' | 'failed';
  kind: 'json' | 'network' | 'media';
  contained: boolean;
  regularFile: boolean;
  sizeBytes: number;
  content?: AgentGatewayAcceptanceEvidenceFileContent;
  reason?: string;
}

export interface AgentGatewayReleaseGateInput {
  context: AgentGatewayAcceptanceContext;
  checks: AgentGatewayAcceptanceCheck[];
  packageEvidence?: AgentGatewayPackageEvidence;
  evidence?: AgentGatewayAcceptanceEvidence;
  evidenceFiles?: AgentGatewayAcceptanceEvidenceFileValidation[];
  generatedAt: string;
}

export interface AgentGatewayReleaseGateSummary extends AgentGatewayReleaseGateInput {
  status: AgentGatewayReleaseGateStatus;
  failures: string[];
  incomplete: string[];
  warnings: string[];
}

export function parseAgentGatewayVitestSkips(output: string) {
  const details = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('↓') || /\b(?:SKIP|skipped)\b/.test(line))
    .slice(0, 100);
  const summaryCounts = [...output.matchAll(/(?:Tests?|Test Files)\s+[^\r\n]*?(\d+)\s+skipped/gi)].map((match) =>
    Number(match[1]),
  );
  return {
    count: summaryCounts.length ? Math.max(...summaryCounts) : details.filter((line) => line.startsWith('↓')).length,
    details,
  };
}

export function getAgentGatewayLiveSourceProvenanceError(
  context: AgentGatewayAcceptanceContext,
  source: AgentGatewayLiveSourceProvenance,
  label = 'Live evidence source',
) {
  if (source.executionId !== context.executionId) {
    return `${label} belongs to another acceptance execution`;
  }
  const startedAt = Date.parse(context.startedAt);
  if (!Number.isFinite(startedAt)) {
    return `${label} cannot be validated against an invalid acceptance start timestamp`;
  }
  const capturedAt = Date.parse(source.capturedAt || '');
  if (!Number.isFinite(capturedAt) || capturedAt < startedAt) {
    return `${label} is stale or has an invalid capturedAt timestamp`;
  }
  return undefined;
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

function contentMatchesAnchors(
  content: AgentGatewayAcceptanceEvidenceFileContent | undefined,
  executionId: string,
  anchors: AgentGatewayAcceptanceAnchors,
) {
  return (
    content?.executionId === executionId &&
    content.nodeId === anchors.nodeId &&
    content.runId === anchors.runId &&
    content.skillVersionId === anchors.skillVersionId &&
    content.provider === anchors.provider &&
    content.providerSessionId === anchors.providerSessionId
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
    if (check.status !== 'skipped' && (check.skippedTests || 0) > 0) {
      incomplete.push(`Required automated check ${id} contains ${check.skippedTests} internally skipped test(s)`);
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

function getEvidencePaths(evidence: AgentGatewayAcceptanceEvidence) {
  const paths = new Set<string>();
  for (const browserEvidence of Object.values(evidence.browser || {})) {
    if (!browserEvidence) {
      continue;
    }
    paths.add(browserEvidence.snapshotPath);
    paths.add(browserEvidence.actionResultPath);
    paths.add(browserEvidence.consoleEvidencePath);
    browserEvidence.mediaPaths.forEach((filePath) => paths.add(filePath));
    browserEvidence.networkEvidencePaths.forEach((filePath) => paths.add(filePath));
  }
  for (const providerEvidence of Object.values(evidence.providers || {})) {
    providerEvidence?.evidenceFiles.forEach((filePath) => paths.add(filePath));
  }
  for (const denialEvidence of Object.values(evidence.websocket || {})) {
    denialEvidence?.evidenceFiles.forEach((filePath) => paths.add(filePath));
  }
  evidence.multiInstance?.evidenceFiles.forEach((filePath) => paths.add(filePath));
  paths.delete('');
  return paths;
}

function evaluateEvidenceFiles(
  input: AgentGatewayReleaseGateInput,
  evidence: AgentGatewayAcceptanceEvidence,
  failures: string[],
  incomplete: string[],
) {
  if (!input.evidenceFiles) {
    incomplete.push('Live evidence files were not validated against the current evidence directory');
    return;
  }
  const validations = new Map(input.evidenceFiles.map((validation) => [validation.path, validation]));
  for (const filePath of getEvidencePaths(evidence)) {
    const validation = validations.get(filePath);
    if (!validation) {
      failures.push(`Evidence file ${filePath} was declared but not validated`);
      continue;
    }
    if (
      validation.status !== 'passed' ||
      !validation.contained ||
      !validation.regularFile ||
      validation.sizeBytes <= 0
    ) {
      failures.push(`Evidence file ${filePath} is invalid: ${validation.reason || 'file validation failed'}`);
    }
  }

  const anchors = evidence.anchors;
  if (!anchors) {
    return;
  }
  for (const [scenario, browserEvidence] of Object.entries(evidence.browser || {})) {
    if (!browserEvidence || browserEvidence.status !== 'passed') {
      continue;
    }
    for (const filePath of [
      browserEvidence.snapshotPath,
      browserEvidence.actionResultPath,
      browserEvidence.consoleEvidencePath,
    ]) {
      if (!contentMatchesAnchors(validations.get(filePath)?.content, evidence.executionId, anchors)) {
        failures.push(`Browser scenario ${scenario} evidence file ${filePath} does not contain the current anchors`);
      }
    }
    const actionContent = validations.get(browserEvidence.actionResultPath)?.content;
    for (const check of AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS[scenario as AgentGatewayBrowserScenario]) {
      if (actionContent?.checks?.[check] !== true) {
        failures.push(`Browser scenario ${scenario} action evidence does not prove ${check}`);
      }
    }
  }
  for (const [provider, providerEvidence] of Object.entries(evidence.providers || {})) {
    if (!providerEvidence || providerEvidence.status !== 'passed') {
      continue;
    }
    const hasMatchingContent = providerEvidence.evidenceFiles.some((filePath) => {
      const content = validations.get(filePath)?.content;
      return (
        content?.executionId === evidence.executionId &&
        content.provider === provider &&
        content.runId === providerEvidence.runId &&
        content.providerSessionId === providerEvidence.providerSessionId &&
        content.nodeId === providerEvidence.nodeId &&
        content.skillVersionId === providerEvidence.skillVersionId &&
        content.outcome === providerEvidence.outcome &&
        content.marker === providerEvidence.marker
      );
    });
    if (!hasMatchingContent) {
      failures.push(`Provider ${provider} evidence files do not contain the current successful real-run proof`);
    }
  }
  for (const [scenario, denial] of Object.entries(evidence.websocket || {})) {
    if (!denial || denial.status !== 'passed') {
      continue;
    }
    const hasMatchingContent = denial.evidenceFiles.some((filePath) => {
      const content = validations.get(filePath)?.content;
      if (content?.executionId !== evidence.executionId || content.runId !== denial.runId) {
        return false;
      }
      if (scenario === 'crossOrigin') {
        return content.actualHttpStatus === denial.actualHttpStatus;
      }
      return (
        content.actualCode === denial.actualCode &&
        (scenario !== 'crossRun' || content.relatedRunId === denial.relatedRunId)
      );
    });
    if (!hasMatchingContent) {
      failures.push(`WebSocket denial scenario ${scenario} evidence files do not contain the asserted code or status`);
    }
  }
  if (evidence.multiInstance) {
    const multiInstance = evidence.multiInstance;
    if (multiInstance.mode === 'multi-instance') {
      const fileContent = validations.get(multiInstance.fileEvidencePath || '')?.content;
      const terminalContent = validations.get(multiInstance.terminalEvidencePath || '')?.content;
      const instanceProofMatches = (content: AgentGatewayAcceptanceEvidenceFileContent | undefined) =>
        contentMatchesAnchors(content, evidence.executionId, anchors) &&
        content?.sourceInstanceId === multiInstance.sourceInstanceId &&
        content.targetInstanceId === multiInstance.targetInstanceId &&
        content.sourceInstanceId !== content.targetInstanceId;
      if (
        !instanceProofMatches(fileContent) ||
        fileContent?.skillUpload !== true ||
        fileContent?.artifactPreview !== true ||
        fileContent?.terminalMarker !== undefined
      ) {
        failures.push('Multi-instance file evidence does not contain the current cross-instance file proof');
      }
      if (
        !instanceProofMatches(terminalContent) ||
        !hasText(terminalContent?.terminalMarker) ||
        terminalContent?.terminalMarker !== multiInstance.terminalMarker ||
        terminalContent?.skillUpload !== undefined ||
        terminalContent?.artifactPreview !== undefined
      ) {
        failures.push('Multi-instance terminal evidence does not contain the current cross-instance terminal proof');
      }
    } else {
      const hasCurrentExecution = multiInstance.evidenceFiles.some(
        (filePath) => validations.get(filePath)?.content?.executionId === evidence.executionId,
      );
      if (!hasCurrentExecution) {
        failures.push('Multi-instance evidence files do not contain the current execution ID');
      }
    }
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
        !hasText(providerEvidence.nodeId) ||
        !hasText(providerEvidence.skillVersionId) ||
        providerEvidence.outcome !== 'succeeded' ||
        providerEvidence.marker !== AGENT_GATEWAY_PROVIDER_MARKERS[provider]
      ) {
        failures.push(`Provider ${provider} pass is missing successful real-run proof`);
      }
      if (
        evidence.anchors?.provider === provider &&
        (providerEvidence.runId !== evidence.anchors.runId ||
          providerEvidence.providerSessionId !== evidence.anchors.providerSessionId)
      ) {
        failures.push(`Provider ${provider} pass does not match the current browser run and session anchors`);
      }
      if (
        evidence.anchors &&
        (providerEvidence.nodeId !== evidence.anchors.nodeId ||
          providerEvidence.skillVersionId !== evidence.anchors.skillVersionId)
      ) {
        failures.push(`Provider ${provider} pass does not match the current node and Skill version anchors`);
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
      !hasText(browserEvidence.consoleEvidencePath) ||
      !browserEvidence.mediaPaths.length ||
      !browserEvidence.networkEvidencePaths.length
    ) {
      failures.push(`Browser scenario ${scenario} is missing snapshot, action, media, or network evidence`);
    }
    for (const check of AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS[scenario]) {
      if (browserEvidence.checks[check] !== true) {
        failures.push(`Browser scenario ${scenario} did not prove ${check}`);
      }
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
  if (
    !hasText(multiInstance.fileEvidencePath) ||
    !hasText(multiInstance.terminalEvidencePath) ||
    !hasText(multiInstance.sourceInstanceId) ||
    !hasText(multiInstance.targetInstanceId) ||
    !hasText(multiInstance.terminalMarker)
  ) {
    failures.push('Multi-instance evidence is missing file, terminal, instance, or marker proof');
  }
  if (multiInstance.sourceInstanceId === multiInstance.targetInstanceId) {
    failures.push('Multi-instance evidence must identify distinct source and target instances');
  }
  for (const evidencePath of [multiInstance.fileEvidencePath, multiInstance.terminalEvidencePath]) {
    if (evidencePath?.trim() && !multiInstance.evidenceFiles.includes(evidencePath)) {
      failures.push(`Multi-instance evidence file ${evidencePath} is not attached to the manifest`);
    }
  }
  if (multiInstance.file === 'failed') {
    failures.push('Multi-instance file validation failed');
  } else if (multiInstance.file !== 'passed') {
    incomplete.push(`Multi-instance file validation is ${multiInstance.file}`);
  }
  if (multiInstance.skillUpload === 'failed') {
    failures.push('Multi-instance Skill upload validation failed');
  } else if (multiInstance.skillUpload !== 'passed') {
    incomplete.push(`Multi-instance Skill upload validation is ${multiInstance.skillUpload}`);
  }
  if (multiInstance.artifactPreview === 'failed') {
    failures.push('Multi-instance artifact preview validation failed');
  } else if (multiInstance.artifactPreview !== 'passed') {
    incomplete.push(`Multi-instance artifact preview validation is ${multiInstance.artifactPreview}`);
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
  if (
    !hasText(input.context.repository?.branch) ||
    !/^[0-9a-f]{40}$/i.test(input.context.repository?.commit || '') ||
    input.context.repository?.clean !== true
  ) {
    failures.push('Acceptance context must be bound to a clean repository branch and commit');
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
    evaluateEvidenceFiles(input, evidence, failures, incomplete);
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

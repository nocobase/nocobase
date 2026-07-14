/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { access, copyFile, lstat, mkdir, readFile, readdir, realpath, writeFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

import {
  AGENT_GATEWAY_ACCEPTANCE_PROVIDERS,
  AGENT_GATEWAY_API_ACTIONS,
  AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS,
  AGENT_GATEWAY_BROWSER_SCENARIOS,
  AGENT_GATEWAY_PROVIDER_MARKERS,
  AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS,
  AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS,
  AgentGatewayAcceptanceCheck,
  AgentGatewayAcceptanceCheckId,
  AgentGatewayAcceptanceContext,
  AgentGatewayAcceptanceEvidence,
  AgentGatewayAcceptanceEvidenceFileContent,
  AgentGatewayAcceptanceEvidenceFileValidation,
  AgentGatewayAcceptanceProvider,
  AgentGatewayAcceptanceRepositoryContext,
  AgentGatewayPackageEvidence,
  AgentGatewayReleaseGateSummary,
  evaluateAgentGatewayReleaseGate,
  getAgentGatewayLiveSourceProvenanceError,
  getAgentGatewayApiPath,
  parseAgentGatewayVitestSkips,
} from '../src/shared/apiContract';

const execFileAsync = promisify(execFile);
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const REPOSITORY_ROOT = path.resolve(PLUGIN_ROOT, '../../../..');
const DEFAULT_EVIDENCE_ROOT = path.resolve(REPOSITORY_ROOT, 'storage/agent-gateway-acceptance');

type GateScope = 'none' | 'static' | 'full';

interface GateArgs {
  command: 'prepare' | 'collect' | 'scan' | 'verify';
  evidenceDir: string;
  sourceDir?: string;
  scope: GateScope;
  requiredProviders: AgentGatewayAcceptanceProvider[];
  allowIncomplete: boolean;
}

interface CommandSpec {
  id: AgentGatewayAcceptanceCheckId;
  executable: string;
  args: string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  scope: Exclude<GateScope, 'none'>;
  expectEmptyOutput?: boolean;
  run?: () => Promise<{ stdout: string; stderr: string }>;
}

interface CommandOutput {
  result: AgentGatewayAcceptanceCheck;
  stdout: string;
  stderr: string;
}

interface ExecFailure extends Error {
  stdout?: string;
  stderr?: string;
}

interface PackResult {
  files?: Array<{ path?: string }>;
}

interface EvidenceFileReference {
  path: string;
  kind: AgentGatewayAcceptanceEvidenceFileValidation['kind'];
}

function parseProviderList(value: string | undefined) {
  if (!value?.trim()) {
    return [];
  }
  const providers = value
    .split(',')
    .map((provider) => provider.trim())
    .filter(Boolean);
  for (const provider of providers) {
    if (!AGENT_GATEWAY_ACCEPTANCE_PROVIDERS.includes(provider as AgentGatewayAcceptanceProvider)) {
      throw new Error(`Unsupported provider in release matrix: ${provider}`);
    }
  }
  return providers as AgentGatewayAcceptanceProvider[];
}

function parseArgs(argv: string[]): GateArgs {
  const command = argv[2];
  if (command !== 'prepare' && command !== 'collect' && command !== 'scan' && command !== 'verify') {
    throw new Error('Usage: agent-gateway-release-gate.ts <prepare|collect|scan|verify> [options]');
  }
  let evidenceDir = '';
  let scope: GateScope = command === 'verify' ? 'full' : 'none';
  let requiredProviders: AgentGatewayAcceptanceProvider[] = [];
  let allowIncomplete = false;
  let sourceDir: string | undefined;
  for (let index = 3; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--evidence-dir') {
      evidenceDir = path.resolve(argv[index + 1] || '');
      index += 1;
      continue;
    }
    if (argument === '--scope') {
      const value = argv[index + 1];
      if (value !== 'none' && value !== 'static' && value !== 'full') {
        throw new Error(`Unsupported release gate scope: ${value}`);
      }
      scope = value;
      index += 1;
      continue;
    }
    if (argument === '--source-dir') {
      sourceDir = path.resolve(argv[index + 1] || '');
      index += 1;
      continue;
    }
    if (argument === '--required-providers') {
      requiredProviders = parseProviderList(argv[index + 1]);
      index += 1;
      continue;
    }
    if (argument === '--allow-incomplete') {
      allowIncomplete = true;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!evidenceDir) {
    evidenceDir = path.resolve(DEFAULT_EVIDENCE_ROOT, `agw-${Date.now()}`);
  }
  if (command === 'collect' && !sourceDir) {
    throw new Error('The collect command requires --source-dir');
  }
  return { command, evidenceDir, sourceDir, scope, requiredProviders, allowIncomplete };
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function runGit(args: string[]) {
  const output = await execFileAsync('git', args, {
    cwd: REPOSITORY_ROOT,
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
  });
  return output.stdout.trim();
}

async function getRepositoryContext(): Promise<AgentGatewayAcceptanceRepositoryContext> {
  const [commit, branchFromGit, status] = await Promise.all([
    runGit(['rev-parse', 'HEAD']),
    runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
    runGit(['status', '--porcelain', '--untracked-files=all']),
  ]);
  return {
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || branchFromGit,
    commit,
    clean: !status,
  };
}

function sameRepositoryContext(
  expected: AgentGatewayAcceptanceRepositoryContext | undefined,
  actual: AgentGatewayAcceptanceRepositoryContext,
) {
  return Boolean(
    expected &&
      expected.branch === actual.branch &&
      expected.commit === actual.commit &&
      expected.clean &&
      actual.clean,
  );
}

function createRepositoryContextCheck(
  expected: AgentGatewayAcceptanceRepositoryContext | undefined,
  actual: AgentGatewayAcceptanceRepositoryContext,
): AgentGatewayAcceptanceCheck {
  const now = new Date().toISOString();
  const matches = sameRepositoryContext(expected, actual);
  return {
    id: 'static.repository-context',
    status: matches ? 'passed' : 'failed',
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    command: 'git branch/commit/status verification',
    logPath: '',
    reason: matches
      ? undefined
      : `Expected ${expected?.branch || 'missing'}@${expected?.commit || 'missing'} clean=${
          expected?.clean ?? false
        }; got ${actual.branch}@${actual.commit} clean=${actual.clean}`,
    warnings: [],
  };
}

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(entryPath)));
    } else if (entry.isFile() && /\.(?:js|mjs|cjs|ts|tsx|sh)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

async function scanCanonicalAliases() {
  const violations: string[] = [];
  const files = [
    ...(await listSourceFiles(path.resolve(PLUGIN_ROOT, 'src'))),
    ...(await listSourceFiles(path.resolve(PLUGIN_ROOT, 'scripts'))),
  ].filter((filePath) => !filePath.includes(`${path.sep}shared${path.sep}providerLogNormalizers${path.sep}`));
  const aliasPatterns: Array<[string, RegExp]> = [
    ['metadataJson/metadata fallback', /\bmetadataJson\s*(?:\|\||\?\?)\s*[^;\n]*\bmetadata\b/],
    ['metadata/metadataJson fallback', /\bmetadata\s*(?:\|\||\?\?)\s*[^;\n]*\bmetadataJson\b/],
    ['payloadJson/payload fallback', /\bpayloadJson\s*(?:\|\||\?\?)\s*[^;\n]*\bpayload\b/],
    ['payload/payloadJson fallback', /\bpayload\s*(?:\|\||\?\?)\s*[^;\n]*\bpayloadJson\b/],
    ['eventType/type fallback', /\beventType\s*(?:\|\||\?\?)\s*[^;\n]*\btype\b/],
    ['type/eventType fallback', /\btype\s*(?:\|\||\?\?)\s*[^;\n]*\beventType\b/],
    ['capabilities alias fallback', /\bcapabilities(?:Json)?\s*(?:\|\||\?\?)\s*[^;\n]*\bcapabilities(?:Json)?\b/],
    [
      'provider alias fallback',
      /\b(?:agentProvider|commandKey|provider)\s*(?:\|\||\?\?)\s*[^;\n]*\b(?:agentProvider|commandKey|provider)\b/,
    ],
    ['raw resource-action HTTP call', /\.(?:get|post|put|patch|delete)\(\s*[`'"]\/?(?:api\/)?agentGatewayApi:/],
    ['raw resource-action URL', /\burl\s*:\s*[`'"]\/?(?:api\/)?agentGatewayApi:/],
    ['raw path-sensitive action assertion', /(?:===|==|\$includes\s*:)\s*[`'"]\/?(?:api\/)?agentGatewayApi:/],
  ];
  for (const filePath of files) {
    const source = await readFile(filePath, 'utf8');
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\/api\/agent-gateway\/(?!bootstrap\.sh|daemon-package\.tgz|terminal-stream)/.test(line)) {
        violations.push(`${path.relative(PLUGIN_ROOT, filePath)}:${index + 1}: legacy business REST route`);
      }
      for (const [label, pattern] of aliasPatterns) {
        if (pattern.test(line)) {
          violations.push(`${path.relative(PLUGIN_ROOT, filePath)}:${index + 1}: ${label}`);
        }
      }
    });
  }
  if (violations.length) {
    throw new Error(violations.join('\n'));
  }
  return { stdout: 'No legacy DTO fallbacks, business routes, or raw action aliases found\n', stderr: '' };
}

function createEvidenceTemplate(context: AgentGatewayAcceptanceContext): AgentGatewayAcceptanceEvidence {
  const provider = context.requiredProviders[0] || 'codex';
  const anchors = {
    nodeId: '',
    runId: '',
    skillVersionId: '',
    provider,
    providerSessionId: '',
  };
  return {
    schemaVersion: 1,
    executionId: context.executionId,
    capturedAt: '',
    anchors,
    browser: Object.fromEntries(
      AGENT_GATEWAY_BROWSER_SCENARIOS.map((scenario) => [
        scenario,
        {
          status: 'pending',
          executionId: context.executionId,
          capturedAt: '',
          anchors,
          snapshotPath: '',
          actionResultPath: '',
          consoleEvidencePath: '',
          mediaPaths: [],
          networkEvidencePaths: [],
          consoleErrors: [],
          checks: Object.fromEntries(AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS[scenario].map((check) => [check, false])),
        },
      ]),
    ),
    providers: Object.fromEntries(
      AGENT_GATEWAY_ACCEPTANCE_PROVIDERS.map((provider) => [
        provider,
        {
          status: context.requiredProviders.includes(provider) ? 'pending' : 'skipped',
          releaseRequired: context.requiredProviders.includes(provider),
          source: 'real',
          executionId: context.executionId,
          capturedAt: context.requiredProviders.includes(provider) ? '' : context.startedAt,
          evidenceFiles: [],
          reason: context.requiredProviders.includes(provider)
            ? undefined
            : 'Provider binary is not required by this release matrix',
        },
      ]),
    ),
    websocket: Object.fromEntries(
      AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS.map((scenario) => [
        scenario,
        scenario === 'crossOrigin'
          ? {
              status: 'pending',
              executionId: context.executionId,
              capturedAt: '',
              runId: '',
              expectedHttpStatus: 403,
              evidenceFiles: [],
            }
          : {
              status: 'pending',
              executionId: context.executionId,
              capturedAt: '',
              runId: '',
              expectedCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
              relatedRunId: scenario === 'crossRun' ? '' : undefined,
              evidenceFiles: [],
            },
      ]),
    ),
    multiInstance: {
      mode: 'multi-instance',
      file: 'pending',
      skillUpload: 'pending',
      artifactPreview: 'pending',
      terminal: 'pending',
      executionId: context.executionId,
      capturedAt: '',
      evidenceFiles: [],
      fileEvidencePath: '',
      terminalEvidencePath: '',
      sourceInstanceId: '',
      targetInstanceId: '',
      terminalMarker: '',
    },
    findings: [],
  };
}

async function prepare(args: GateArgs) {
  const contextPath = path.resolve(args.evidenceDir, 'context.json');
  if (await pathExists(contextPath)) {
    throw new Error(`Refusing to reuse an existing acceptance execution: ${contextPath}`);
  }
  const repository = await getRepositoryContext();
  if (!repository.clean) {
    throw new Error('Refusing to prepare release evidence from a dirty repository tree');
  }
  await mkdir(args.evidenceDir, { recursive: true });
  const context: AgentGatewayAcceptanceContext = {
    schemaVersion: 1,
    executionId: randomUUID(),
    startedAt: new Date().toISOString(),
    requiredProviders: args.requiredProviders,
    repository,
  };
  await writeJson(contextPath, context);
  await writeJson(path.resolve(args.evidenceDir, 'evidence-template.json'), createEvidenceTemplate(context));
  await writeJson(path.resolve(args.evidenceDir, 'api-paths.json'), {
    createNodeInvitation: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.createNodeInvitation),
    registerNode: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.registerNode),
    uploadSkillVersion: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion),
    createRun: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.createRun),
    claimRun: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun),
    importExternalRun: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.importExternalRun),
    createTerminalStreamTicket: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket),
  });
  process.stdout.write(`${JSON.stringify({ contextPath, executionId: context.executionId })}\n`);
}

function getRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function hasFixtureMarker(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasFixtureMarker);
  }
  const record = getRecord(value);
  if (!record) {
    return false;
  }
  if (record.fixture === true || record.source === 'fixture') {
    return true;
  }
  return Object.values(record).some(hasFixtureMarker);
}

async function readLiveSourceJson(sourceDir: string, relativePath: string) {
  const sourcePath = path.resolve(sourceDir, relativePath);
  if (
    !isContainedPath(sourceDir, sourcePath) ||
    /(?:^|[\\/])(?:__fixtures__|fixtures|test-fixtures)(?:[\\/]|$)/i.test(sourcePath)
  ) {
    throw new Error(`Live evidence source path is invalid or fixture-backed: ${relativePath}`);
  }
  const [stats, resolvedRoot, resolvedFile] = await Promise.all([
    lstat(sourcePath),
    realpath(sourceDir),
    realpath(sourcePath),
  ]);
  if (!stats.isFile() || stats.isSymbolicLink() || stats.size <= 0 || !isContainedPath(resolvedRoot, resolvedFile)) {
    throw new Error(`Live evidence source must be a contained regular nonempty file: ${relativePath}`);
  }
  const parsed = JSON.parse(await readFile(sourcePath, 'utf8')) as unknown;
  if (hasFixtureMarker(parsed)) {
    throw new Error(`Fixture data cannot be collected as live evidence: ${relativePath}`);
  }
  return parsed;
}

async function writeLiveEnvelope(evidenceDir: string, relativePath: string, envelope: Record<string, unknown>) {
  const target = path.resolve(evidenceDir, 'live', relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeJson(target, envelope);
  return path.relative(evidenceDir, target);
}

async function copyLiveSourceFile(sourceDir: string, evidenceDir: string, relativePath: string) {
  const source = path.resolve(sourceDir, relativePath);
  if (
    !isContainedPath(sourceDir, source) ||
    /(?:^|[\\/])(?:__fixtures__|fixtures|test-fixtures)(?:[\\/]|$)/i.test(source)
  ) {
    throw new Error(`Live evidence source path is invalid or fixture-backed: ${relativePath}`);
  }
  const [stats, resolvedRoot, resolvedFile] = await Promise.all([lstat(source), realpath(sourceDir), realpath(source)]);
  if (!stats.isFile() || stats.isSymbolicLink() || stats.size <= 0 || !isContainedPath(resolvedRoot, resolvedFile)) {
    throw new Error(`Live evidence source must be a contained regular nonempty file: ${relativePath}`);
  }
  const target = path.resolve(evidenceDir, 'live', relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  return path.relative(evidenceDir, target);
}

async function findBrowserMedia(sourceDir: string, scenario: string) {
  const directory = path.resolve(sourceDir, 'browser', scenario);
  const entries = await readdir(directory);
  const media = entries.find((entry) => /\.(?:png|jpe?g|webp|mp4|webm)$/i.test(entry));
  if (!media) {
    throw new Error(`Browser scenario ${scenario} has no screenshot or video`);
  }
  return path.join('browser', scenario, media);
}

function getConsoleErrors(value: unknown) {
  const errors = Array.isArray(value) ? value : getRecord(value)?.errors;
  if (!Array.isArray(errors)) {
    return [];
  }
  return errors.map((item) => {
    const record = getRecord(item) || {};
    return {
      message: typeof record.message === 'string' ? record.message : String(record.message || ''),
      explained: record.explained === true,
      explanation: typeof record.explanation === 'string' ? record.explanation : undefined,
    };
  });
}

function assertRawStatusPassed(value: unknown, label: string) {
  if (getRecord(value)?.status !== 'passed') {
    throw new Error(`${label} must explicitly declare status=passed`);
  }
}

function assertRawProvenance(context: AgentGatewayAcceptanceContext, value: unknown, label: string) {
  const source = getRecord(value);
  const error = getAgentGatewayLiveSourceProvenanceError(
    context,
    {
      executionId: typeof source?.executionId === 'string' ? source.executionId : undefined,
      capturedAt: typeof source?.capturedAt === 'string' ? source.capturedAt : undefined,
    },
    label,
  );
  if (error) {
    throw new Error(error);
  }
}

function assertRawAnchors(
  value: unknown,
  anchors: AgentGatewayAcceptanceEvidence['anchors'],
  label: string,
  full: boolean,
) {
  if (!anchors || getStringContentValue(value, 'runId') !== anchors.runId) {
    throw new Error(`${label} does not contain the current runId`);
  }
  if (
    full &&
    (getStringContentValue(value, 'nodeId') !== anchors.nodeId ||
      getStringContentValue(value, 'skillVersionId') !== anchors.skillVersionId ||
      getStringContentValue(value, 'provider') !== anchors.provider ||
      getStringContentValue(value, 'providerSessionId') !== anchors.providerSessionId)
  ) {
    throw new Error(`${label} does not contain all current entity anchors`);
  }
}

function assertRawTextContains(value: unknown, expected: string, label: string) {
  if (!JSON.stringify(value).includes(expected)) {
    throw new Error(`${label} does not contain ${expected}`);
  }
}

function getBrowserActionChecks(value: unknown, scenario: (typeof AGENT_GATEWAY_BROWSER_SCENARIOS)[number]) {
  const checks = getRecord(getRecord(value)?.checks);
  const requiredChecks = AGENT_GATEWAY_BROWSER_REQUIRED_CHECKS[scenario];
  for (const check of requiredChecks) {
    if (checks?.[check] !== true) {
      throw new Error(`Browser scenario ${scenario} action must explicitly prove ${check}`);
    }
  }
  return Object.fromEntries(requiredChecks.map((check) => [check, true]));
}

async function collect(args: GateArgs) {
  const sourceDir = args.sourceDir as string;
  const contextPath = path.resolve(args.evidenceDir, 'context.json');
  if (!(await pathExists(contextPath))) {
    throw new Error(`Acceptance context is missing. Run prepare first: ${contextPath}`);
  }
  if (await pathExists(path.resolve(args.evidenceDir, 'evidence.json'))) {
    throw new Error('Refusing to overwrite existing live evidence.json');
  }
  const context = await readJson<AgentGatewayAcceptanceContext>(contextPath);
  const repository = await getRepositoryContext();
  if (!sameRepositoryContext(context.repository, repository)) {
    throw new Error('Live evidence collection repository does not match the prepared branch, commit, and clean tree');
  }
  const capturedAt = new Date().toISOString();
  const rawAnchors = await readLiveSourceJson(sourceDir, 'anchors.json');
  assertRawProvenance(context, rawAnchors, 'Live anchors');
  const provider = getStringContentValue(rawAnchors, 'provider');
  if (!AGENT_GATEWAY_ACCEPTANCE_PROVIDERS.includes(provider as AgentGatewayAcceptanceProvider)) {
    throw new Error(`Unsupported live provider anchor: ${provider || 'missing'}`);
  }
  const anchors = {
    nodeId: getStringContentValue(rawAnchors, 'nodeId') || '',
    runId: getStringContentValue(rawAnchors, 'runId') || '',
    skillVersionId: getStringContentValue(rawAnchors, 'skillVersionId') || '',
    provider: provider as AgentGatewayAcceptanceProvider,
    providerSessionId: getStringContentValue(rawAnchors, 'providerSessionId') || '',
  };
  if (!anchors.nodeId || !anchors.runId || !anchors.skillVersionId || !anchors.providerSessionId) {
    throw new Error('Live anchors must contain nodeId, runId, skillVersionId, provider, and providerSessionId');
  }

  const browser: AgentGatewayAcceptanceEvidence['browser'] = {};
  for (const scenario of AGENT_GATEWAY_BROWSER_SCENARIOS) {
    const snapshot = await readLiveSourceJson(sourceDir, path.join('browser', scenario, 'snapshot.json'));
    const action = await readLiveSourceJson(sourceDir, path.join('browser', scenario, 'action.json'));
    const consoleErrors = await readLiveSourceJson(sourceDir, path.join('browser', scenario, 'console-errors.json'));
    const network = await readLiveSourceJson(sourceDir, path.join('browser', scenario, 'network.har'));
    assertRawProvenance(context, snapshot, `Browser scenario ${scenario} snapshot`);
    assertRawProvenance(context, action, `Browser scenario ${scenario} action`);
    assertRawProvenance(context, consoleErrors, `Browser scenario ${scenario} console errors`);
    assertRawProvenance(context, network, `Browser scenario ${scenario} HAR`);
    assertRawAnchors(snapshot, anchors, `Browser scenario ${scenario} snapshot`, false);
    assertRawStatusPassed(action, `Browser scenario ${scenario} action`);
    assertRawAnchors(action, anchors, `Browser scenario ${scenario} action`, true);
    assertRawAnchors(consoleErrors, anchors, `Browser scenario ${scenario} console errors`, true);
    assertRawTextContains(network, anchors.runId, `Browser scenario ${scenario} HAR`);
    const checks = getBrowserActionChecks(action, scenario);
    const snapshotPath = await writeLiveEnvelope(args.evidenceDir, path.join('browser', scenario, 'snapshot.json'), {
      executionId: context.executionId,
      capturedAt,
      ...anchors,
      payload: snapshot,
    });
    const actionResultPath = await writeLiveEnvelope(args.evidenceDir, path.join('browser', scenario, 'action.json'), {
      executionId: context.executionId,
      capturedAt,
      ...anchors,
      checks,
      payload: action,
    });
    const consoleEvidencePath = await copyLiveSourceFile(
      sourceDir,
      args.evidenceDir,
      path.join('browser', scenario, 'console-errors.json'),
    );
    const mediaSource = await findBrowserMedia(sourceDir, scenario);
    const mediaPath = await copyLiveSourceFile(sourceDir, args.evidenceDir, mediaSource);
    const networkPath = await copyLiveSourceFile(
      sourceDir,
      args.evidenceDir,
      path.join('browser', scenario, 'network.har'),
    );
    browser[scenario] = {
      status: 'passed',
      executionId: context.executionId,
      capturedAt,
      anchors,
      snapshotPath,
      actionResultPath,
      consoleEvidencePath,
      mediaPaths: [mediaPath],
      networkEvidencePaths: [networkPath],
      consoleErrors: getConsoleErrors(consoleErrors),
      checks,
    };
  }

  const providers: AgentGatewayAcceptanceEvidence['providers'] = {};
  for (const providerName of AGENT_GATEWAY_ACCEPTANCE_PROVIDERS) {
    const relativePath = path.join('providers', `${providerName}.json`);
    if (!(await pathExists(path.resolve(sourceDir, relativePath)))) {
      providers[providerName] = {
        status: context.requiredProviders.includes(providerName) ? 'pending' : 'skipped',
        releaseRequired: context.requiredProviders.includes(providerName),
        source: 'real',
        executionId: context.executionId,
        capturedAt,
        evidenceFiles: [],
        reason: context.requiredProviders.includes(providerName)
          ? 'Required real provider output is missing'
          : 'Provider binary is not required by this release matrix',
      };
      continue;
    }
    const rawProvider = await readLiveSourceJson(sourceDir, relativePath);
    assertRawProvenance(context, rawProvider, `Provider ${providerName} output`);
    assertRawStatusPassed(rawProvider, `Provider ${providerName} output`);
    if (getRecord(rawProvider)?.source !== 'real') {
      throw new Error(`Provider ${providerName} output must explicitly declare source=real`);
    }
    const runId = getStringContentValue(rawProvider, 'runId');
    const providerSessionId = getStringContentValue(rawProvider, 'providerSessionId');
    const nodeId = getStringContentValue(rawProvider, 'nodeId');
    const skillVersionId = getStringContentValue(rawProvider, 'skillVersionId');
    const outcome = getStringContentValue(rawProvider, 'outcome');
    const marker = getStringContentValue(rawProvider, 'marker');
    if (
      getStringContentValue(rawProvider, 'provider') !== providerName ||
      !runId ||
      !providerSessionId ||
      nodeId !== anchors.nodeId ||
      skillVersionId !== anchors.skillVersionId ||
      outcome !== 'succeeded' ||
      marker !== AGENT_GATEWAY_PROVIDER_MARKERS[providerName]
    ) {
      throw new Error(`Provider ${providerName} output is missing successful canonical real-run proof`);
    }
    const evidenceFile = await writeLiveEnvelope(args.evidenceDir, relativePath, {
      executionId: context.executionId,
      capturedAt,
      provider: providerName,
      runId,
      providerSessionId,
      nodeId,
      skillVersionId,
      outcome,
      marker,
      payload: rawProvider,
    });
    providers[providerName] = {
      status: 'passed',
      releaseRequired: context.requiredProviders.includes(providerName),
      source: 'real',
      executionId: context.executionId,
      capturedAt,
      runId,
      providerSessionId,
      nodeId,
      skillVersionId,
      outcome: 'succeeded',
      marker,
      evidenceFiles: [evidenceFile],
    };
  }

  const websocket: AgentGatewayAcceptanceEvidence['websocket'] = {};
  for (const scenario of AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS) {
    const relativePath = path.join('websocket', `${scenario}.json`);
    const rawDenial = await readLiveSourceJson(sourceDir, relativePath);
    assertRawProvenance(context, rawDenial, `WebSocket denial ${scenario}`);
    assertRawStatusPassed(rawDenial, `WebSocket denial ${scenario}`);
    const runId = getStringContentValue(rawDenial, 'runId') || anchors.runId;
    const actualCode = getStringContentValue(rawDenial, 'actualCode') || getStringContentValue(rawDenial, 'code');
    const actualHttpStatus = findValueByKey(rawDenial, 'actualHttpStatus');
    const relatedRunId = getStringContentValue(rawDenial, 'relatedRunId');
    if (runId !== anchors.runId) {
      throw new Error(`WebSocket denial ${scenario} does not match the current runId`);
    }
    if (scenario === 'crossOrigin') {
      if (actualHttpStatus !== 403) {
        throw new Error('Cross-origin WebSocket denial must explicitly report actualHttpStatus=403');
      }
    } else if (actualCode !== 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH') {
      throw new Error(`${scenario} WebSocket denial must explicitly report TERMINAL_STREAM_TICKET_SCOPE_MISMATCH`);
    }
    if (scenario === 'crossRun' && (!relatedRunId || relatedRunId === anchors.runId)) {
      throw new Error('Cross-run WebSocket denial must report a distinct relatedRunId');
    }
    const evidenceFile = await writeLiveEnvelope(args.evidenceDir, relativePath, {
      executionId: context.executionId,
      capturedAt,
      runId,
      actualCode,
      actualHttpStatus,
      relatedRunId,
      payload: rawDenial,
    });
    websocket[scenario] =
      scenario === 'crossOrigin'
        ? {
            status: 'passed',
            executionId: context.executionId,
            capturedAt,
            runId,
            expectedHttpStatus: 403,
            actualHttpStatus: typeof actualHttpStatus === 'number' ? actualHttpStatus : undefined,
            evidenceFiles: [evidenceFile],
          }
        : {
            status: 'passed',
            executionId: context.executionId,
            capturedAt,
            runId,
            expectedCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
            actualCode,
            relatedRunId,
            evidenceFiles: [evidenceFile],
          };
  }

  const rawFile = await readLiveSourceJson(sourceDir, path.join('multi-instance', 'file.json'));
  const rawTerminal = await readLiveSourceJson(sourceDir, path.join('multi-instance', 'terminal.json'));
  for (const [label, value] of [
    ['Multi-instance file output', rawFile],
    ['Multi-instance terminal output', rawTerminal],
  ] as const) {
    assertRawProvenance(context, value, label);
    assertRawStatusPassed(value, label);
    assertRawAnchors(value, anchors, label, true);
    const sourceInstanceId = getStringContentValue(value, 'sourceInstanceId');
    const targetInstanceId = getStringContentValue(value, 'targetInstanceId');
    if (!sourceInstanceId || !targetInstanceId || sourceInstanceId === targetInstanceId) {
      throw new Error(`${label} must identify distinct sourceInstanceId and targetInstanceId values`);
    }
  }
  if (findValueByKey(rawFile, 'skillUpload') !== true) {
    throw new Error('Multi-instance file output must explicitly prove cross-instance Skill upload and download');
  }
  if (findValueByKey(rawFile, 'artifactPreview') !== true) {
    throw new Error('Multi-instance file output must explicitly prove cross-instance artifact preview');
  }
  const fileSourceInstanceId = getStringContentValue(rawFile, 'sourceInstanceId') || '';
  const fileTargetInstanceId = getStringContentValue(rawFile, 'targetInstanceId') || '';
  const terminalSourceInstanceId = getStringContentValue(rawTerminal, 'sourceInstanceId') || '';
  const terminalTargetInstanceId = getStringContentValue(rawTerminal, 'targetInstanceId') || '';
  if (fileSourceInstanceId !== terminalSourceInstanceId || fileTargetInstanceId !== terminalTargetInstanceId) {
    throw new Error('Multi-instance file and terminal outputs must identify the same source and target instances');
  }
  const terminalMarker = getStringContentValue(rawTerminal, 'terminalMarker');
  if (!terminalMarker) {
    throw new Error('Multi-instance terminal output must contain a non-empty terminalMarker');
  }
  const fileEvidence = await writeLiveEnvelope(args.evidenceDir, path.join('multi-instance', 'file.json'), {
    executionId: context.executionId,
    capturedAt,
    ...anchors,
    sourceInstanceId: fileSourceInstanceId,
    targetInstanceId: fileTargetInstanceId,
    skillUpload: true,
    artifactPreview: true,
    payload: rawFile,
  });
  const terminalEvidence = await writeLiveEnvelope(args.evidenceDir, path.join('multi-instance', 'terminal.json'), {
    executionId: context.executionId,
    capturedAt,
    ...anchors,
    sourceInstanceId: terminalSourceInstanceId,
    targetInstanceId: terminalTargetInstanceId,
    terminalMarker,
    payload: rawTerminal,
  });
  const findingsPath = path.resolve(sourceDir, 'findings.json');
  const rawFindings = (await pathExists(findingsPath))
    ? await readLiveSourceJson(sourceDir, 'findings.json')
    : undefined;
  if (rawFindings) {
    assertRawProvenance(context, rawFindings, 'Acceptance findings');
  }
  const findings = rawFindings ? getRecord(rawFindings)?.findings : [];
  if (!Array.isArray(findings)) {
    throw new Error('findings.json must be an array when provided');
  }
  const evidence: AgentGatewayAcceptanceEvidence = {
    schemaVersion: 1,
    executionId: context.executionId,
    capturedAt,
    anchors,
    browser,
    providers,
    websocket,
    multiInstance: {
      mode: 'multi-instance',
      file: 'passed',
      skillUpload: 'passed',
      artifactPreview: 'passed',
      terminal: 'passed',
      executionId: context.executionId,
      capturedAt,
      evidenceFiles: [fileEvidence, terminalEvidence],
      fileEvidencePath: fileEvidence,
      terminalEvidencePath: terminalEvidence,
      sourceInstanceId: fileSourceInstanceId,
      targetInstanceId: fileTargetInstanceId,
      terminalMarker,
    },
    findings: findings as AgentGatewayAcceptanceEvidence['findings'],
  };
  await writeJson(path.resolve(args.evidenceDir, 'evidence.json'), evidence);
  process.stdout.write(`${JSON.stringify({ evidencePath: path.resolve(args.evidenceDir, 'evidence.json') })}\n`);
}

function testSpec(id: AgentGatewayAcceptanceCheckId, file: string, scope: CommandSpec['scope'] = 'full'): CommandSpec {
  return {
    id,
    executable: 'yarn',
    args: ['test', file, '--run', '--reporter=dot'],
    cwd: REPOSITORY_ROOT,
    env: { ...process.env, DB_DIALECT: 'sqlite' },
    scope,
  };
}

function serverTestSpec(id: AgentGatewayAcceptanceCheckId, file: string): CommandSpec {
  return {
    id,
    executable: './run_server_test.sh',
    args: [file, '--run', '--reporter=dot'],
    cwd: REPOSITORY_ROOT,
    env: { ...process.env, TEST_DB_DIALECT: 'postgres' },
    scope: 'full',
  };
}

function getCommandSpecs(): CommandSpec[] {
  const pluginPath = 'packages/plugins/@nocobase/plugin-agent-gateway';
  return [
    {
      id: 'static.eslint',
      executable: 'yarn',
      args: ['eslint', '--fix', pluginPath],
      cwd: REPOSITORY_ROOT,
      scope: 'static',
    },
    {
      id: 'static.diff',
      executable: 'git',
      args: ['diff', '--check', '--', pluginPath],
      cwd: REPOSITORY_ROOT,
      scope: 'static',
    },
    {
      id: 'static.api-alias-scan',
      executable: 'internal',
      args: ['scan-canonical-aliases'],
      cwd: REPOSITORY_ROOT,
      scope: 'static',
      run: scanCanonicalAliases,
    },
    {
      id: 'static.build',
      executable: 'yarn',
      args: ['build', '@nocobase/plugin-agent-gateway'],
      cwd: REPOSITORY_ROOT,
      scope: 'static',
    },
    {
      id: 'static.pack',
      executable: 'npm',
      args: ['pack', '--dry-run', '--json'],
      cwd: PLUGIN_ROOT,
      scope: 'static',
    },
    {
      id: 'static.clean-tree',
      executable: 'git',
      args: ['status', '--porcelain', '--untracked-files=all'],
      cwd: REPOSITORY_ROOT,
      scope: 'static',
      expectEmptyOutput: true,
    },
    testSpec('contracts.release-gate', `${pluginPath}/src/shared/contracts/__tests__/acceptance.test.ts`),
    testSpec('contracts.canonical', `${pluginPath}/src/shared/contracts/__tests__/contracts.test.ts`),
    testSpec('packaging.bootstrap', `${pluginPath}/src/server/__tests__/packaging.test.ts`),
    testSpec('daemon.runner', `${pluginPath}/src/daemon/__tests__/runner.test.ts`),
    testSpec('daemon.lifecycle', `${pluginPath}/src/daemon/__tests__/daemonLifecycle.test.ts`),
    testSpec('daemon.skill-sync', `${pluginPath}/src/daemon/__tests__/skillSync.test.ts`),
    testSpec('daemon.terminal-stream', `${pluginPath}/src/daemon/__tests__/terminalStreamClient.test.ts`),
    testSpec('daemon.exec-driver', `${pluginPath}/src/daemon/__tests__/execDriver.test.ts`),
    testSpec('daemon.tmux-terminal', `${pluginPath}/src/daemon/__tests__/tmuxTerminal.test.ts`),
    testSpec('daemon.run-control-requests', `${pluginPath}/src/daemon/__tests__/runControlRequests.test.ts`),
    testSpec('daemon.supervisor-modules', `${pluginPath}/src/daemon/__tests__/supervisorModules.test.ts`),
    testSpec('daemon.execution-modules', `${pluginPath}/src/daemon/__tests__/executionModules.test.ts`),
    testSpec('client.runs', `${pluginPath}/src/client-v2/__tests__/AgentGatewayRunsPage.test.tsx`),
    testSpec('client.runs-features', `${pluginPath}/src/client-v2/__tests__/runs`),
    testSpec('client.skills', `${pluginPath}/src/client-v2/__tests__/AgentGatewaySkillsPage.test.tsx`),
    testSpec('client.admin', `${pluginPath}/src/client-v2/__tests__/AgentGatewayAdminPages.test.tsx`),
    testSpec('client.terminal-a11y', `${pluginPath}/src/client-v2/__tests__/AgentGatewayTerminalA11y.test.tsx`),
    serverTestSpec('server.collections', `${pluginPath}/src/server/__tests__/collections.test.ts`),
    serverTestSpec('server.permissions', `${pluginPath}/src/server/__tests__/agentGatewayPermissions.test.ts`),
    serverTestSpec('server.security', `${pluginPath}/src/server/__tests__/security.test.ts`),
    serverTestSpec('server.node-lifecycle', `${pluginPath}/src/server/__tests__/nodeLifecycle.test.ts`),
    serverTestSpec('server.api-call-logging', `${pluginPath}/src/server/__tests__/apiCallLogging.test.ts`),
    serverTestSpec('server.file-uploads', `${pluginPath}/src/server/__tests__/fileUploads.test.ts`),
    serverTestSpec('server.dispatch-bindings', `${pluginPath}/src/server/__tests__/dispatchBindings.test.ts`),
    serverTestSpec('server.run-lifecycle', `${pluginPath}/src/server/__tests__/runLifecycle.test.ts`),
    serverTestSpec('server.run-terminal', `${pluginPath}/src/server/__tests__/runTerminal.test.ts`),
    serverTestSpec('server.run-domains', `${pluginPath}/src/server/modules/runs/__tests__/runDomains.test.ts`),
    serverTestSpec('server.external-imports', `${pluginPath}/src/server/__tests__/externalRunImports.test.ts`),
    serverTestSpec('server.run-observability', `${pluginPath}/src/server/__tests__/runObservability.test.ts`),
    serverTestSpec('server.conversation-events', `${pluginPath}/src/server/__tests__/conversationEvents.test.ts`),
    serverTestSpec('server.skill-versions', `${pluginPath}/src/server/__tests__/skillVersions.test.ts`),
    serverTestSpec('server.terminal-auth', `${pluginPath}/src/server/__tests__/terminalStreamAuth.test.ts`),
    serverTestSpec('server.terminal-broker', `${pluginPath}/src/server/__tests__/terminalStreamBroker.test.ts`),
    serverTestSpec(
      'integration.terminal-daemon',
      `${pluginPath}/src/server/__tests__/terminalStreamDaemonIntegration.test.ts`,
    ),
    serverTestSpec('server.retention', `${pluginPath}/src/server/__tests__/retention.test.ts`),
    serverTestSpec('server.maintenance-lease', `${pluginPath}/src/server/services/__tests__/maintenanceLease.test.ts`),
    serverTestSpec('multi-instance.file', `${pluginPath}/src/server/__tests__/sharedFileStorageCluster.test.ts`),
    serverTestSpec('multi-instance.terminal', `${pluginPath}/src/server/__tests__/terminalStreamCluster.test.ts`),
    serverTestSpec('stress.backpressure', `${pluginPath}/src/server/__tests__/terminalStreamReliability.test.ts`),
    testSpec('fixtures.codex-adapter', `${pluginPath}/src/daemon/__tests__/codexAdapter.test.ts`),
    testSpec('fixtures.claude-code-adapter', `${pluginPath}/src/daemon/__tests__/claudeCodeAdapter.test.ts`),
    testSpec('fixtures.opencode-adapter', `${pluginPath}/src/daemon/__tests__/opencodeAdapter.test.ts`),
  ];
}

function shouldRunSpec(spec: CommandSpec, scope: GateScope) {
  if (scope === 'none') {
    return false;
  }
  if (scope === 'static') {
    return spec.scope === 'static';
  }
  return true;
}

function getWarnings(output: string) {
  return output
    .split(/\r?\n/)
    .filter((line) => /warn(?:ing)?/i.test(line))
    .slice(0, 100);
}

function getFailureOutput(error: unknown) {
  if (!(error instanceof Error)) {
    return { stdout: '', stderr: String(error) };
  }
  const failure = error as ExecFailure;
  return { stdout: failure.stdout || '', stderr: failure.stderr || failure.message };
}

async function runCommand(spec: CommandSpec, logsDirectory: string): Promise<CommandOutput> {
  const startedAt = new Date();
  let stdout = '';
  let stderr = '';
  let status: AgentGatewayAcceptanceCheck['status'] = 'passed';
  let reason: string | undefined;
  try {
    const output = spec.run
      ? await spec.run()
      : await execFileAsync(spec.executable, spec.args, {
          cwd: spec.cwd,
          env: spec.env,
          maxBuffer: 64 * 1024 * 1024,
        });
    stdout = output.stdout;
    stderr = output.stderr;
    if (spec.expectEmptyOutput && `${stdout}${stderr}`.trim()) {
      status = 'failed';
      reason = 'Command was expected to produce no output';
    }
  } catch (error) {
    status = 'failed';
    const output = getFailureOutput(error);
    stdout = output.stdout;
    stderr = output.stderr;
  }
  const finishedAt = new Date();
  const vitestSkips = parseAgentGatewayVitestSkips(`${stdout}\n${stderr}`);
  if (status === 'passed' && vitestSkips.count > 0) {
    status = 'skipped';
    reason = `Vitest reported ${vitestSkips.count} internally skipped test(s)`;
  }
  const logPath = path.resolve(logsDirectory, `${spec.id}.log`);
  await writeFile(logPath, `${stdout}${stderr ? `\n${stderr}` : ''}`, 'utf8');
  return {
    result: {
      id: spec.id,
      status,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      command: [spec.executable, ...spec.args].join(' '),
      logPath: path.relative(path.dirname(logsDirectory), logPath),
      reason,
      warnings: getWarnings(`${stdout}\n${stderr}`),
      skippedTests: vitestSkips.count,
      skipDetails: vitestSkips.details,
    },
    stdout,
    stderr,
  };
}

function createSkippedCheck(spec: CommandSpec, scope: GateScope): AgentGatewayAcceptanceCheck {
  const now = new Date().toISOString();
  return {
    id: spec.id,
    status: 'skipped',
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    command: [spec.executable, ...spec.args].join(' '),
    logPath: '',
    reason: `Not selected by ${scope} release-gate scope`,
    warnings: [],
  };
}

function parsePackageEvidence(packOutput: CommandOutput | undefined): AgentGatewayPackageEvidence | undefined {
  if (!packOutput || packOutput.result.status !== 'passed') {
    return packOutput
      ? { status: 'failed', fileCount: 0, files: [], bannedFiles: [], warning: packOutput.stderr }
      : undefined;
  }
  try {
    const parsed = JSON.parse(packOutput.stdout) as PackResult[];
    const files = (parsed[0]?.files || []).map((file) => file.path || '').filter(Boolean);
    const bannedFiles = files.filter(
      (file) =>
        file.startsWith('scripts/') ||
        file.startsWith('__tests__/') ||
        file.startsWith('__fixtures__/') ||
        file.startsWith('test-fixtures/') ||
        file.includes('/__tests__/') ||
        file.includes('/__fixtures__/') ||
        file.includes('/test-fixtures/'),
    );
    return {
      status: bannedFiles.length ? 'failed' : 'passed',
      fileCount: files.length,
      files,
      bannedFiles,
    };
  } catch (error) {
    return {
      status: 'failed',
      fileCount: 0,
      files: [],
      bannedFiles: [],
      warning: error instanceof Error ? error.message : String(error),
    };
  }
}

function getReferenceKind(filePath: string): AgentGatewayAcceptanceEvidenceFileValidation['kind'] {
  if (/\.(?:png|jpe?g|gif|webp|mp4|webm)$/i.test(filePath)) {
    return 'media';
  }
  return /\.har$/i.test(filePath) ? 'network' : 'json';
}

function getEvidenceFileReferences(evidence: AgentGatewayAcceptanceEvidence) {
  const references = new Map<string, EvidenceFileReference>();
  const add = (filePath: string, kind = getReferenceKind(filePath)) => {
    if (filePath) {
      references.set(filePath, { path: filePath, kind });
    }
  };
  for (const browserEvidence of Object.values(evidence.browser || {})) {
    if (!browserEvidence) {
      continue;
    }
    add(browserEvidence.snapshotPath, 'json');
    add(browserEvidence.actionResultPath, 'json');
    add(browserEvidence.consoleEvidencePath, 'json');
    browserEvidence.mediaPaths.forEach((filePath) => add(filePath, 'media'));
    browserEvidence.networkEvidencePaths.forEach((filePath) => add(filePath, 'network'));
  }
  for (const providerEvidence of Object.values(evidence.providers || {})) {
    providerEvidence?.evidenceFiles.forEach((filePath) => add(filePath));
  }
  for (const denialEvidence of Object.values(evidence.websocket || {})) {
    denialEvidence?.evidenceFiles.forEach((filePath) => add(filePath));
  }
  evidence.multiInstance?.evidenceFiles.forEach((filePath) => add(filePath));
  return [...references.values()];
}

function findValueByKey(value: unknown, key: string): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValueByKey(item, key);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (record[key] !== undefined) {
    return record[key];
  }
  for (const item of Object.values(record)) {
    const found = findValueByKey(item, key);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

function getStringContentValue(value: unknown, key: string) {
  const found = findValueByKey(value, key);
  return typeof found === 'string' && found ? found : undefined;
}

function parseEvidenceFileContent(value: unknown): AgentGatewayAcceptanceEvidenceFileContent {
  const provider = getStringContentValue(value, 'provider');
  const actualHttpStatus = findValueByKey(value, 'actualHttpStatus');
  const skillUpload = findValueByKey(value, 'skillUpload');
  const artifactPreview = findValueByKey(value, 'artifactPreview');
  const rawChecks = getRecord(findValueByKey(value, 'checks'));
  return {
    executionId: getStringContentValue(value, 'executionId'),
    nodeId: getStringContentValue(value, 'nodeId'),
    runId: getStringContentValue(value, 'runId'),
    skillVersionId: getStringContentValue(value, 'skillVersionId'),
    provider: AGENT_GATEWAY_ACCEPTANCE_PROVIDERS.includes(provider as AgentGatewayAcceptanceProvider)
      ? (provider as AgentGatewayAcceptanceProvider)
      : undefined,
    providerSessionId: getStringContentValue(value, 'providerSessionId'),
    outcome: getStringContentValue(value, 'outcome'),
    marker: getStringContentValue(value, 'marker'),
    checks: rawChecks
      ? Object.fromEntries(
          Object.entries(rawChecks)
            .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
            .map(([key, result]) => [key, result]),
        )
      : undefined,
    sourceInstanceId: getStringContentValue(value, 'sourceInstanceId'),
    targetInstanceId: getStringContentValue(value, 'targetInstanceId'),
    skillUpload: typeof skillUpload === 'boolean' ? skillUpload : undefined,
    artifactPreview: typeof artifactPreview === 'boolean' ? artifactPreview : undefined,
    terminalMarker: getStringContentValue(value, 'terminalMarker'),
    actualCode: getStringContentValue(value, 'actualCode') || getStringContentValue(value, 'code'),
    actualHttpStatus:
      typeof actualHttpStatus === 'number' && Number.isFinite(actualHttpStatus) ? actualHttpStatus : undefined,
    relatedRunId: getStringContentValue(value, 'relatedRunId'),
  };
}

function isContainedPath(root: string, candidate: string) {
  const relative = path.relative(root, candidate);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

async function validateEvidenceFile(
  evidenceDir: string,
  reference: EvidenceFileReference,
): Promise<AgentGatewayAcceptanceEvidenceFileValidation> {
  const candidate = path.resolve(evidenceDir, reference.path);
  const base = {
    path: reference.path,
    kind: reference.kind,
    contained: false,
    regularFile: false,
    sizeBytes: 0,
  };
  if (
    path.isAbsolute(reference.path) ||
    !isContainedPath(evidenceDir, candidate) ||
    reference.path
      .split(/[\\/]/)
      .some((segment) => ['__fixtures__', 'fixtures', 'test-fixtures'].includes(segment.toLowerCase()))
  ) {
    return { ...base, status: 'failed', reason: 'Path escapes the evidence directory or points to fixture data' };
  }
  try {
    const [stats, resolvedRoot, resolvedFile] = await Promise.all([
      lstat(candidate),
      realpath(evidenceDir),
      realpath(candidate),
    ]);
    const contained = isContainedPath(resolvedRoot, resolvedFile);
    const regularFile = stats.isFile() && !stats.isSymbolicLink();
    if (!contained || !regularFile || stats.size <= 0) {
      return {
        ...base,
        status: 'failed',
        contained,
        regularFile,
        sizeBytes: stats.size,
        reason: 'Evidence must be a contained regular nonempty file',
      };
    }
    if (reference.kind === 'media') {
      return { ...base, status: 'passed', contained, regularFile, sizeBytes: stats.size };
    }
    const source = await readFile(candidate, 'utf8');
    const parsed = JSON.parse(source) as unknown;
    return {
      ...base,
      status: 'passed',
      contained,
      regularFile,
      sizeBytes: stats.size,
      content: parseEvidenceFileContent(parsed),
    };
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function validateEvidenceFiles(evidenceDir: string, evidence: AgentGatewayAcceptanceEvidence | undefined) {
  if (!evidence) {
    return undefined;
  }
  return Promise.all(
    getEvidenceFileReferences(evidence).map((reference) => validateEvidenceFile(evidenceDir, reference)),
  );
}

function renderReport(summary: AgentGatewayReleaseGateSummary) {
  const checks = summary.checks
    .map(
      (check) =>
        `| ${check.id} | ${check.status} | ${check.durationMs} | ${check.skippedTests || 0} | ${check.reason || ''} |`,
    )
    .join('\n');
  const list = (values: string[]) => (values.length ? values.map((value) => `- ${value}`).join('\n') : '- None');
  return (
    `# Agent Gateway release gate\n\n` +
    `- Status: **${summary.status}**\n` +
    `- Execution ID: \`${summary.context.executionId}\`\n` +
    `- Started: ${summary.context.startedAt}\n` +
    `- Generated: ${summary.generatedAt}\n` +
    `- Repository: \`${summary.context.repository?.branch || 'missing'}@${
      summary.context.repository?.commit || 'missing'
    }\`\n` +
    `- Prepared from clean tree: ${summary.context.repository?.clean === true}\n` +
    `- Required providers: ${summary.context.requiredProviders.join(', ') || 'none'}\n\n` +
    `## Automated checks\n\n| Check | Status | Duration ms | Internal skips | Reason |\n| --- | --- | ---: | ---: | --- |\n${checks}\n\n` +
    `Adapter fixture checks are automated parser tests only and never count as live provider evidence.\n\n` +
    `## Failures\n\n${list(summary.failures)}\n\n` +
    `## Incomplete evidence\n\n${list(summary.incomplete)}\n\n` +
    `## Warnings\n\n${list(summary.warnings)}\n\n` +
    `## Package\n\n` +
    `- Status: ${summary.packageEvidence?.status || 'missing'}\n` +
    `- File count: ${summary.packageEvidence?.fileCount || 0}\n` +
    `- Banned files: ${summary.packageEvidence?.bannedFiles.join(', ') || 'none'}\n\n` +
    `## Live evidence files\n\n` +
    `- Validated files: ${summary.evidenceFiles?.length || 0}\n` +
    `- Invalid files: ${summary.evidenceFiles?.filter((file) => file.status === 'failed').length || 0}\n`
  );
}

async function verify(args: GateArgs) {
  const contextPath = path.resolve(args.evidenceDir, 'context.json');
  if (!(await pathExists(contextPath))) {
    throw new Error(`Acceptance context is missing. Run prepare first: ${contextPath}`);
  }
  const context = await readJson<AgentGatewayAcceptanceContext>(contextPath);
  const currentRepository = await getRepositoryContext();
  const evidencePath = path.resolve(args.evidenceDir, 'evidence.json');
  const evidence = (await pathExists(evidencePath))
    ? await readJson<AgentGatewayAcceptanceEvidence>(evidencePath)
    : undefined;
  const logsDirectory = path.resolve(args.evidenceDir, 'logs');
  await mkdir(logsDirectory, { recursive: true });

  const checks: AgentGatewayAcceptanceCheck[] = [createRepositoryContextCheck(context.repository, currentRepository)];
  let packOutput: CommandOutput | undefined;
  for (const spec of getCommandSpecs()) {
    if (!shouldRunSpec(spec, args.scope)) {
      checks.push(createSkippedCheck(spec, args.scope));
      continue;
    }
    const output = await runCommand(spec, logsDirectory);
    checks.push(output.result);
    if (spec.id === 'static.pack') {
      packOutput = output;
    }
  }
  const knownCheckIds = new Set(checks.map((check) => check.id));
  for (const id of AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS) {
    if (!knownCheckIds.has(id)) {
      throw new Error(`Release gate command matrix is missing required check ${id}`);
    }
  }

  const summary = evaluateAgentGatewayReleaseGate({
    context,
    checks,
    packageEvidence: parsePackageEvidence(packOutput),
    evidence,
    evidenceFiles: await validateEvidenceFiles(args.evidenceDir, evidence),
    generatedAt: new Date().toISOString(),
  });
  await writeJson(path.resolve(args.evidenceDir, 'summary.json'), summary);
  await writeFile(path.resolve(args.evidenceDir, 'report.md'), renderReport(summary), 'utf8');
  process.stdout.write(`${JSON.stringify({ status: summary.status, evidenceDir: args.evidenceDir })}\n`);
  if (summary.status === 'failed' || (summary.status === 'incomplete' && !args.allowIncomplete)) {
    process.exitCode = 1;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === 'prepare') {
    await prepare(args);
    return;
  }
  if (args.command === 'collect') {
    await collect(args);
    return;
  }
  if (args.command === 'scan') {
    const result = await scanCanonicalAliases();
    process.stdout.write(result.stdout);
    return;
  }
  await verify(args);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});

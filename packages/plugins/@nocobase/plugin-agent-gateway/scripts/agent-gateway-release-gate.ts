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
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

import {
  AGENT_GATEWAY_ACCEPTANCE_PROVIDERS,
  AGENT_GATEWAY_API_ACTIONS,
  AGENT_GATEWAY_BROWSER_SCENARIOS,
  AGENT_GATEWAY_REQUIRED_ACCEPTANCE_CHECKS,
  AGENT_GATEWAY_WEBSOCKET_DENIAL_SCENARIOS,
  AgentGatewayAcceptanceCheck,
  AgentGatewayAcceptanceCheckId,
  AgentGatewayAcceptanceContext,
  AgentGatewayAcceptanceEvidence,
  AgentGatewayAcceptanceProvider,
  AgentGatewayPackageEvidence,
  AgentGatewayReleaseGateSummary,
  evaluateAgentGatewayReleaseGate,
  getAgentGatewayApiPath,
} from '../src/shared/apiContract';

const execFileAsync = promisify(execFile);
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const REPOSITORY_ROOT = path.resolve(PLUGIN_ROOT, '../../../..');
const DEFAULT_EVIDENCE_ROOT = path.resolve(REPOSITORY_ROOT, 'storage/agent-gateway-acceptance');

type GateScope = 'none' | 'static' | 'full';

interface GateArgs {
  command: 'prepare' | 'verify';
  evidenceDir: string;
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
  if (command !== 'prepare' && command !== 'verify') {
    throw new Error('Usage: agent-gateway-release-gate.ts <prepare|verify> [options]');
  }
  let evidenceDir = '';
  let scope: GateScope = command === 'verify' ? 'full' : 'none';
  let requiredProviders: AgentGatewayAcceptanceProvider[] = [];
  let allowIncomplete = false;
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
  return { command, evidenceDir, scope, requiredProviders, allowIncomplete };
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
          mediaPaths: [],
          networkEvidencePaths: [],
          consoleErrors: [],
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
      terminal: 'pending',
      executionId: context.executionId,
      capturedAt: '',
      evidenceFiles: [],
    },
    findings: [],
  };
}

async function prepare(args: GateArgs) {
  const contextPath = path.resolve(args.evidenceDir, 'context.json');
  if (await pathExists(contextPath)) {
    throw new Error(`Refusing to reuse an existing acceptance execution: ${contextPath}`);
  }
  await mkdir(args.evidenceDir, { recursive: true });
  const context: AgentGatewayAcceptanceContext = {
    schemaVersion: 1,
    executionId: randomUUID(),
    startedAt: new Date().toISOString(),
    requiredProviders: args.requiredProviders,
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
    testSpec('contracts.release-gate', `${pluginPath}/src/shared/contracts/__tests__/acceptance.test.ts`),
    testSpec('packaging.bootstrap', `${pluginPath}/src/server/__tests__/packaging.test.ts`),
    testSpec('daemon.runner', `${pluginPath}/src/daemon/__tests__/runner.test.ts`),
    testSpec('daemon.lifecycle', `${pluginPath}/src/daemon/__tests__/daemonLifecycle.test.ts`),
    testSpec('daemon.skill-sync', `${pluginPath}/src/daemon/__tests__/skillSync.test.ts`),
    testSpec('daemon.terminal-stream', `${pluginPath}/src/daemon/__tests__/terminalStreamClient.test.ts`),
    testSpec('daemon.exec-driver', `${pluginPath}/src/daemon/__tests__/execDriver.test.ts`),
    testSpec('client.runs', `${pluginPath}/src/client-v2/__tests__/AgentGatewayRunsPage.test.tsx`),
    testSpec('client.artifacts', `${pluginPath}/src/client-v2/__tests__/runs/__tests__/artifacts.test.tsx`),
    testSpec('client.skills', `${pluginPath}/src/client-v2/__tests__/AgentGatewaySkillsPage.test.tsx`),
    testSpec('client.admin', `${pluginPath}/src/client-v2/__tests__/AgentGatewayAdminPages.test.tsx`),
    serverTestSpec('server.collections', `${pluginPath}/src/server/__tests__/collections.test.ts`),
    serverTestSpec('server.permissions', `${pluginPath}/src/server/__tests__/agentGatewayPermissions.test.ts`),
    serverTestSpec('server.node-lifecycle', `${pluginPath}/src/server/__tests__/nodeLifecycle.test.ts`),
    serverTestSpec('server.api-call-logging', `${pluginPath}/src/server/__tests__/apiCallLogging.test.ts`),
    serverTestSpec('server.run-lifecycle', `${pluginPath}/src/server/__tests__/runLifecycle.test.ts`),
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
  try {
    const output = await execFileAsync(spec.executable, spec.args, {
      cwd: spec.cwd,
      env: spec.env,
      maxBuffer: 64 * 1024 * 1024,
    });
    stdout = output.stdout;
    stderr = output.stderr;
  } catch (error) {
    status = 'failed';
    const output = getFailureOutput(error);
    stdout = output.stdout;
    stderr = output.stderr;
  }
  const finishedAt = new Date();
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
      warnings: getWarnings(`${stdout}\n${stderr}`),
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

function renderReport(summary: AgentGatewayReleaseGateSummary) {
  const checks = summary.checks
    .map((check) => `| ${check.id} | ${check.status} | ${check.durationMs} | ${check.reason || ''} |`)
    .join('\n');
  const list = (values: string[]) => (values.length ? values.map((value) => `- ${value}`).join('\n') : '- None');
  return (
    `# Agent Gateway release gate\n\n` +
    `- Status: **${summary.status}**\n` +
    `- Execution ID: \`${summary.context.executionId}\`\n` +
    `- Started: ${summary.context.startedAt}\n` +
    `- Generated: ${summary.generatedAt}\n` +
    `- Required providers: ${summary.context.requiredProviders.join(', ') || 'none'}\n\n` +
    `## Automated checks\n\n| Check | Status | Duration ms | Reason |\n| --- | --- | ---: | --- |\n${checks}\n\n` +
    `## Failures\n\n${list(summary.failures)}\n\n` +
    `## Incomplete evidence\n\n${list(summary.incomplete)}\n\n` +
    `## Warnings\n\n${list(summary.warnings)}\n\n` +
    `## Package\n\n` +
    `- Status: ${summary.packageEvidence?.status || 'missing'}\n` +
    `- File count: ${summary.packageEvidence?.fileCount || 0}\n` +
    `- Banned files: ${summary.packageEvidence?.bannedFiles.join(', ') || 'none'}\n`
  );
}

async function verify(args: GateArgs) {
  const contextPath = path.resolve(args.evidenceDir, 'context.json');
  if (!(await pathExists(contextPath))) {
    throw new Error(`Acceptance context is missing. Run prepare first: ${contextPath}`);
  }
  const context = await readJson<AgentGatewayAcceptanceContext>(contextPath);
  const evidencePath = path.resolve(args.evidenceDir, 'evidence.json');
  const evidence = (await pathExists(evidencePath))
    ? await readJson<AgentGatewayAcceptanceEvidence>(evidencePath)
    : undefined;
  const logsDirectory = path.resolve(args.evidenceDir, 'logs');
  await mkdir(logsDirectory, { recursive: true });

  const checks: AgentGatewayAcceptanceCheck[] = [];
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
  await verify(args);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { chmod, copyFile, mkdir, readFile, stat, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { promisify } from 'util';

import WebSocket from 'ws';

import {
  TERMINAL_PROTOCOL,
  TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
  TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX,
  TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX,
  TERMINAL_STREAM_WS_PATH,
} from '../src/shared/terminalStreamProtocol';
import {
  AdminScriptArgs,
  JsonRecord,
  findOneByFilter,
  getListItems,
  getString,
  isRecord,
  parseAdminArgs,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

const execFileAsync = promisify(execFile);

const TASK_ID = '11';
const BUSINESS_PROMPT = 'Build a compact Agent Gateway final acceptance request without clearing existing data.';
const RESTRICTED_ROLE_NAME = 'agwFinalRestricted';
const RESTRICTED_EMAIL = 'agw-final-restricted@example.com';
const RESTRICTED_PASSWORD_FILE = 'restricted-password';
const RESTRICTED_SNIPPETS = ['agentGateway.readRuns', 'agentGateway.readRunDetails'];
const NODE_SMOKE_PROFILE_KEY = 'final-smoke';
const MAX_CHILD_OUTPUT_BYTES = 20 * 1024 * 1024;

interface FinalAcceptanceArgs extends AdminScriptArgs {
  workspaceRoot: string;
  evidenceDir: string;
  requireRealCodex: boolean;
}

interface ChildOutput {
  stdout: string;
  stderr: string;
}

interface WsAttemptResult {
  scenario: string;
  ok: boolean;
  expected: string;
  actualFrameType: string;
  actualCode: string;
  closeCode?: number;
  errorSummary?: string;
}

interface WsAttemptExpectation {
  frameCode?: string;
  httpStatus?: number;
}

interface BrowserStreamTicket {
  ticket: string;
  ticketProof: string;
  authProof?: string;
  authenticator?: string;
  role?: string;
}

interface PrivateFileModeEvidence {
  path: string;
  mode: string;
  expectedMode: '0600';
  passed: boolean;
}

function parseArgs(argv: string[]): FinalAcceptanceArgs {
  const adminArgs = parseAdminArgs(argv);
  const { flags, booleanFlags } = parseAdminFlags(argv);
  const workspaceRoot = getString(flags['workspace-root']);
  const evidenceDir = getString(flags['evidence-dir']);
  if (!workspaceRoot || !evidenceDir) {
    throw new Error('--workspace-root and --evidence-dir are required');
  }
  return {
    ...adminArgs,
    workspaceRoot: resolve(workspaceRoot),
    evidenceDir: resolve(evidenceDir),
    requireRealCodex: booleanFlags.has('require-real-codex'),
  };
}

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path}`;
}

function getWebSocketUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = TERMINAL_STREAM_WS_PATH;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function encodeWebSocketProtocolValue(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function buildBrowserStreamProtocols(ticket: BrowserStreamTicket) {
  const protocols = [
    TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(ticket.ticket)}`,
    `${TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(ticket.ticketProof)}`,
    `${TERMINAL_STREAM_BROWSER_AUTHENTICATOR_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(
      ticket.authenticator || 'basic',
    )}`,
  ];
  if (ticket.authProof) {
    protocols.push(
      `${TERMINAL_STREAM_BROWSER_AUTH_PROOF_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(ticket.authProof)}`,
    );
  }
  if (ticket.role) {
    protocols.push(`${TERMINAL_STREAM_BROWSER_ROLE_PROTOCOL_PREFIX}${encodeWebSocketProtocolValue(ticket.role)}`);
  }
  return protocols;
}

function getResponseId(record: JsonRecord | null | undefined) {
  const id = getString(record?.id);
  if (!id) {
    throw new Error(`Expected record id, got ${JSON.stringify(record)}`);
  }
  return id;
}

function parseJsonFromChildOutput(output: ChildOutput, label: string): JsonRecord {
  const raw = output.stdout.trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isRecord(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through to extracting the JSON object from command wrappers.
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
    if (isRecord(parsed)) {
      return parsed;
    }
  }

  throw new Error(`${label} did not return a JSON object. stderr: ${output.stderr.slice(0, 500)}`);
}

async function runTsxJson(args: FinalAcceptanceArgs, script: string, scriptArgs: string[]) {
  const result = await execFileAsync('yarn', ['--silent', 'tsx', script, ...scriptArgs], {
    cwd: args.workspaceRoot,
    maxBuffer: MAX_CHILD_OUTPUT_BYTES,
  });
  return parseJsonFromChildOutput(
    {
      stdout: result.stdout,
      stderr: result.stderr,
    },
    script,
  );
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readJsonIfExists(path: string): Promise<JsonRecord | null> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function copyIfExists(source: string, target: string) {
  try {
    await copyFile(source, target);
  } catch {
    await writeJson(target, {
      status: 'missing',
      source,
      generatedAt: new Date().toISOString(),
    });
  }
}

async function fileExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function getErrorOutput(error: unknown) {
  const maybeChildError = error as { stdout?: unknown; stderr?: unknown; message?: unknown };
  const stdout = getString(maybeChildError.stdout);
  const stderr = getString(maybeChildError.stderr);
  const message = getString(maybeChildError.message);
  return [stdout, stderr, message].filter(Boolean).join('\n');
}

async function ensureAgentBrowserPreflight(args: FinalAcceptanceArgs) {
  const preflightPath = join(args.evidenceDir, 'agent-browser-preflight.json');
  const existing = await readJsonIfExists(preflightPath);
  if (existing?.agentBrowserAvailable === true) {
    return existing;
  }

  const logPath = join(args.evidenceDir, 'agent-browser-preflight.log');
  try {
    const result = await execFileAsync('agent-browser', ['doctor'], {
      cwd: args.workspaceRoot,
      maxBuffer: 1024 * 1024,
    });
    await writeFile(logPath, `${result.stdout}${result.stderr}`, 'utf8');
    const value = {
      agentBrowserAvailable: true,
      method: 'doctor',
      detailsPath: logPath,
    };
    await writeJson(preflightPath, value);
    return value;
  } catch (error) {
    await writeFile(logPath, getErrorOutput(error), 'utf8');
    const value = {
      agentBrowserAvailable: false,
      method: 'doctor',
      detailsPath: logPath,
      classification: 'environment prerequisite',
    };
    await writeJson(preflightPath, value);
    throw new Error(`agent-browser preflight failed; see ${logPath}`);
  }
}

async function getPrivateFileMode(path: string): Promise<PrivateFileModeEvidence> {
  const stats = await stat(path);
  const mode = `0${(stats.mode & 0o777).toString(8)}`;
  return {
    path,
    mode,
    expectedMode: '0600',
    passed: mode === '0600',
  };
}

async function writePrivateFileModes(evidenceDir: string, paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  const checked: PrivateFileModeEvidence[] = [];
  const missing: string[] = [];
  for (const path of uniquePaths) {
    if (!(await fileExists(path))) {
      missing.push(path);
      continue;
    }
    checked.push(await getPrivateFileMode(path));
  }
  const evidence = {
    generatedAt: new Date().toISOString(),
    checked,
    missing,
    allPresentFilesPassed: checked.every((item) => item.passed),
    allExpectedFilesPassed: missing.length === 0 && checked.every((item) => item.passed),
  };
  await writeJson(join(evidenceDir, 'private-file-modes.json'), evidence);
  return evidence;
}

async function fetchHealth(args: FinalAcceptanceArgs) {
  const response = await fetch(new URL('/api/__health_check', args.baseUrl));
  const text = await response.text();
  await writeFile(join(args.evidenceDir, 'preflight-health.txt'), text, 'utf8');
  if (!response.ok) {
    throw new Error(`Health check failed: HTTP ${response.status}`);
  }
}

async function upsertRole(baseUrl: string, token: string, roleName: string, title: string, snippets: string[]) {
  const values = {
    name: roleName,
    title,
    snippets,
    strategy: {
      actions: [],
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'roles', { name: roleName });
  if (existing) {
    await requestJson<JsonRecord>(baseUrl, `/api/roles:update/${encodeURIComponent(roleName)}`, {
      method: 'POST',
      token,
      body: values,
    });
    return;
  }
  await requestJson<JsonRecord>(baseUrl, '/api/roles:create', {
    method: 'POST',
    token,
    body: values,
  });
}

async function ensureDefaultRoleBinding(baseUrl: string, token: string, userId: string, roleName: string) {
  const filter = {
    userId,
    roleName,
  };
  const existing = await findOneByFilter(baseUrl, token, 'rolesUsers', filter);
  if (existing) {
    const search = new URLSearchParams();
    search.set('filter', JSON.stringify(filter));
    await requestJson<JsonRecord>(baseUrl, `/api/rolesUsers:update?${search.toString()}`, {
      method: 'POST',
      token,
      body: {
        default: true,
      },
    });
    return;
  }
  await requestJson<JsonRecord>(baseUrl, '/api/rolesUsers:create', {
    method: 'POST',
    token,
    body: {
      ...filter,
      default: true,
    },
  });
}

async function createRestrictedUser(args: FinalAcceptanceArgs, token: string) {
  const passwordPath = join(args.evidenceDir, RESTRICTED_PASSWORD_FILE);
  let password = '';
  try {
    password = (await readFile(passwordPath, 'utf8')).trim();
  } catch {
    password = '';
  }
  const passwordReused = Boolean(password);
  if (!password) {
    password = `agwFinal-${randomUUID()}!`;
  }
  await writeFile(passwordPath, password, 'utf8');
  await chmod(passwordPath, 0o600);

  await upsertRole(args.baseUrl, token, RESTRICTED_ROLE_NAME, 'Agent Gateway Final Restricted', RESTRICTED_SNIPPETS);
  const baseValues = {
    email: RESTRICTED_EMAIL,
    username: 'agw-final-restricted',
    nickname: 'AGW Final Restricted',
    roles: [RESTRICTED_ROLE_NAME],
    password,
  };
  const existing = await findOneByFilter(args.baseUrl, token, 'users', { email: RESTRICTED_EMAIL });
  const userId = existing
    ? getResponseId(existing)
    : getResponseId(
        await requestJson<JsonRecord>(args.baseUrl, '/api/users:create', {
          method: 'POST',
          token,
          body: baseValues,
        }),
      );
  if (existing) {
    await requestJson<JsonRecord>(args.baseUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
      method: 'POST',
      token,
      body: passwordReused
        ? {
            email: baseValues.email,
            username: baseValues.username,
            nickname: baseValues.nickname,
            roles: baseValues.roles,
          }
        : baseValues,
    });
  }
  await requestJson<JsonRecord>(args.baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
    method: 'POST',
    token,
    body: {
      values: [RESTRICTED_ROLE_NAME],
    },
  });
  await ensureDefaultRoleBinding(args.baseUrl, token, userId, RESTRICTED_ROLE_NAME);
  return {
    email: RESTRICTED_EMAIL,
    passwordFile: passwordPath,
    roleName: RESTRICTED_ROLE_NAME,
    userId,
  };
}

async function recordCurrentUser(args: FinalAcceptanceArgs, token: string, fileName: string, label: string) {
  const auth = await requestJson<JsonRecord>(args.baseUrl, '/api/auth:check', {
    token,
  });
  const user = isRecord(auth.user) ? auth.user : auth;
  const record = {
    source: 'final-agent-gateway-acceptance',
    label,
    observedAt: new Date().toISOString(),
    user: {
      id: getString(user.id),
      email: getString(user.email),
      username: getString(user.username),
      nickname: getString(user.nickname),
    },
  };
  await writeJson(join(args.evidenceDir, fileName), record);
  return record;
}

function extractInviteToken(registerCommand: string) {
  const match = registerCommand.match(/--invite-token\s+'([^']+)'/);
  if (!match) {
    throw new Error(`Unable to extract invitation token from register command: ${registerCommand}`);
  }
  return match[1];
}

async function requestRaw(
  baseUrl: string,
  path: string,
  options: { method?: 'GET' | 'POST'; token?: string; nodeToken?: string; body?: JsonRecord } = {},
) {
  const response = await fetch(new URL(path, baseUrl), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'X-Authenticator': 'basic',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token || options.nodeToken ? { Authorization: `Bearer ${options.token || options.nodeToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    text,
  };
}

async function runNodeManagementSmoke(args: FinalAcceptanceArgs, token: string) {
  const scenarioId = `agw-final-node-${Date.now()}`;
  const nodeKey = `${scenarioId}-node`;
  const invitation = await requestJson<JsonRecord>(args.baseUrl, '/api/agent-gateway/node-invitations:create', {
    method: 'POST',
    token,
    body: {
      invitationKey: `${scenarioId}-invitation`,
      expectedNodeKey: nodeKey,
      serverUrl: args.baseUrl,
      expiresInSeconds: 3600,
      metadataJson: {
        task: TASK_ID,
        scenarioId,
      },
    },
  });
  const inviteToken = extractInviteToken(getString(invitation.registerCommand));
  const registered = await requestJson<JsonRecord>(args.baseUrl, '/api/agent-gateway/nodes:register', {
    method: 'POST',
    body: {
      inviteToken,
      nodeKey,
      displayName: `Final acceptance node ${scenarioId}`,
      capabilities: {
        terminalStream: true,
        maxConcurrency: 1,
      },
      daemonVersion: 'final-acceptance-script',
    },
  });
  const nodeId = getString(registered.nodeId);
  const nodeToken = getString(registered.nodeToken);
  if (!nodeId || !nodeToken) {
    throw new Error(`Node registration response is invalid: ${JSON.stringify(registered)}`);
  }

  await writeFile(join(args.evidenceDir, 'node-token'), nodeToken, 'utf8');
  await chmod(join(args.evidenceDir, 'node-token'), 0o600);

  const heartbeat = await requestJson<JsonRecord>(
    args.baseUrl,
    `/api/agent-gateway/nodes/${encodeURIComponent(nodeId)}/heartbeat`,
    {
      method: 'POST',
      nodeToken,
      body: {
        currentConcurrency: 0,
        capabilities: {
          terminalStream: true,
          maxConcurrency: 1,
        },
        profiles: [
          {
            profileKey: NODE_SMOKE_PROFILE_KEY,
            provider: 'generic-cli',
            displayName: 'Final smoke profile',
            agentType: 'code',
            driver: 'fake',
            status: 'active',
            capabilities: {
              terminalOutput: true,
              terminate: true,
            },
          },
        ],
      },
    },
  );
  const profiles = await requestJson<unknown>(
    args.baseUrl,
    `/api/agent-gateway/nodes/${encodeURIComponent(nodeId)}/profiles:list`,
    {
      token,
    },
  );
  const profileHealth = getListItems(profiles).some(
    (profile) => getString(profile.profileKey) === NODE_SMOKE_PROFILE_KEY,
  )
    ? 'available'
    : 'missing';
  await requestJson<JsonRecord>(args.baseUrl, `/api/agent-gateway/nodes:update/${encodeURIComponent(nodeId)}`, {
    method: 'POST',
    token,
    body: {
      status: 'disabled',
    },
  });
  const disabledClaim = await requestRaw(
    args.baseUrl,
    `/api/agent-gateway/nodes/${encodeURIComponent(nodeId)}/runs:claim`,
    {
      method: 'POST',
      nodeToken,
      body: {},
    },
  );
  await requestJson<JsonRecord>(args.baseUrl, `/api/agent-gateway/nodes:update/${encodeURIComponent(nodeId)}`, {
    method: 'POST',
    token,
    body: {
      status: 'active',
    },
  });

  const evidence = {
    flow: 'node-management-helper',
    source: 'final-agent-gateway-acceptance',
    observedAt: new Date().toISOString(),
    url: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/nodes'),
    result: {
      nodeId,
      invitationCreated: Boolean(invitation.invitationId),
      heartbeatSeen: getString(heartbeat.status) === 'active',
      profileHealth,
      disabledClaimRejected: disabledClaim.status === 403,
      reEnabled: true,
    },
  };
  await writeJson(join(args.evidenceDir, 'node-management-helper.json'), evidence);
  const browserSmokePath = join(args.evidenceDir, 'node-management-smoke.json');
  const existingBrowserSmoke = await readJsonIfExists(browserSmokePath);
  if (getString(existingBrowserSmoke?.source) !== 'agent-browser+node-lifecycle-helper') {
    await writeJson(browserSmokePath, {
      flow: 'node-management-smoke',
      source: 'agent-browser+node-lifecycle-helper',
      status: 'pending-browser-validation',
      observedAt: new Date().toISOString(),
      url: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/nodes'),
      result: {
        nodeId,
        invitationCreated: Boolean(invitation.invitationId),
        invitationCreatedInBrowser: false,
        registrationPerformedBy: 'node-lifecycle-helper',
        heartbeatSeen: getString(heartbeat.status) === 'active',
        profileHealth,
        disabledClaimRejected: disabledClaim.status === 403,
        reEnabled: true,
      },
      helperEvidencePath: join(args.evidenceDir, 'node-management-helper.json'),
    });
  }
  return evidence;
}

async function attemptWebSocket(
  wsUrl: string,
  options: {
    scenario: string;
    runId: string;
    protocols: string[];
    origin?: string;
    expectation: WsAttemptExpectation;
  },
): Promise<WsAttemptResult> {
  return await new Promise<WsAttemptResult>((resolve) => {
    const socket = new WebSocket(wsUrl, options.protocols, {
      headers: options.origin
        ? {
            Origin: options.origin,
          }
        : undefined,
    });
    let settled = false;
    const finish = (result: WsAttemptResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // Socket may already be closed.
      }
      resolve(result);
    };
    const timer = setTimeout(() => {
      finish({
        scenario: options.scenario,
        ok: false,
        expected: describeWsExpectation(options.expectation),
        actualFrameType: 'timeout_without_ack',
        actualCode: 'TIMEOUT_WITHOUT_ACK',
      });
    }, 5000);
    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'browser.subscribe',
          protocol: TERMINAL_PROTOCOL,
          requestId: `${options.scenario}-${Date.now()}`,
          runId: options.runId,
          lastOffset: 0,
        }),
      );
    });
    socket.on('message', (data) => {
      let frame: unknown = {};
      try {
        frame = JSON.parse(String(data)) as unknown;
      } catch {
        finish({
          scenario: options.scenario,
          ok: false,
          expected: describeWsExpectation(options.expectation),
          actualFrameType: 'parse-error',
          actualCode: 'PARSE_ERROR',
        });
        return;
      }
      const frameRecord = isRecord(frame) ? frame : {};
      const frameType = getString(frameRecord.type);
      const code = getString(frameRecord.code) || (frameType === 'ack' ? 'ACK' : 'NO_CODE');
      finish({
        scenario: options.scenario,
        ok: options.expectation.frameCode ? frameType === 'error' && code === options.expectation.frameCode : false,
        expected: describeWsExpectation(options.expectation),
        actualFrameType: frameType || 'unknown',
        actualCode: code,
      });
    });
    socket.on('close', (code) => {
      finish({
        scenario: options.scenario,
        ok: false,
        expected: describeWsExpectation(options.expectation),
        actualFrameType: 'closed',
        actualCode: 'CLOSED',
        closeCode: code,
      });
    });
    socket.on('error', (error) => {
      const message = error instanceof Error ? error.message : String(error);
      const httpStatus = getWebSocketHttpErrorStatus(message);
      finish({
        scenario: options.scenario,
        ok: options.expectation.httpStatus ? httpStatus === options.expectation.httpStatus : false,
        expected: describeWsExpectation(options.expectation),
        actualFrameType: httpStatus ? 'http-rejection' : 'socket-error',
        actualCode: httpStatus ? `HTTP_${httpStatus}` : 'SOCKET_ERROR',
        errorSummary: message.slice(0, 120),
      });
    });
  });
}

function describeWsExpectation(expectation: WsAttemptExpectation) {
  if (expectation.httpStatus) {
    return `http ${expectation.httpStatus}`;
  }
  if (expectation.frameCode) {
    return `terminal error ${expectation.frameCode}`;
  }
  return 'explicit rejection';
}

function getWebSocketHttpErrorStatus(message: string) {
  const match = message.match(/Unexpected server response:\s*(\d{3})/i);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

async function createBrowserStreamTicket(args: FinalAcceptanceArgs, token: string, runId: string) {
  const ticket = await requestJson<JsonRecord>(
    args.baseUrl,
    `/api/agent-gateway/runs/${encodeURIComponent(runId)}/terminal-stream-tickets:create`,
    {
      method: 'POST',
      token,
      body: {},
    },
  );
  const ticketValue = getString(ticket.ticket);
  const ticketProof = getString(ticket.ticketProof);
  if (!ticketValue || !ticketProof) {
    throw new Error(`Stream ticket create response is invalid for run ${runId}`);
  }
  return {
    ticket: ticketValue,
    ticketProof,
    authProof: getString(ticket.authProof) || undefined,
    authenticator: getString(ticket.authenticator) || 'basic',
    role: getString(ticket.role) || undefined,
  };
}

async function collectWebSocketRejectionEvidence(args: FinalAcceptanceArgs, token: string, runId: string) {
  const wsUrl = getWebSocketUrl(args.baseUrl);
  const fakeTicket = encodeWebSocketProtocolValue('invalid-ticket');
  const fakeProof = encodeWebSocketProtocolValue('invalid-proof');
  const validTicket = await createBrowserStreamTicket(args, token, runId);
  const attempts = await Promise.all([
    attemptWebSocket(wsUrl, {
      scenario: 'no-subprotocol',
      runId,
      protocols: [],
      expectation: {
        frameCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      },
    }),
    attemptWebSocket(wsUrl, {
      scenario: 'no-cookie-missing-ticket',
      runId,
      protocols: [TERMINAL_STREAM_BROWSER_SUBPROTOCOL],
      expectation: {
        frameCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      },
    }),
    attemptWebSocket(wsUrl, {
      scenario: 'forged-subprotocol',
      runId,
      protocols: [
        TERMINAL_STREAM_BROWSER_SUBPROTOCOL,
        `${TERMINAL_STREAM_BROWSER_TICKET_PROTOCOL_PREFIX}${fakeTicket}`,
        `${TERMINAL_STREAM_BROWSER_TICKET_PROOF_PROTOCOL_PREFIX}${fakeProof}`,
      ],
      expectation: {
        frameCode: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      },
    }),
    attemptWebSocket(wsUrl, {
      scenario: 'cross-origin-valid-ticket',
      runId,
      protocols: buildBrowserStreamProtocols(validTicket),
      origin: 'https://invalid.agent-gateway.test',
      expectation: {
        httpStatus: 403,
      },
    }),
  ]);
  const evidence = {
    generatedAt: new Date().toISOString(),
    wsUrl,
    runId,
    attempts,
    crossOriginWsRejected: attempts.every((attempt) => attempt.ok),
    requiredScenarios: [
      'no-subprotocol',
      'no-cookie-missing-ticket',
      'forged-subprotocol',
      'cross-origin-valid-ticket',
    ],
    note: 'The broker authenticates browser streams with WebSocket subprotocol ticket material and same-origin upgrade checks; this evidence records only redacted rejection outcomes.',
  };
  await writeJson(join(args.evidenceDir, 'cross-origin-ws-rejections.json'), evidence);
  return evidence;
}

function getProviderRun(providerSeed: JsonRecord, provider: string) {
  const providerRuns = isRecord(providerSeed.providerRuns) ? providerSeed.providerRuns : {};
  const run = providerRuns[provider];
  return isRecord(run) ? run : {};
}

function isReusableFinalSeedOutput(record: JsonRecord | null): record is JsonRecord {
  return (
    record !== null &&
    getString(record.task) === TASK_ID &&
    Boolean(getString(record.scenarioId)) &&
    Boolean(getString(record.businessPageUrl)) &&
    isRecord(record.providerRuns)
  );
}

function getEvidenceUrl(record: JsonRecord | null) {
  return getString(record?.url);
}

function getVAdminUrl(baseUrl: string, url: string) {
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url, baseUrl);
    if (parsed.pathname.startsWith('/admin/')) {
      parsed.pathname = `/v${parsed.pathname}`;
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function getActualBusinessDispatchResult(evidenceDir: string) {
  return readJsonIfExists(join(evidenceDir, 'business-dispatch-result.json'));
}

function getBooleanEvidence(record: JsonRecord | null, path: string) {
  if (!record) {
    return false;
  }
  const segments = path.split('.');
  let current: unknown = record;
  for (const segment of segments) {
    current = isRecord(current) ? current[segment] : undefined;
  }
  return current === true;
}

function getRecordEvidence(record: JsonRecord | null, path: string): JsonRecord | null {
  let current: unknown = record;
  for (const segment of path.split('.')) {
    current = isRecord(current) ? current[segment] : undefined;
  }
  return isRecord(current) ? current : null;
}

function getRunIdFromUrl(url: string) {
  if (!url) {
    return '';
  }
  try {
    return getString(new URL(url).searchParams.get('runId'));
  } catch {
    return '';
  }
}

function evidenceTargetsRun(record: JsonRecord | null, expectedRunId: string, keys: string[] = ['runId']) {
  if (!expectedRunId) {
    return false;
  }
  let hasAnchor = false;
  const urlRunId = getRunIdFromUrl(getEvidenceUrl(record));
  if (urlRunId) {
    hasAnchor = true;
    if (urlRunId !== expectedRunId) {
      return false;
    }
  }
  const result = getRecordEvidence(record, 'result');
  for (const key of keys) {
    const value = getString(result?.[key]);
    if (!value) {
      continue;
    }
    hasAnchor = true;
    if (value !== expectedRunId) {
      return false;
    }
  }
  return hasAnchor;
}

function getSeedRunId(seed: JsonRecord, key: string) {
  return getRunIdFromUrl(getString(seed[key]));
}

function evidenceUrlMatchesOneOf(record: JsonRecord | null, urls: string[]) {
  const evidenceUrl = getEvidenceUrl(record);
  if (!evidenceUrl) {
    return false;
  }
  return urls.filter(Boolean).some((url) => evidenceUrl === url);
}

function isBrowserProducedEvidence(record: JsonRecord | null, expectedFlow?: string) {
  if (!record) {
    return false;
  }
  const source = getString(record.source);
  const flow = getString(record.flow);
  return source.startsWith('agent-browser') && (!expectedFlow || flow === expectedFlow);
}

function evidenceHasSucceededControl(record: JsonRecord | null) {
  const result = getRecordEvidence(record, 'result');
  return getString(result?.finalState) === 'succeeded';
}

function evidenceHasTerminalRunStatus(record: JsonRecord | null) {
  const result = getRecordEvidence(record, 'result');
  const runStatus = getString(result?.runStatus);
  if (!runStatus) {
    return false;
  }
  const expected = Array.isArray(result?.expectedRunStatuses) ? result.expectedRunStatuses : [];
  return expected.map((item) => getString(item)).includes(runStatus);
}

function hasRunDetailUiCompleteness(record: JsonRecord | null) {
  const result = getRecordEvidence(record, 'result');
  return (
    isBrowserProducedEvidence(record, 'final-run-detail-ui-completeness') &&
    result?.summaryVisible === true &&
    result.timelineVisible === true &&
    result.xtermVisible === true &&
    result.artifactsVisible === true &&
    result.rawLogsVisibleOrClearlyUnavailable === true &&
    result.auditVisible === true &&
    result.controlsVisibleOrCapabilityExplained === true &&
    result.adminAndVAdminParity === true &&
    result.noDuplicateNavigation === true &&
    result.compactLayoutChecked === true &&
    result.noOverlapsDetected === true &&
    isRecord(result.selectors) &&
    isRecord(result.viewport) &&
    Boolean(getString(result.screenshotPath))
  );
}

function hasExpectedScreenshot(record: JsonRecord | null) {
  return Boolean(getString(record?.screenshotPath) || getString(getRecordEvidence(record, 'result')?.screenshotPath));
}

function hasExpectedUrl(record: JsonRecord | null, pathSegment: string) {
  const url = getString(record?.url);
  return url.includes(pathSegment);
}

function hasAdminBrowserContext(record: JsonRecord | null, adminEmail: string, restrictedUserId: string) {
  const user = getRecordEvidence(record, 'user');
  const userId = getString(user?.id);
  return (
    isBrowserProducedEvidence(record, 'current-user-admin') &&
    getString(user?.email) === adminEmail &&
    Boolean(userId) &&
    userId !== restrictedUserId
  );
}

function hasRestrictedBrowserContext(record: JsonRecord | null, restrictedUser: { email: string; userId: string }) {
  const user = getRecordEvidence(record, 'user');
  return (
    isBrowserProducedEvidence(record, 'current-user-restricted') &&
    getString(record?.role) === RESTRICTED_ROLE_NAME &&
    getBooleanEvidence(record, 'restrictedBrowserContextVerified') &&
    getString(user?.email) === restrictedUser.email &&
    getString(user?.id) === restrictedUser.userId
  );
}

function hasProviderBrowserEvidence(record: JsonRecord | null) {
  return (
    isBrowserProducedEvidence(record, 'provider-capability-page') &&
    hasExpectedUrl(record, '/agent-gateway/provider-capabilities') &&
    hasExpectedScreenshot(record) &&
    (record?.hasRows === true || record?.hasEmptyState === true)
  );
}

function hasAuditBrowserEvidence(record: JsonRecord | null) {
  const result = getRecordEvidence(record, 'result');
  return (
    isBrowserProducedEvidence(record, 'audit-page-browser') &&
    hasExpectedUrl(record, '/agent-gateway/audit') &&
    hasExpectedScreenshot(record) &&
    record?.hasAudit === true &&
    result?.auditTableVisible === true &&
    result.redactedPreviewVisible === true
  );
}

function getEvidenceBoolean(record: JsonRecord | null, path: string) {
  if (getBooleanEvidence(record, path)) {
    return true;
  }
  return getBooleanEvidence(getRecordEvidence(record, 'result'), path);
}

function hasSuccessfulRealCodexEvidenceStatus(record: JsonRecord | null) {
  const status = getString(record?.status) || getString(getRecordEvidence(record, 'result')?.status);
  return ['complete', 'passed', 'succeeded', 'success'].includes(status);
}

function hasRealCodexSourceSignal(record: JsonRecord | null) {
  const result = getRecordEvidence(record, 'result');
  const source = `${getString(record?.source)} ${getString(result?.source)}`.toLowerCase();
  const mode = getString(record?.mode) || getString(result?.mode);
  return mode === 'real-codex' || source.includes('real-codex');
}

function hasRealCodexResumeLineage(record: JsonRecord | null) {
  const result = getRecordEvidence(record, 'result');
  const sourceRunId =
    getString(record?.sourceRunId) ||
    getString(record?.originalRunId) ||
    getString(result?.sourceRunId) ||
    getString(result?.originalRunId);
  const continuationRunId = getString(record?.continuationRunId) || getString(result?.continuationRunId);
  return Boolean(sourceRunId && continuationRunId);
}

async function loadRealCodexResumeEvidence(evidenceDir: string, existingCompatibility: JsonRecord | null) {
  const candidatePaths = [
    join(evidenceDir, 'codex-resume-compatibility.json'),
    join(evidenceDir, 'real-codex', 'summary.json'),
    join(evidenceDir, 'real-codex', 'codex-resume-compatibility.json'),
    join(evidenceDir, 'real-codex', 'real-codex-resume.json'),
    join(evidenceDir, 'real-codex-resume.json'),
  ];
  const candidates: Array<{ path: string; record: JsonRecord | null }> = [
    {
      path: candidatePaths[0],
      record: existingCompatibility,
    },
  ];
  for (const path of candidatePaths.slice(1)) {
    candidates.push({
      path,
      record: await readJsonIfExists(path),
    });
  }

  for (const candidate of candidates) {
    if (
      getEvidenceBoolean(candidate.record, 'realCodexResumeVerified') &&
      hasSuccessfulRealCodexEvidenceStatus(candidate.record) &&
      hasRealCodexSourceSignal(candidate.record) &&
      hasRealCodexResumeLineage(candidate.record)
    ) {
      return {
        verified: true,
        evidencePath: candidate.path,
      };
    }
  }

  return {
    verified: false,
    evidencePath: '',
  };
}

async function ensurePlaceholderEvidence(evidenceDir: string, fileName: string, flow: string) {
  const path = join(evidenceDir, fileName);
  const existing = await readJsonIfExists(path);
  if (existing) {
    return existing;
  }
  const value = {
    flow,
    source: 'final-agent-gateway-acceptance',
    status: 'pending-browser-validation',
    observedAt: new Date().toISOString(),
  };
  await writeJson(path, value);
  return value;
}

async function ensureCurrentUserBrowserEvidencePlaceholder(
  args: FinalAcceptanceArgs,
  fileName: string,
  values: JsonRecord,
) {
  const path = join(args.evidenceDir, fileName);
  const existing = await readJsonIfExists(path);
  if (existing && getString(existing.source) === 'agent-browser') {
    return existing;
  }
  const value = {
    source: 'final-agent-gateway-acceptance',
    status: 'pending-browser-validation',
    observedAt: new Date().toISOString(),
    ...values,
  };
  await writeJson(path, value);
  return value;
}

async function main() {
  const args = parseArgs(process.argv);
  await mkdir(args.evidenceDir, { recursive: true });
  await chmod(args.evidenceDir, 0o700);
  await fetchHealth(args);
  await ensureAgentBrowserPreflight(args);

  const token = await signIn(args);
  const seedOutputPath = join(args.evidenceDir, 'seed.json');
  const existingSeedOutput = await readJsonIfExists(seedOutputPath);
  const reuseExistingSeed = isReusableFinalSeedOutput(existingSeedOutput);
  const scenarioId = reuseExistingSeed
    ? getString(existingSeedOutput.scenarioId)
    : `agw-final-acceptance-${Date.now()}`;
  const businessEvidenceDir = join(args.evidenceDir, 'business-trigger');
  const providerEvidenceDir = join(args.evidenceDir, 'provider-capabilities');
  await mkdir(businessEvidenceDir, { recursive: true });
  await mkdir(providerEvidenceDir, { recursive: true });

  const businessSeed = reuseExistingSeed
    ? existingSeedOutput
    : await runTsxJson(
        args,
        'packages/plugins/@nocobase/plugin-agent-gateway/scripts/seed-agent-business-trigger-scenario.ts',
        [
          '--base-url',
          args.baseUrl,
          '--admin-email',
          args.adminEmail,
          '--admin-password',
          args.adminPassword,
          '--evidence-dir',
          businessEvidenceDir,
          '--prompt',
          BUSINESS_PROMPT,
        ],
      );
  const providerSeed = reuseExistingSeed
    ? existingSeedOutput
    : await runTsxJson(
        args,
        'packages/plugins/@nocobase/plugin-agent-gateway/scripts/seed-provider-capability-scenario.ts',
        [
          '--base-url',
          args.baseUrl,
          '--admin-email',
          args.adminEmail,
          '--admin-password',
          args.adminPassword,
          '--evidence-dir',
          providerEvidenceDir,
          '--providers',
          'codex,opencode,claude-code,generic-cli',
        ],
      );

  if (!reuseExistingSeed) {
    await copyIfExists(
      getString(providerSeed.providerCapabilityMatrixPath),
      join(args.evidenceDir, 'provider-capability-matrix.json'),
    );
    await copyIfExists(
      getString(providerSeed.optionalProviderCliSupportPath),
      join(args.evidenceDir, 'optional-provider-cli-support.json'),
    );
    await copyIfExists(
      getString(providerSeed.unsupportedActionRejectionsPath),
      join(args.evidenceDir, 'server-unsupported-action-rejections.json'),
    );
    await copyIfExists(
      getString(providerSeed.unsupportedOutputArtifactRawLogStatesPath),
      join(args.evidenceDir, 'unsupported-output-artifact-rawlog-states.json'),
    );
  }

  const restrictedUser = await createRestrictedUser(args, token);
  await recordCurrentUser(args, token, 'admin-script-current-user.json', 'admin-script-context');
  await ensureCurrentUserBrowserEvidencePlaceholder(args, 'browser-current-user-admin.json', {
    role: 'root',
  });
  await ensureCurrentUserBrowserEvidencePlaceholder(args, 'browser-current-user-restricted.json', {
    email: restrictedUser.email,
    passwordFile: restrictedUser.passwordFile,
  });
  const existingNodeSmoke = await readJsonIfExists(join(args.evidenceDir, 'node-management-helper.json'));
  const nodeSmoke =
    reuseExistingSeed && existingNodeSmoke ? existingNodeSmoke : await runNodeManagementSmoke(args, token);
  const opencodeRun = getProviderRun(providerSeed, 'opencode');
  const wsEvidence = await collectWebSocketRejectionEvidence(args, token, getString(opencodeRun.runId));

  await ensurePlaceholderEvidence(args.evidenceDir, 'business-dispatch-result.json', 'final-business-dispatch');
  await ensurePlaceholderEvidence(args.evidenceDir, 'live-xterm-output.json', 'live-xterm-output');
  await ensurePlaceholderEvidence(args.evidenceDir, 'resume-flow.json', 'resume');
  await ensurePlaceholderEvidence(args.evidenceDir, 'interrupt-flow.json', 'interrupt');
  await ensurePlaceholderEvidence(args.evidenceDir, 'terminate-flow.json', 'terminate');
  await ensurePlaceholderEvidence(
    args.evidenceDir,
    'run-detail-ui-completeness.json',
    'final-run-detail-ui-completeness',
  );
  await ensurePlaceholderEvidence(args.evidenceDir, 'network-redaction.json', 'network-redaction');
  await ensurePlaceholderEvidence(args.evidenceDir, 'permission-denied-flow.json', 'permission-denied');
  const codexResumeCompatibilityPath = join(args.evidenceDir, 'codex-resume-compatibility.json');
  const existingCodexResumeCompatibility = await readJsonIfExists(codexResumeCompatibilityPath);
  const realCodexResumeEvidence = await loadRealCodexResumeEvidence(args.evidenceDir, existingCodexResumeCompatibility);
  const realCodexResumeVerified = realCodexResumeEvidence.verified;
  const codexResumeCompatibilityVerified =
    getProviderRun(providerSeed, 'codex').capabilities !== undefined ||
    getEvidenceBoolean(existingCodexResumeCompatibility, 'codexResumeCompatibilityVerified');
  await writeJson(codexResumeCompatibilityPath, {
    ...(existingCodexResumeCompatibility || {}),
    generatedAt: new Date().toISOString(),
    codexResumeCompatibilityVerified,
    realCodexResumeVerified,
    ...(realCodexResumeEvidence.evidencePath ? { realCodexEvidencePath: realCodexResumeEvidence.evidencePath } : {}),
    requireRealCodex: args.requireRealCodex,
  });

  const businessDispatchResult = await getActualBusinessDispatchResult(args.evidenceDir);
  const liveOutputEvidence = await readJsonIfExists(join(args.evidenceDir, 'live-xterm-output.json'));
  const adminBrowserEvidence = await readJsonIfExists(join(args.evidenceDir, 'browser-current-user-admin.json'));
  const restrictedBrowserEvidence = await readJsonIfExists(
    join(args.evidenceDir, 'browser-current-user-restricted.json'),
  );
  const resumeFlow = await readJsonIfExists(join(args.evidenceDir, 'resume-flow.json'));
  const interruptFlow = await readJsonIfExists(join(args.evidenceDir, 'interrupt-flow.json'));
  const terminateFlow = await readJsonIfExists(join(args.evidenceDir, 'terminate-flow.json'));
  const nodeManagementSmoke = await readJsonIfExists(join(args.evidenceDir, 'node-management-smoke.json'));
  const runDetailUiCompleteness = await readJsonIfExists(join(args.evidenceDir, 'run-detail-ui-completeness.json'));
  const networkRedaction = await readJsonIfExists(join(args.evidenceDir, 'network-redaction.json'));
  const permissionDeniedFlow = await readJsonIfExists(join(args.evidenceDir, 'permission-denied-flow.json'));
  const providerBrowserEvidence = await readJsonIfExists(join(args.evidenceDir, 'provider-page-browser-evidence.json'));
  const auditBrowserEvidence = await readJsonIfExists(join(args.evidenceDir, 'audit-page-browser-evidence.json'));
  const dispatchResult = isRecord(businessDispatchResult?.result) ? businessDispatchResult.result : null;
  const expectedNodeManagementNodeId =
    getString(existingSeedOutput?.nodeManagementNodeId) ||
    getString(getRecordEvidence(nodeManagementSmoke, 'result')?.nodeId) ||
    getString(getRecordEvidence(nodeSmoke, 'result')?.nodeId);
  const privateFileModeEvidence = await writePrivateFileModes(args.evidenceDir, [
    restrictedUser.passwordFile,
    join(args.evidenceDir, 'node-token'),
    join(args.evidenceDir, 'control-claims-private.json'),
  ]);
  if (args.requireRealCodex && !realCodexResumeVerified) {
    throw new Error('--require-real-codex was set, but real Codex resume evidence is not present');
  }

  const resumeRunDetailUrl = getEvidenceUrl(resumeFlow) || getString(getProviderRun(providerSeed, 'codex').runUrl);
  const interruptRunUrl = getEvidenceUrl(interruptFlow) || getString(getProviderRun(providerSeed, 'opencode').runUrl);
  const terminateRunUrl =
    getEvidenceUrl(terminateFlow) || getString(getProviderRun(providerSeed, 'claude-code').runUrl);
  const restrictedRunDetailUrl =
    getEvidenceUrl(permissionDeniedFlow) || getString(getProviderRun(providerSeed, 'generic-cli').runUrl);
  const summaryPath = join(args.evidenceDir, 'summary.json');
  const output = {
    task: TASK_ID,
    scenarioId,
    reuseExistingSeed,
    seedOutputPath,
    businessPageUrl: getString(businessSeed.businessPageUrl),
    vBusinessPageUrl: getString(businessSeed.vBusinessPageUrl),
    restrictedUser,
    businessDispatchResultPath: join(args.evidenceDir, 'business-dispatch-result.json'),
    ...(dispatchResult
      ? {
          runDetailUrl: getString(dispatchResult.runDetailUrl),
          vRunDetailUrl: getString(dispatchResult.vRunDetailUrl),
        }
      : {
          preparedRunDetailUrl: getString(getProviderRun(providerSeed, 'codex').runUrl),
          vPreparedRunDetailUrl: getString(getProviderRun(providerSeed, 'codex').vRunUrl),
        }),
    restrictedRunDetailUrl,
    vRestrictedRunDetailUrl:
      getVAdminUrl(args.baseUrl, restrictedRunDetailUrl) ||
      getString(getProviderRun(providerSeed, 'generic-cli').vRunUrl),
    auditUrl: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/audit'),
    vAuditUrl: buildUrl(args.baseUrl, '/v/admin/settings/agent-gateway/audit'),
    nodesUrl: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/nodes'),
    vNodesUrl: buildUrl(args.baseUrl, '/v/admin/settings/agent-gateway/nodes'),
    resumeRunDetailUrl,
    vResumeRunDetailUrl:
      getVAdminUrl(args.baseUrl, resumeRunDetailUrl) || getString(getProviderRun(providerSeed, 'codex').vRunUrl),
    interruptRunUrl,
    vInterruptRunUrl:
      getVAdminUrl(args.baseUrl, interruptRunUrl) || getString(getProviderRun(providerSeed, 'opencode').vRunUrl),
    terminateRunUrl,
    vTerminateRunUrl:
      getVAdminUrl(args.baseUrl, terminateRunUrl) || getString(getProviderRun(providerSeed, 'claude-code').vRunUrl),
    providerCapabilityMatrixPath: join(args.evidenceDir, 'provider-capability-matrix.json'),
    providerCapabilityMatrixUrl: getString(providerSeed.providerCapabilityMatrixUrl),
    vProviderCapabilityMatrixUrl: getString(providerSeed.vProviderCapabilityMatrixUrl),
    providerRuns: providerSeed.providerRuns,
    realCodexResumeVerified,
    optionalProviderCliSupportPath: join(args.evidenceDir, 'optional-provider-cli-support.json'),
    crossOriginWsRejectionsPath: join(args.evidenceDir, 'cross-origin-ws-rejections.json'),
    nodeManagementSmokePath: join(args.evidenceDir, 'node-management-smoke.json'),
    nodeManagementHelperPath: join(args.evidenceDir, 'node-management-helper.json'),
    nodeManagementNodeId: expectedNodeManagementNodeId,
    runDetailUiCompletenessPath: join(args.evidenceDir, 'run-detail-ui-completeness.json'),
    privateFileModesPath: join(args.evidenceDir, 'private-file-modes.json'),
    summaryPath,
  };

  const nestedBusinessSeed = await readJsonIfExists(join(businessEvidenceDir, 'seed.json'));
  const dispatchRunId = getString(dispatchResult?.runId);
  const expectedSeedDispatchRunId = getSeedRunId(output, 'runDetailUrl');
  const expectedBusinessRecordId = getString(nestedBusinessSeed?.recordId) || getString(businessSeed.recordId);
  const businessDispatchEvidenceCurrent =
    Boolean(dispatchResult) &&
    isBrowserProducedEvidence(businessDispatchResult, 'final-business-dispatch') &&
    evidenceUrlMatchesOneOf(businessDispatchResult, [
      getString(businessSeed.businessPageUrl),
      getString(businessSeed.vBusinessPageUrl),
    ]) &&
    evidenceTargetsRun(businessDispatchResult, dispatchRunId, ['runId']) &&
    (!expectedSeedDispatchRunId || dispatchRunId === expectedSeedDispatchRunId) &&
    (Boolean(expectedSeedDispatchRunId) ||
      !expectedBusinessRecordId ||
      getString(dispatchResult?.businessRecordId) === expectedBusinessRecordId);
  const liveOutputEvidenceCurrent =
    isBrowserProducedEvidence(liveOutputEvidence, 'live-xterm-output') &&
    evidenceTargetsRun(liveOutputEvidence, dispatchRunId, ['runId']);
  const runDetailUiEvidenceCurrent =
    hasRunDetailUiCompleteness(runDetailUiCompleteness) &&
    evidenceTargetsRun(runDetailUiCompleteness, dispatchRunId, []);
  const permissionDeniedEvidenceCurrent =
    evidenceTargetsRun(permissionDeniedFlow, dispatchRunId, []) &&
    evidenceTargetsRun(restrictedBrowserEvidence, dispatchRunId, []) &&
    evidenceTargetsRun(adminBrowserEvidence, dispatchRunId, []);
  const expectedResumeRunId = getRunIdFromUrl(resumeRunDetailUrl);
  const expectedInterruptRunId = getRunIdFromUrl(interruptRunUrl);
  const expectedTerminateRunId = getRunIdFromUrl(terminateRunUrl);
  const resumeEvidenceCurrent =
    evidenceTargetsRun(resumeFlow, expectedResumeRunId, ['sourceRunId', 'originalRunId']) &&
    Boolean(getString(getRecordEvidence(resumeFlow, 'result')?.continuationRunId));
  const interruptEvidenceCurrent = evidenceTargetsRun(interruptFlow, expectedInterruptRunId, ['runId']);
  const terminateEvidenceCurrent = evidenceTargetsRun(terminateFlow, expectedTerminateRunId, ['runId']);
  const nodeManagementEvidenceCurrent =
    Boolean(expectedNodeManagementNodeId) &&
    getString(getRecordEvidence(nodeManagementSmoke, 'result')?.nodeId) === expectedNodeManagementNodeId;

  const nodeManagementSmokePassed =
    isBrowserProducedEvidence(nodeManagementSmoke, 'node-management-smoke') &&
    nodeManagementEvidenceCurrent &&
    getBooleanEvidence(nodeManagementSmoke, 'result.invitationCreated') &&
    getBooleanEvidence(nodeManagementSmoke, 'result.invitationCreatedInBrowser') &&
    getBooleanEvidence(nodeManagementSmoke, 'result.heartbeatSeen') &&
    getBooleanEvidence(nodeManagementSmoke, 'result.disabledClaimRejected') &&
    getBooleanEvidence(nodeManagementSmoke, 'result.reEnabled') &&
    getString(getRecordEvidence(nodeManagementSmoke, 'result')?.profileHealth) === 'available';
  const resumeFlowVerified =
    isBrowserProducedEvidence(resumeFlow, 'resume') &&
    resumeEvidenceCurrent &&
    getBooleanEvidence(resumeFlow, 'result.lineageVerified') &&
    Boolean(getString(getRecordEvidence(resumeFlow, 'result')?.continuationRunId));
  const interruptFlowVerified =
    isBrowserProducedEvidence(interruptFlow, 'interrupt') &&
    interruptEvidenceCurrent &&
    evidenceHasSucceededControl(interruptFlow) &&
    evidenceHasTerminalRunStatus(interruptFlow);
  const terminateFlowVerified =
    isBrowserProducedEvidence(terminateFlow, 'terminate') &&
    terminateEvidenceCurrent &&
    evidenceHasSucceededControl(terminateFlow) &&
    evidenceHasTerminalRunStatus(terminateFlow) &&
    getString(getRecordEvidence(terminateFlow, 'result')?.runStatus) === 'canceled' &&
    getString(getRecordEvidence(terminateFlow, 'result')?.cancelAckStatus) === 'canceled';
  const runDetailUiComplete = runDetailUiEvidenceCurrent;
  const networkRedactionPassed =
    isBrowserProducedEvidence(networkRedaction, 'network-redaction') &&
    getBooleanEvidence(networkRedaction, 'result.noBearerTokenFound') &&
    getBooleanEvidence(networkRedaction, 'result.noAgentGatewayTokenFound') &&
    getBooleanEvidence(networkRedaction, 'result.noRestrictedPasswordFound') &&
    getBooleanEvidence(networkRedaction, 'result.redactedEvidenceOnly');
  const permissionDeniedResult = getRecordEvidence(permissionDeniedFlow, 'result');
  const permissionDeniedFlowVerified =
    isBrowserProducedEvidence(permissionDeniedFlow, 'permission-denied') &&
    permissionDeniedEvidenceCurrent &&
    permissionDeniedResult?.adminSessionReused === false &&
    permissionDeniedResult.terminalDenied === true &&
    permissionDeniedResult.rawLogDenied === true &&
    permissionDeniedResult.sessionMessageDenied === true;
  const providerDegradationVerified = hasProviderBrowserEvidence(providerBrowserEvidence);
  const auditBrowserVerified = hasAuditBrowserEvidence(auditBrowserEvidence);
  const businessDispatchRunClaimedByDaemon =
    businessDispatchEvidenceCurrent && getBooleanEvidence(businessDispatchResult, 'result.daemonClaimedRun');
  const businessDispatchLiveOutputObserved =
    liveOutputEvidenceCurrent && getBooleanEvidence(liveOutputEvidence, 'result.liveOutputObserved');
  const adminBrowserContextVerified =
    hasAdminBrowserContext(adminBrowserEvidence, args.adminEmail, restrictedUser.userId) &&
    evidenceTargetsRun(adminBrowserEvidence, dispatchRunId, []);
  const restrictedBrowserContextVerified =
    hasRestrictedBrowserContext(restrictedBrowserEvidence, restrictedUser) &&
    evidenceTargetsRun(restrictedBrowserEvidence, dispatchRunId, []);
  const allRequiredEvidencePassed =
    businessDispatchEvidenceCurrent &&
    businessDispatchRunClaimedByDaemon &&
    businessDispatchLiveOutputObserved &&
    liveOutputEvidenceCurrent &&
    nodeManagementSmokePassed &&
    resumeFlowVerified &&
    interruptFlowVerified &&
    terminateFlowVerified &&
    runDetailUiComplete &&
    networkRedactionPassed &&
    permissionDeniedFlowVerified &&
    providerDegradationVerified &&
    auditBrowserVerified &&
    wsEvidence.crossOriginWsRejected &&
    adminBrowserContextVerified &&
    restrictedBrowserContextVerified &&
    privateFileModeEvidence.allExpectedFilesPassed &&
    codexResumeCompatibilityVerified;
  const browserValidationRequired = !allRequiredEvidencePassed;
  const summary = {
    ...output,
    generatedAt: new Date().toISOString(),
    status: browserValidationRequired ? 'pending-browser-validation' : 'complete',
    browserValidationRequired,
    businessDispatchRunClaimedByDaemon,
    businessDispatchLiveOutputObserved,
    realCodexResumeVerified,
    codexResumeCompatibilityVerified,
    crossOriginWsRejected: wsEvidence.crossOriginWsRejected,
    adminBrowserContextVerified,
    restrictedBrowserContextVerified,
    nodeManagementHelperPassed:
      isRecord(nodeSmoke.result) &&
      nodeSmoke.result.invitationCreated === true &&
      nodeSmoke.result.heartbeatSeen === true &&
      nodeSmoke.result.profileHealth === 'available' &&
      nodeSmoke.result.disabledClaimRejected === true &&
      nodeSmoke.result.reEnabled === true,
    nodeManagementSmokePassed,
    resumeFlowVerified,
    interruptFlowVerified,
    terminateFlowVerified,
    runDetailUiComplete,
    networkRedactionPassed,
    permissionDeniedFlowVerified,
    providerDegradationVerified,
    auditBrowserVerified,
    privateFileModesPassed: privateFileModeEvidence.allExpectedFilesPassed,
    privateFileModesMissing: privateFileModeEvidence.missing,
  };

  await writeJson(seedOutputPath, output);
  await writeJson(summaryPath, summary);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});

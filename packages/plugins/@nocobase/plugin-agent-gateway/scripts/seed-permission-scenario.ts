/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import {
  JsonRecord,
  findOneByFilter,
  getListItems,
  getString,
  parseAdminArgs,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

const USER_PASSWORD = 'agentGateway123!';
const VISIBLE_RUN_CODE = 'agent-gateway-permission-visible';
const HIDDEN_RUN_CODE = 'agent-gateway-permission-hidden';
const CAPABILITY_DENIED_RUN_CODE = 'agent-gateway-permission-capability-denied';
const DISPATCH_COLLECTION_NAME = 'agwPermissionDispatchRequests';
const DISPATCH_RECORD_KEY = 'agent-gateway-permission-dispatch-record';
const DISPATCH_PROMPT_TEMPLATE_KEY = 'agent-gateway-permission-dispatch-template';
const DISPATCH_BINDING_KEY = 'agent-gateway-permission-dispatch';
const DISPATCH_RELATION_FIELD = 'agentRun';
const DISPATCH_RELATION_FOREIGN_KEY = 'agentRunId';

interface PermissionScenarioUser {
  roleName: string;
  email: string;
  username: string;
  title: string;
  grantedSnippets: string[];
  omittedSnippets: string[];
}

interface SeededRun {
  runId: string;
  runCode: string;
  sessionId: string;
  status: string;
}

interface DispatchFixture {
  bindingId: string;
  bindingKey: string;
  collectionName: string;
  recordId: string;
  relationFieldName: string;
  promptTemplateId: string;
  promptTemplateKey: string;
  recordCountBefore: number;
  recordCountAfter: number;
}

interface ExpectedAccessEntry {
  userEmail: string;
  action: string;
  target: string;
  expectedHttpStatus: number;
  expectedApplicationErrorCode: string | null;
  controlRequestCountMustRemainZero?: boolean;
  dispatchRunCreationMustRemainZero?: boolean;
  sideEffectExpectation: string;
}

const ALL_SENSITIVE_SNIPPETS = [
  'agentGateway.dispatchRun',
  'agentGateway.readRunDetails',
  'agentGateway.readSessionMessages',
  'agentGateway.readTerminal',
  'agentGateway.readArtifacts',
  'agentGateway.readRawLogs',
  'agentGateway.resumeAgentSession',
  'agentGateway.messageAgentSession',
  'agentGateway.cancelRun',
  'agentGateway.interruptRun',
  'agentGateway.terminateRun',
  'agentGateway.writeTerminalRaw',
];

const SCENARIOS: PermissionScenarioUser[] = [
  {
    roleName: 'agentGatewayLimited',
    email: 'agent-gateway-limited@example.com',
    username: 'agent-gateway-limited',
    title: 'Agent Gateway Limited',
    grantedSnippets: ['agentGateway.readRuns'],
    omittedSnippets: ALL_SENSITIVE_SNIPPETS,
  },
  {
    roleName: 'agentGatewayDetailOnly',
    email: 'agent-gateway-detail-only@example.com',
    username: 'agent-gateway-detail-only',
    title: 'Agent Gateway Detail Only',
    grantedSnippets: ['agentGateway.readRuns', 'agentGateway.readRunDetails'],
    omittedSnippets: ALL_SENSITIVE_SNIPPETS.filter((snippet) => snippet !== 'agentGateway.readRunDetails'),
  },
];

function buildExpectedAccess(options: {
  visible: SeededRun;
  hidden: SeededRun;
  capabilityDenied: SeededRun;
  dispatchFixture: DispatchFixture;
}): ExpectedAccessEntry[] {
  const { visible, hidden, dispatchFixture } = options;
  const deniedActions = [
    {
      action: 'dispatch',
      target: dispatchFixture.bindingKey,
      dispatchRunCreationMustRemainZero: true,
    },
    { action: 'terminal', target: visible.runCode },
    { action: 'artifacts', target: visible.runCode },
    { action: 'raw-logs', target: visible.runCode },
    { action: 'session-messages', target: visible.runCode },
    { action: 'resume', target: visible.sessionId },
    { action: 'message', target: visible.sessionId },
    {
      action: 'cancel',
      target: visible.runCode,
    },
    {
      action: 'interrupt',
      target: visible.runCode,
      controlRequestCountMustRemainZero: true,
    },
    {
      action: 'terminate',
      target: visible.runCode,
      controlRequestCountMustRemainZero: true,
    },
  ];
  const users = ['agent-gateway-limited@example.com', 'agent-gateway-detail-only@example.com'];
  const entries: ExpectedAccessEntry[] = [];
  for (const userEmail of users) {
    const hasRunDetails = userEmail === 'agent-gateway-detail-only@example.com';
    entries.push({
      userEmail,
      action: 'run-details',
      target: visible.runCode,
      expectedHttpStatus: hasRunDetails ? 200 : 403,
      expectedApplicationErrorCode: hasRunDetails ? null : 'AGENT_GATEWAY_PERMISSION_DENIED',
      sideEffectExpectation: hasRunDetails ? 'visible run summary is returned' : 'no sensitive run detail is returned',
    });
    entries.push({
      userEmail,
      action: 'hidden-run',
      target: hidden.runCode,
      expectedHttpStatus: hasRunDetails ? 404 : 403,
      expectedApplicationErrorCode: hasRunDetails
        ? 'AGENT_GATEWAY_RESOURCE_NOT_VISIBLE'
        : 'AGENT_GATEWAY_PERMISSION_DENIED',
      sideEffectExpectation: 'hidden run details are not returned',
    });
    entries.push({
      userEmail,
      action: 'raw-write',
      target: visible.runCode,
      expectedHttpStatus: 403,
      expectedApplicationErrorCode: 'TERMINAL_RAW_WRITE_DISABLED',
      sideEffectExpectation: 'terminal stdin is not written',
    });
    entries.push({
      userEmail,
      action: 'raw-write-legacy',
      target: visible.runCode,
      expectedHttpStatus: 403,
      expectedApplicationErrorCode: 'TERMINAL_RAW_WRITE_DISABLED',
      sideEffectExpectation: 'legacy terminal stdin endpoint is disabled',
    });
    entries.push({
      userEmail,
      action: 'raw-write-ws-aliases',
      target: visible.runCode,
      expectedHttpStatus: 403,
      expectedApplicationErrorCode: 'AGENT_GATEWAY_PERMISSION_DENIED',
      sideEffectExpectation: 'browser stream raw-write aliases are not reachable without terminal read permission',
    });
    for (const action of deniedActions) {
      entries.push({
        userEmail,
        action: action.action,
        target: action.target,
        expectedHttpStatus: 403,
        expectedApplicationErrorCode: 'AGENT_GATEWAY_PERMISSION_DENIED',
        controlRequestCountMustRemainZero: action.controlRequestCountMustRemainZero,
        dispatchRunCreationMustRemainZero: action.dispatchRunCreationMustRemainZero,
        sideEffectExpectation: action.dispatchRunCreationMustRemainZero
          ? 'no agRuns dispatch record is created and business relation remains unset'
          : action.controlRequestCountMustRemainZero
            ? 'no control request is created'
            : 'no sensitive data is returned and no action is executed',
      });
    }
  }
  return entries;
}

function nowIso() {
  return new Date().toISOString();
}

function getResponseId(record: JsonRecord | null | undefined) {
  const id = getString(record?.id);
  if (!id) {
    throw new Error(`Expected seeded record id, got ${JSON.stringify(record)}`);
  }
  return id;
}

async function upsertRole(baseUrl: string, token: string, scenario: PermissionScenarioUser) {
  const values = {
    name: scenario.roleName,
    title: scenario.title,
    snippets: [...scenario.grantedSnippets],
    strategy: {
      actions: [],
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'roles', { name: scenario.roleName });
  if (existing) {
    await requestJson<JsonRecord>(baseUrl, `/api/roles:update/${encodeURIComponent(scenario.roleName)}`, {
      method: 'POST',
      token,
      body: values,
    });
  } else {
    await requestJson<JsonRecord>(baseUrl, '/api/roles:create', {
      method: 'POST',
      token,
      body: values,
    });
  }
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

async function upsertUser(baseUrl: string, token: string, scenario: PermissionScenarioUser) {
  const baseValues = {
    email: scenario.email,
    username: scenario.username,
    nickname: scenario.title,
    roles: [scenario.roleName],
  };
  const existing = await findOneByFilter(baseUrl, token, 'users', { email: scenario.email });
  if (existing) {
    const userId = getResponseId(existing);
    await requestJson<JsonRecord>(baseUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
      method: 'POST',
      token,
      body: {
        ...baseValues,
        password: USER_PASSWORD,
      },
    });
    await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
      method: 'POST',
      token,
      body: {
        values: [scenario.roleName],
      },
    });
    await ensureDefaultRoleBinding(baseUrl, token, userId, scenario.roleName);
    return userId;
  }

  await requestJson<JsonRecord>(baseUrl, '/api/users:create', {
    method: 'POST',
    token,
    body: {
      ...baseValues,
      password: USER_PASSWORD,
    },
  });
  const created = await findOneByFilter(baseUrl, token, 'users', { email: scenario.email });
  const userId = getResponseId(created);
  await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
    method: 'POST',
    token,
    body: {
      values: [scenario.roleName],
    },
  });
  await ensureDefaultRoleBinding(baseUrl, token, userId, scenario.roleName);
  return userId;
}

async function verifyUserLogin(baseUrl: string, scenario: PermissionScenarioUser) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const data = await requestJson<JsonRecord>(baseUrl, '/api/auth:signIn', {
      method: 'POST',
      body: {
        account: scenario.email,
        password: USER_PASSWORD,
      },
    });
    const token = getString(data.token);
    if (!token) {
      throw new Error(`Seeded user sign-in did not return a token: ${scenario.email}`);
    }
    try {
      await requestJson<JsonRecord>(baseUrl, '/api/auth:check', {
        token,
      });
      return;
    } catch (error) {
      lastError = error;
      if (!(error instanceof Error) || !error.message.includes('User password changed')) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 1100);
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Seeded user sign-in check failed: ${scenario.email}`);
}

async function countCollection(baseUrl: string, token: string, collection: string) {
  const search = new URLSearchParams();
  search.set('pageSize', '200');
  const data = await requestJson<unknown>(baseUrl, `/api/${collection}:list?${search.toString()}`, {
    token,
  });
  return getListItems(data).length;
}

async function ensureDispatchCollection(baseUrl: string, token: string) {
  const existing = await findOneByFilter(baseUrl, token, 'collections', {
    name: DISPATCH_COLLECTION_NAME,
  });
  if (existing) {
    return;
  }

  await requestJson<JsonRecord>(baseUrl, '/api/collections:create', {
    method: 'POST',
    token,
    body: {
      name: DISPATCH_COLLECTION_NAME,
      title: 'Agent Gateway Permission Dispatch Requests',
      createdAt: true,
      updatedAt: true,
      fields: [
        {
          name: 'title',
          type: 'string',
          interface: 'input',
        },
        {
          name: 'requestKey',
          type: 'string',
          interface: 'input',
          unique: true,
        },
        {
          name: 'prompt',
          type: 'text',
          interface: 'textarea',
        },
        {
          name: 'status',
          type: 'string',
          interface: 'input',
        },
        {
          name: DISPATCH_RELATION_FIELD,
          type: 'belongsTo',
          target: 'agRuns',
          foreignKey: DISPATCH_RELATION_FOREIGN_KEY,
        },
      ],
    },
  });
}

async function upsertPromptTemplate(baseUrl: string, token: string) {
  const values = {
    templateKey: DISPATCH_PROMPT_TEMPLATE_KEY,
    displayName: 'Permission dispatch template',
    status: 'active',
    templateText: 'Run permission validation task for {{record.title}}: {{record.prompt}}',
    defaultExecutionPayloadJson: {
      commandKey: 'codex',
      profileKey: 'codex',
      cwd: '.',
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'agPromptTemplates', {
    templateKey: DISPATCH_PROMPT_TEMPLATE_KEY,
  });
  if (existing) {
    const templateId = getResponseId(existing);
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/agentGatewayApi:updatePromptTemplate/${encodeURIComponent(templateId)}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return templateId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, '/api/agentGatewayApi:createPromptTemplate', {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

async function upsertDispatchBinding(baseUrl: string, token: string, promptTemplateId: string) {
  const values = {
    bindingKey: DISPATCH_BINDING_KEY,
    collectionName: DISPATCH_COLLECTION_NAME,
    sourceCollection: DISPATCH_COLLECTION_NAME,
    triggerType: 'record-action',
    sourceAction: 'dispatch',
    promptTemplateId,
    outputAgentRunField: DISPATCH_RELATION_FIELD,
    enabled: true,
    status: 'active',
    fieldMappingsJson: {
      title: 'title',
      prompt: 'prompt',
      status: 'status',
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'agDispatchBindings', {
    bindingKey: DISPATCH_BINDING_KEY,
  });
  if (existing) {
    const bindingId = getResponseId(existing);
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/agentGatewayApi:updateDispatchBinding/${encodeURIComponent(bindingId)}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return bindingId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, '/api/agentGatewayApi:createDispatchBinding', {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

async function upsertDispatchRecord(baseUrl: string, token: string) {
  const values = {
    title: 'Permission denied dispatch validation',
    requestKey: DISPATCH_RECORD_KEY,
    prompt: 'This record is used only to verify denied Agent Gateway dispatch attempts.',
    status: 'ready',
    [DISPATCH_RELATION_FOREIGN_KEY]: null,
  };
  const existing = await findOneByFilter(baseUrl, token, DISPATCH_COLLECTION_NAME, {
    requestKey: DISPATCH_RECORD_KEY,
  });
  if (existing) {
    const recordId = getResponseId(existing);
    await requestJson<JsonRecord>(baseUrl, `/api/${DISPATCH_COLLECTION_NAME}:update/${encodeURIComponent(recordId)}`, {
      method: 'POST',
      token,
      body: values,
    });
    return recordId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, `/api/${DISPATCH_COLLECTION_NAME}:create`, {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

async function seedDispatchFixture(baseUrl: string, token: string): Promise<DispatchFixture> {
  await ensureDispatchCollection(baseUrl, token);
  const recordCountBefore = await countCollection(baseUrl, token, DISPATCH_COLLECTION_NAME);
  const promptTemplateId = await upsertPromptTemplate(baseUrl, token);
  const bindingId = await upsertDispatchBinding(baseUrl, token, promptTemplateId);
  const recordId = await upsertDispatchRecord(baseUrl, token);
  const recordCountAfter = await countCollection(baseUrl, token, DISPATCH_COLLECTION_NAME);
  return {
    bindingId,
    bindingKey: DISPATCH_BINDING_KEY,
    collectionName: DISPATCH_COLLECTION_NAME,
    recordId,
    relationFieldName: DISPATCH_RELATION_FIELD,
    promptTemplateId,
    promptTemplateKey: DISPATCH_PROMPT_TEMPLATE_KEY,
    recordCountBefore,
    recordCountAfter,
  };
}

async function upsertScope(baseUrl: string, token: string, name: string, scope: JsonRecord) {
  const values = {
    resourceName: 'agRuns',
    name,
    scope,
  };
  const existing = await findOneByFilter(baseUrl, token, 'dataSourcesRolesResourcesScopes', {
    resourceName: 'agRuns',
    name,
  });
  if (existing) {
    const scopeId = getResponseId(existing);
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/dataSourcesRolesResourcesScopes:update/${encodeURIComponent(scopeId)}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return scopeId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, '/api/dataSourcesRolesResourcesScopes:create', {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

async function listRoleResources(baseUrl: string, token: string, roleName: string) {
  const data = await requestJson<unknown>(baseUrl, `/api/roles/${encodeURIComponent(roleName)}/resources:list`, {
    token,
  });
  return getListItems(data);
}

async function grantVisibleRunScope(baseUrl: string, token: string, roleName: string, visibleRunCode: string) {
  const scopeId = await upsertScope(baseUrl, token, `${roleName}-visible-agent-gateway-runs`, {
    runCode: visibleRunCode,
  });
  const scopeReference = Number.isFinite(Number(scopeId)) ? Number(scopeId) : scopeId;
  const values = {
    name: 'agRuns',
    usingActionsConfig: true,
    actions: [
      {
        name: 'view',
        scope: scopeReference,
      },
    ],
  };
  const existing = (await listRoleResources(baseUrl, token, roleName)).find(
    (resource) => getString(resource.name) === 'agRuns',
  );
  if (existing) {
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/roles/${encodeURIComponent(roleName)}/resources:update/${encodeURIComponent(getResponseId(existing))}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return scopeId;
  }
  await requestJson<JsonRecord>(baseUrl, `/api/roles/${encodeURIComponent(roleName)}/resources:create`, {
    method: 'POST',
    token,
    body: values,
  });
  return scopeId;
}

async function upsertRun(
  baseUrl: string,
  token: string,
  options: {
    runCode: string;
    status: string;
    terminalActive?: boolean;
  },
) {
  const now = nowIso();
  const values = {
    runCode: options.runCode,
    status: options.status,
    claimAttempt: 1,
    leaseVersion: 1,
    cancelRequested: false,
    sourceType: 'permission-browser-validation',
    promptSnapshot: {
      text: `Seeded permission scenario run ${options.runCode}`,
    },
    executionPayloadJson: {
      commandKey: 'codex',
      profileKey: 'codex',
      cwd: '.',
    },
    resultSummaryJson: {
      seeded: true,
      scenario: 'agent-gateway-permission',
    },
    requestedAt: now,
    queuedAt: now,
    startedAt: now,
    finishedAt: options.status === 'running' ? null : now,
    terminalBackend: 'tmux',
    terminalSessionName: `ag-run-${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    terminalStatus: options.terminalActive ? 'active' : 'closed',
  };
  const existing = await findOneByFilter(baseUrl, token, 'agRuns', { runCode: options.runCode });
  if (existing) {
    const runId = getResponseId(existing);
    const { runCode: _runCode, ...updateValues } = values;
    await requestJson<JsonRecord>(baseUrl, `/api/agRuns:update/${encodeURIComponent(runId)}`, {
      method: 'POST',
      token,
      body: updateValues,
    });
    return (await findOneByFilter(baseUrl, token, 'agRuns', { id: runId })) || existing;
  }
  await requestJson<JsonRecord>(baseUrl, '/api/agRuns:create', {
    method: 'POST',
    token,
    body: {
      id: randomUUID(),
      ...values,
    },
  });
  const created = await findOneByFilter(baseUrl, token, 'agRuns', { runCode: options.runCode });
  if (!created) {
    throw new Error(`Seeded run could not be read back: ${options.runCode}`);
  }
  return created;
}

async function upsertSession(
  baseUrl: string,
  token: string,
  run: JsonRecord,
  options: {
    providerSessionId: string;
    status: string;
    capabilitiesJson: JsonRecord;
  },
) {
  const runId = getResponseId(run);
  const values = {
    provider: 'codex',
    providerSessionId: options.providerSessionId,
    rootRunId: runId,
    latestRunId: runId,
    status: options.status,
    capabilitiesJson: options.capabilitiesJson,
    metadataJson: {
      seeded: true,
      scenario: 'agent-gateway-permission',
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'agAgentSessions', {
    provider: 'codex',
    providerSessionId: options.providerSessionId,
  });
  let session: JsonRecord | null;
  if (existing) {
    const sessionId = getResponseId(existing);
    await requestJson<JsonRecord>(baseUrl, `/api/agAgentSessions:update/${encodeURIComponent(sessionId)}`, {
      method: 'POST',
      token,
      body: values,
    });
    session = await findOneByFilter(baseUrl, token, 'agAgentSessions', { id: sessionId });
  } else {
    await requestJson<JsonRecord>(baseUrl, '/api/agAgentSessions:create', {
      method: 'POST',
      token,
      body: {
        id: randomUUID(),
        ...values,
      },
    });
    session = await findOneByFilter(baseUrl, token, 'agAgentSessions', {
      provider: 'codex',
      providerSessionId: options.providerSessionId,
    });
  }
  const sessionId = getResponseId(session);
  await requestJson<JsonRecord>(baseUrl, `/api/agRuns:update/${encodeURIComponent(runId)}`, {
    method: 'POST',
    token,
    body: {
      agentSessionId: sessionId,
      agentSessionProvider: 'codex',
      agentSessionProviderId: options.providerSessionId,
    },
  });
  return (
    session || {
      id: sessionId,
    }
  );
}

async function seedRunWithSession(
  baseUrl: string,
  token: string,
  options: {
    runCode: string;
    status: string;
    sessionStatus: string;
    terminalActive?: boolean;
    capabilitiesJson: JsonRecord;
  },
): Promise<SeededRun> {
  const run = await upsertRun(baseUrl, token, options);
  const session = await upsertSession(baseUrl, token, run, {
    providerSessionId: `${options.runCode}-thread`,
    status: options.sessionStatus,
    capabilitiesJson: options.capabilitiesJson,
  });
  return {
    runId: getResponseId(run),
    runCode: options.runCode,
    sessionId: getResponseId(session),
    status: options.status,
  };
}

async function main() {
  const args = parseAdminArgs(process.argv);
  const { flags } = parseAdminFlags(process.argv);
  const evidenceDir = getString(flags['evidence-dir']);
  const token = await signIn(args);
  const dispatchFixture = await seedDispatchFixture(args.baseUrl, token);
  const visible = await seedRunWithSession(args.baseUrl, token, {
    runCode: VISIBLE_RUN_CODE,
    status: 'succeeded',
    sessionStatus: 'ended',
    capabilitiesJson: {
      resumeWithMessage: true,
      liveSemanticMessage: false,
      stdinMessage: false,
      interrupt: true,
      terminate: true,
    },
  });
  const hidden = await seedRunWithSession(args.baseUrl, token, {
    runCode: HIDDEN_RUN_CODE,
    status: 'succeeded',
    sessionStatus: 'ended',
    capabilitiesJson: {
      resumeWithMessage: true,
      liveSemanticMessage: false,
      stdinMessage: false,
      interrupt: true,
      terminate: true,
    },
  });
  const capabilityDenied = await seedRunWithSession(args.baseUrl, token, {
    runCode: CAPABILITY_DENIED_RUN_CODE,
    status: 'running',
    sessionStatus: 'active',
    terminalActive: true,
    capabilitiesJson: {
      resumeWithMessage: false,
      liveSemanticMessage: false,
      stdinMessage: false,
      interrupt: false,
      terminate: false,
    },
  });

  const users = [];
  for (const scenario of SCENARIOS) {
    await upsertRole(args.baseUrl, token, scenario);
    const scopeId = await grantVisibleRunScope(args.baseUrl, token, scenario.roleName, visible.runCode);
    const userId = await upsertUser(args.baseUrl, token, scenario);
    await verifyUserLogin(args.baseUrl, scenario);
    users.push({
      roleName: scenario.roleName,
      userId,
      email: scenario.email,
      grantedSnippets: scenario.grantedSnippets,
      omittedSnippets: scenario.omittedSnippets,
      defaultRole: scenario.roleName,
      visibleRunScopeId: scopeId,
      expectedPermissions:
        scenario.roleName === 'agentGatewayLimited'
          ? 'Can list visible Agent Gateway runs only; cannot open details or sensitive data.'
          : 'Can list and open visible run details only; cannot read session messages, terminal, artifacts, raw logs, or controls.',
    });
  }
  const output = {
    users,
    visibleRun: visible,
    hiddenRun: hidden,
    activeCapabilityDeniedRun: capabilityDenied,
    visibleRunId: visible.runId,
    visibleRunCode: visible.runCode,
    hiddenRunId: hidden.runId,
    hiddenRunCode: hidden.runCode,
    visibleSessionId: visible.sessionId,
    hiddenSessionId: hidden.sessionId,
    activeCapabilityDeniedRunId: capabilityDenied.runId,
    activeCapabilityDeniedRunCode: capabilityDenied.runCode,
    dispatchBinding: {
      id: dispatchFixture.bindingId,
      key: dispatchFixture.bindingKey,
    },
    dispatchBindingId: dispatchFixture.bindingId,
    dispatchBindingKey: dispatchFixture.bindingKey,
    dispatchBusinessCollectionName: dispatchFixture.collectionName,
    dispatchBusinessRecordId: dispatchFixture.recordId,
    dispatchRelationFieldName: dispatchFixture.relationFieldName,
    dispatchPromptTemplateId: dispatchFixture.promptTemplateId,
    dispatchPromptTemplateKey: dispatchFixture.promptTemplateKey,
    dispatchRecordCountBefore: dispatchFixture.recordCountBefore,
    dispatchRecordCountAfter: dispatchFixture.recordCountAfter,
    expectedAccess: buildExpectedAccess({
      visible,
      hidden,
      capabilityDenied,
      dispatchFixture,
    }),
  };
  const serializedOutput = `${JSON.stringify(output, null, 2)}\n`;
  if (evidenceDir) {
    await mkdir(evidenceDir, { recursive: true });
    await writeFile(join(evidenceDir, 'seed.json'), serializedOutput);
  }
  process.stdout.write(serializedOutput);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import {
  JsonRecord,
  findOneByFilter,
  getListItems,
  getString,
  isRecord,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

const TASK_ID = '02';
const USER_PASSWORD = 'agentGatewayTask02!';
const ROLE_PREFIX = 'agentGatewayTask02';
const USER_EMAIL_PREFIX = 'agent-gateway-task02';

interface ScriptArgs {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
  seedOutputPath: string;
  evidenceDir: string;
}

interface SeedOutput {
  collectionName: string;
  recordId: string;
  relationField: string;
  promptTemplateId: string;
  dispatchBindingId: string;
  dispatchBindingKey?: string;
  scenarioId?: string;
}

interface RawResult {
  status: number;
  body: unknown;
  text: string;
}

interface AttemptResult {
  name: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  responseSummary: string;
  relationValueAfter?: unknown;
  firstRunId?: string;
  secondRunId?: string;
  deduped?: boolean;
}

function parseArgs(argv: string[]): ScriptArgs {
  const { flags } = parseAdminFlags(argv);
  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  const seedOutputPath = getString(flags['seed-output']);
  const evidenceDir = getString(flags['evidence-dir']);
  if (!baseUrl || !adminEmail || !adminPassword || !seedOutputPath || !evidenceDir) {
    throw new Error('--base-url, --admin-email, --admin-password, --seed-output, and --evidence-dir are required');
  }
  return {
    baseUrl,
    adminEmail,
    adminPassword,
    seedOutputPath,
    evidenceDir,
  };
}

function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function getResponseId(record: JsonRecord | null | undefined) {
  const id = getString(record?.id);
  if (!id) {
    throw new Error(`Expected record id, got ${JSON.stringify(record)}`);
  }
  return id;
}

function getSeedString(seed: JsonRecord, key: keyof SeedOutput) {
  const value = getString(seed[key]);
  if (!value) {
    throw new Error(`Seed output is missing ${String(key)}`);
  }
  return value;
}

async function readSeedOutput(seedOutputPath: string): Promise<SeedOutput> {
  const seed = getRecord(JSON.parse(await readFile(seedOutputPath, 'utf8')) as unknown);
  return {
    collectionName: getSeedString(seed, 'collectionName'),
    recordId: getSeedString(seed, 'recordId'),
    relationField: getSeedString(seed, 'relationField'),
    promptTemplateId: getSeedString(seed, 'promptTemplateId'),
    dispatchBindingId: getSeedString(seed, 'dispatchBindingId'),
    dispatchBindingKey: getString(seed.dispatchBindingKey),
    scenarioId: getString(seed.scenarioId),
  };
}

async function requestRaw(
  baseUrl: string,
  path: string,
  options: { method?: 'GET' | 'POST'; token?: string; body?: JsonRecord } = {},
): Promise<RawResult> {
  const response = await fetch(new URL(path, baseUrl), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'X-Authenticator': 'basic',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let body: unknown = {};
  try {
    body = text ? (JSON.parse(text) as unknown) : {};
  } catch {
    body = {
      raw: text,
    };
  }
  return {
    status: response.status,
    body,
    text,
  };
}

async function signInUser(baseUrl: string, email: string) {
  const data = await requestJson<JsonRecord>(baseUrl, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: email,
      password: USER_PASSWORD,
    },
  });
  const token = getString(data.token);
  if (!token) {
    throw new Error(`Sign-in response did not include a token for ${email}`);
  }
  return token;
}

async function upsertRole(baseUrl: string, token: string, roleName: string) {
  const values = {
    name: roleName,
    title: roleName,
    snippets: ['agentGateway.dispatchRun'],
  };
  const existing = await findOneByFilter(baseUrl, token, 'roles', {
    name: roleName,
  });
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

async function upsertUser(baseUrl: string, token: string, roleName: string, userName: string) {
  const email = `${USER_EMAIL_PREFIX}-${userName}@example.com`;
  const values = {
    email,
    username: `${USER_EMAIL_PREFIX}-${userName}`,
    nickname: `Agent Gateway task 02 ${userName}`,
    roles: [roleName],
  };
  const existing = await findOneByFilter(baseUrl, token, 'users', {
    email,
  });
  if (existing) {
    const userId = getResponseId(existing);
    await requestJson<JsonRecord>(baseUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
      method: 'POST',
      token,
      body: {
        ...values,
        password: USER_PASSWORD,
      },
    });
    await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
      method: 'POST',
      token,
      body: {
        values: [roleName],
      },
    });
    await ensureDefaultRoleBinding(baseUrl, token, userId, roleName);
    await new Promise((resolve) => setTimeout(resolve, 1100 - (Date.now() % 1000)));
    return {
      email,
      userId,
    };
  }

  await requestJson<JsonRecord>(baseUrl, '/api/users:create', {
    method: 'POST',
    token,
    body: {
      ...values,
      password: USER_PASSWORD,
    },
  });
  const created = await findOneByFilter(baseUrl, token, 'users', {
    email,
  });
  const userId = getResponseId(created);
  await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
    method: 'POST',
    token,
    body: {
      values: [roleName],
    },
  });
  await ensureDefaultRoleBinding(baseUrl, token, userId, roleName);
  return {
    email,
    userId,
  };
}

async function upsertScope(
  baseUrl: string,
  token: string,
  collectionName: string,
  scopeName: string,
  scope: JsonRecord,
) {
  const values = {
    resourceName: collectionName,
    name: scopeName,
    scope,
  };
  const existing = await findOneByFilter(baseUrl, token, 'dataSourcesRolesResourcesScopes', {
    resourceName: collectionName,
    name: scopeName,
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

async function upsertRoleResource(
  baseUrl: string,
  token: string,
  roleName: string,
  collectionName: string,
  actions: JsonRecord[],
) {
  const values = {
    name: collectionName,
    usingActionsConfig: true,
    actions,
  };
  const existing = (await listRoleResources(baseUrl, token, roleName)).find(
    (resource) => getString(resource.name) === collectionName,
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
    return;
  }
  await requestJson<JsonRecord>(baseUrl, `/api/roles/${encodeURIComponent(roleName)}/resources:create`, {
    method: 'POST',
    token,
    body: values,
  });
}

async function upsertBusinessRecord(
  baseUrl: string,
  token: string,
  seed: SeedOutput,
  values: { requestKey: string; title: string; prompt: string; status?: string },
) {
  const foreignKey = `${seed.relationField}Id`;
  const recordValues = {
    title: values.title,
    requestKey: values.requestKey,
    prompt: values.prompt,
    status: values.status || 'ready',
    scenarioId: seed.scenarioId || `agw-task-${TASK_ID}`,
    [foreignKey]: null,
  };
  const existing = await findOneByFilter(baseUrl, token, seed.collectionName, {
    requestKey: values.requestKey,
  });
  if (existing) {
    const recordId = getResponseId(existing);
    await requestJson<JsonRecord>(baseUrl, `/api/${seed.collectionName}:update/${encodeURIComponent(recordId)}`, {
      method: 'POST',
      token,
      body: recordValues,
    });
    return recordId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, `/api/${seed.collectionName}:create`, {
    method: 'POST',
    token,
    body: recordValues,
  });
  return getResponseId(created);
}

async function readBusinessRecord(baseUrl: string, token: string, collectionName: string, recordId: string) {
  const search = new URLSearchParams();
  search.set('filter', JSON.stringify({ id: recordId }));
  search.set('pageSize', '1');
  const data = await requestJson<unknown>(baseUrl, `/api/${collectionName}:list?${search.toString()}`, {
    token,
  });
  return getListItems(data)[0] || {};
}

function getRelationValue(record: JsonRecord, relationField: string) {
  return record[`${relationField}Id`] || record[relationField] || null;
}

function getResponseSummary(result: RawResult) {
  if (result.status >= 200 && result.status < 300) {
    const runId = getDispatchRunId(result);
    if (runId) {
      return `runId=${runId}; deduped=${getDispatchDeduped(result)}`;
    }
  }

  const body = getRecord(result.body);
  const errors = Array.isArray(body.errors) ? body.errors.map(getRecord) : [];
  const message =
    getString(errors[0]?.message) ||
    getString(getRecord(body.error).message) ||
    getString(getRecord(body.data).message) ||
    getString(body.message);
  return message || result.text.slice(0, 300);
}

function getDispatchResponseData(result: RawResult) {
  const body = getRecord(result.body);
  return getRecord(body.data);
}

function getDispatchRunId(result: RawResult) {
  const data = getDispatchResponseData(result);
  return getString(data.runId) || getString(getRecord(data.run).id);
}

function getDispatchDeduped(result: RawResult) {
  const data = getDispatchResponseData(result);
  return data.deduped === true || data.idempotent === true;
}

async function recordAttempt(
  baseUrl: string,
  token: string,
  seed: SeedOutput,
  options: {
    name: string;
    expectedStatus: number;
    recordId?: string;
    execute: () => Promise<RawResult>;
  },
): Promise<AttemptResult> {
  const result = await options.execute();
  const record = options.recordId
    ? await readBusinessRecord(baseUrl, token, seed.collectionName, options.recordId)
    : undefined;
  const relationValueAfter = record ? getRelationValue(record, seed.relationField) : undefined;
  return {
    name: options.name,
    expectedStatus: options.expectedStatus,
    actualStatus: result.status,
    passed: result.status === options.expectedStatus && (!record || !relationValueAfter),
    responseSummary: getResponseSummary(result),
    ...(record ? { relationValueAfter } : {}),
  };
}

async function dispatch(
  baseUrl: string,
  token: string,
  bindingIdentifier: string,
  body: JsonRecord,
): Promise<RawResult> {
  return await requestRaw(baseUrl, `/api/agentGatewayApi:dispatchBinding/${encodeURIComponent(bindingIdentifier)}`, {
    method: 'POST',
    token,
    body,
  });
}

async function createRestrictedUser(
  baseUrl: string,
  adminToken: string,
  roleName: string,
  userName: string,
  collectionName: string,
  actions: JsonRecord[],
) {
  await upsertRole(baseUrl, adminToken, roleName);
  await upsertRoleResource(baseUrl, adminToken, roleName, collectionName, actions);
  const user = await upsertUser(baseUrl, adminToken, roleName, userName);
  return await signInUser(baseUrl, user.email);
}

async function main() {
  const args = parseArgs(process.argv);
  await mkdir(args.evidenceDir, { recursive: true });
  const seed = await readSeedOutput(args.seedOutputPath);
  const adminToken = await signIn({
    baseUrl: args.baseUrl,
    adminEmail: args.adminEmail,
    adminPassword: args.adminPassword,
  });
  const bindingIdentifier = seed.dispatchBindingKey || seed.dispatchBindingId;
  const timestamp = Date.now();

  const duplicateRecordId = await upsertBusinessRecord(args.baseUrl, adminToken, seed, {
    requestKey: `agw-task-02-duplicate-${timestamp}`,
    title: 'Agent Gateway duplicate dispatch evidence',
    prompt: 'Duplicate idempotency evidence',
  });
  const hiddenRecordId = await upsertBusinessRecord(args.baseUrl, adminToken, seed, {
    requestKey: `agw-task-02-hidden-${timestamp}`,
    title: 'Agent Gateway hidden dispatch evidence',
    prompt: 'Hidden source record evidence',
  });
  const nonWritableRecordId = await upsertBusinessRecord(args.baseUrl, adminToken, seed, {
    requestKey: `agw-task-02-readonly-${timestamp}`,
    title: 'Agent Gateway readonly dispatch evidence',
    prompt: 'Readonly relation evidence',
  });

  const hiddenScopeId = await upsertScope(
    args.baseUrl,
    adminToken,
    seed.collectionName,
    `${ROLE_PREFIX}-visible-source-${timestamp}`,
    {
      requestKey: `agw-task-02-not-hidden-${timestamp}`,
    },
  );
  const hiddenUserToken = await createRestrictedUser(
    args.baseUrl,
    adminToken,
    `${ROLE_PREFIX}HiddenSource`,
    'hidden-source',
    seed.collectionName,
    [
      {
        name: 'view',
        fields: ['title', 'requestKey', 'prompt', 'status', seed.relationField, `${seed.relationField}Id`],
        scope: Number.isFinite(Number(hiddenScopeId)) ? Number(hiddenScopeId) : hiddenScopeId,
      },
      {
        name: 'update',
        fields: [seed.relationField, `${seed.relationField}Id`],
      },
    ],
  );
  const readonlyUserToken = await createRestrictedUser(
    args.baseUrl,
    adminToken,
    `${ROLE_PREFIX}ReadonlyRelation`,
    'readonly-relation',
    seed.collectionName,
    [
      {
        name: 'view',
        fields: ['title', 'requestKey', 'prompt', 'status', seed.relationField, `${seed.relationField}Id`],
      },
      {
        name: 'update',
        fields: ['status'],
      },
    ],
  );

  const results: AttemptResult[] = [];
  results.push(
    await recordAttempt(args.baseUrl, adminToken, seed, {
      name: 'disallowed-source-collection',
      expectedStatus: 409,
      execute: () =>
        dispatch(args.baseUrl, adminToken, bindingIdentifier, {
          sourceCollection: `${seed.collectionName}Disallowed`,
          sourceRecordId: seed.recordId,
          idempotencyKey: `agw-task-02-disallowed-${timestamp}`,
        }),
    }),
  );
  results.push(
    await recordAttempt(args.baseUrl, adminToken, seed, {
      name: 'mismatched-output-field-config',
      expectedStatus: 400,
      execute: () =>
        requestRaw(args.baseUrl, '/api/agentGatewayApi:createDispatchBinding', {
          method: 'POST',
          token: adminToken,
          body: {
            bindingKey: `agw.task02.invalid.output.${timestamp}`,
            collectionName: seed.collectionName,
            sourceCollection: seed.collectionName,
            triggerType: 'record-action',
            promptTemplateId: seed.promptTemplateId,
            outputAgentRunField: 'title',
            enabled: true,
          },
        }),
    }),
  );
  results.push(
    await recordAttempt(args.baseUrl, adminToken, seed, {
      name: 'hidden-source-record',
      expectedStatus: 404,
      recordId: hiddenRecordId,
      execute: () =>
        dispatch(args.baseUrl, hiddenUserToken, bindingIdentifier, {
          sourceCollection: seed.collectionName,
          sourceRecordId: hiddenRecordId,
          idempotencyKey: `agw-task-02-hidden-${timestamp}`,
        }),
    }),
  );
  results.push(
    await recordAttempt(args.baseUrl, adminToken, seed, {
      name: 'non-updatable-output-relation',
      expectedStatus: 403,
      recordId: nonWritableRecordId,
      execute: () =>
        dispatch(args.baseUrl, readonlyUserToken, bindingIdentifier, {
          sourceCollection: seed.collectionName,
          sourceRecordId: nonWritableRecordId,
          idempotencyKey: `agw-task-02-readonly-${timestamp}`,
        }),
    }),
  );

  const duplicateKey = `agw-task-02-duplicate-${timestamp}`;
  const firstDuplicate = await dispatch(args.baseUrl, adminToken, bindingIdentifier, {
    sourceCollection: seed.collectionName,
    sourceRecordId: duplicateRecordId,
    idempotencyKey: duplicateKey,
  });
  const secondDuplicate = await dispatch(args.baseUrl, adminToken, bindingIdentifier, {
    sourceCollection: seed.collectionName,
    sourceRecordId: duplicateRecordId,
    idempotencyKey: duplicateKey,
  });
  const duplicateRecord = await readBusinessRecord(args.baseUrl, adminToken, seed.collectionName, duplicateRecordId);
  const firstRunId = getDispatchRunId(firstDuplicate);
  const secondRunId = getDispatchRunId(secondDuplicate);
  const relationValueAfter = getRelationValue(duplicateRecord, seed.relationField);
  const deduped = getDispatchDeduped(secondDuplicate);
  results.push({
    name: 'duplicate-idempotency',
    expectedStatus: 200,
    actualStatus: secondDuplicate.status,
    passed:
      firstDuplicate.status === 200 &&
      secondDuplicate.status === 200 &&
      Boolean(firstRunId) &&
      firstRunId === secondRunId &&
      relationValueAfter === firstRunId &&
      deduped,
    responseSummary: getResponseSummary(secondDuplicate),
    relationValueAfter,
    firstRunId,
    secondRunId,
    deduped,
  });

  const output = {
    task: TASK_ID,
    seedOutputPath: args.seedOutputPath,
    generatedAt: new Date().toISOString(),
    bindingIdentifier,
    collectionName: seed.collectionName,
    relationField: seed.relationField,
    records: {
      seededRecordId: seed.recordId,
      duplicateRecordId,
      hiddenRecordId,
      nonWritableRecordId,
    },
    results,
    passed: results.every((result) => result.passed),
  };
  const outputPath = join(args.evidenceDir, 'dispatch-authorization-denials.json');
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.passed) {
    throw new Error(`One or more dispatch denial checks failed. See ${outputPath}`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const RUN_CODE = 'agw_legacy_no_session_fixture';

interface SeedArgs {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseArgs(argv: string[]): SeedArgs {
  const flags: Record<string, string> = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--') || !value || value.startsWith('--')) {
      continue;
    }
    flags[key.slice(2)] = value;
    index += 1;
  }

  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  if (!baseUrl || !adminEmail || !adminPassword) {
    throw new Error('--base-url, --admin-email, and --admin-password are required');
  }

  return {
    baseUrl,
    adminEmail,
    adminPassword,
  };
}

function unwrapResponse(json: unknown): unknown {
  const record = isRecord(json) ? json : {};
  const data = record.data;
  if (isRecord(data) && Object.prototype.hasOwnProperty.call(data, 'data')) {
    return data.data;
  }
  return data === undefined ? record : data;
}

async function requestJson<T>(
  args: SeedArgs,
  path: string,
  options: { method?: 'GET' | 'POST'; token?: string; body?: JsonRecord } = {},
) {
  const response = await fetch(new URL(path, args.baseUrl), {
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
  const json = text ? (JSON.parse(text) as unknown) : {};
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${path}: ${text}`);
  }
  return unwrapResponse(json) as T;
}

async function signIn(args: SeedArgs) {
  const data = await requestJson<JsonRecord>(args, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: args.adminEmail,
      password: args.adminPassword,
    },
  });
  const token = getString(data.token);
  if (!token) {
    throw new Error('Sign-in response did not include a token');
  }
  return token;
}

function getListItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value.data)) {
    return value.data.filter(isRecord);
  }
  return [];
}

async function findRun(args: SeedArgs, token: string) {
  const search = new URLSearchParams();
  search.set('filter', JSON.stringify({ runCode: RUN_CODE }));
  const data = await requestJson<unknown>(args, `/api/agRuns:list?${search.toString()}`, {
    token,
  });
  return getListItems(data)[0] || null;
}

async function seedLegacyRun(args: SeedArgs, token: string) {
  const existingRun = await findRun(args, token);
  const values = {
    runCode: RUN_CODE,
    status: 'succeeded',
    claimAttempt: 0,
    leaseVersion: 0,
    cancelRequested: false,
    sourceType: 'browser-validation',
    promptSnapshot: {
      text: 'Legacy no-session fixture',
    },
    executionPayloadJson: {},
    resultSummaryJson: {
      seeded: true,
      legacy: true,
    },
    agentSessionId: null,
    agentSessionProvider: null,
    agentSessionProviderId: null,
    requestedAt: new Date().toISOString(),
    queuedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    terminalStatus: 'closed',
  };

  if (existingRun) {
    const runId = getString(existingRun.id);
    await requestJson<JsonRecord>(args, `/api/agRuns:update/${encodeURIComponent(runId)}`, {
      method: 'POST',
      token,
      body: values,
    });
    return {
      run: (await findRun(args, token)) || {
        id: runId,
        runCode: RUN_CODE,
        status: values.status,
      },
      created: false,
    };
  }

  await requestJson<JsonRecord>(args, '/api/agRuns:create', {
    method: 'POST',
    token,
    body: values,
  });
  return {
    run: (await findRun(args, token)) || {
      runCode: RUN_CODE,
      status: values.status,
    },
    created: true,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const token = await signIn(args);
  const result = await seedLegacyRun(args, token);
  const run = result.run;
  const output = {
    runId: getString(run.id),
    runCode: RUN_CODE,
    runStatus: getString(run.status),
    action: result.created ? 'created' : 'updated',
    hasAgentSessionId: Boolean(run.agentSessionId),
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

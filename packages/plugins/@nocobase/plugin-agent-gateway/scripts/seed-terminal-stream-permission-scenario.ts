/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JsonRecord,
  findOneByFilter,
  getString,
  parseAdminArgs,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

const ROLE_NAME = 'agentGatewayTerminalDenied';
const USER_EMAIL = 'agent-gateway-terminal-denied@example.com';
const USER_PASSWORD = 'agentGateway123!';

async function upsertRole(baseUrl: string, token: string) {
  const values = {
    name: ROLE_NAME,
    title: 'Agent Gateway Terminal Denied',
    snippets: ['agentGateway.readRuns', 'agentGateway.readRunDetails'],
    strategy: {
      actions: [],
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'roles', { name: ROLE_NAME });
  if (existing) {
    await requestJson<JsonRecord>(baseUrl, `/api/roles:update/${encodeURIComponent(ROLE_NAME)}`, {
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

async function upsertUser(baseUrl: string, token: string) {
  const username = 'agent-gateway-terminal-denied';
  const baseValues = {
    email: USER_EMAIL,
    username,
    nickname: 'Agent Gateway Terminal Denied',
    roles: [ROLE_NAME],
  };
  const existing = await findOneByFilter(baseUrl, token, 'users', { email: USER_EMAIL });
  if (existing) {
    const userId = getString(existing.id);
    await requestJson<JsonRecord>(baseUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
      method: 'POST',
      token,
      body: baseValues,
    });
    await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
      method: 'POST',
      token,
      body: {
        values: [ROLE_NAME],
      },
    });
    await ensureDefaultRoleBinding(baseUrl, token, userId);
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
  const created = await findOneByFilter(baseUrl, token, 'users', { email: USER_EMAIL });
  const userId = getString(created?.id);
  if (!userId) {
    throw new Error('Restricted user could not be read back after creation');
  }
  await requestJson<JsonRecord>(baseUrl, `/api/users/${encodeURIComponent(userId)}/roles:set`, {
    method: 'POST',
    token,
    body: {
      values: [ROLE_NAME],
    },
  });
  await ensureDefaultRoleBinding(baseUrl, token, userId);
  return userId;
}

async function resetRestrictedUserPassword(baseUrl: string, token: string, userId: string) {
  await requestJson<JsonRecord>(baseUrl, `/api/users:update/${encodeURIComponent(userId)}`, {
    method: 'POST',
    token,
    body: {
      password: USER_PASSWORD,
    },
  });
}

async function ensureDefaultRoleBinding(baseUrl: string, token: string, userId: string) {
  const filter = {
    userId,
    roleName: ROLE_NAME,
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

async function verifyRestrictedUserLogin(baseUrl: string) {
  const data = await requestJson<JsonRecord>(baseUrl, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: USER_EMAIL,
      password: USER_PASSWORD,
    },
  });
  const token = getString(data.token);
  if (!token) {
    throw new Error('Restricted user sign-in did not return a token');
  }
  await requestJson<JsonRecord>(baseUrl, '/api/auth:check', {
    token,
  });
}

async function canRestrictedUserLogin(baseUrl: string) {
  try {
    await verifyRestrictedUserLogin(baseUrl);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseAdminArgs(process.argv);
  const token = await signIn(args);
  await upsertRole(args.baseUrl, token);
  const userId = await upsertUser(args.baseUrl, token);
  if (!(await canRestrictedUserLogin(args.baseUrl))) {
    await resetRestrictedUserPassword(args.baseUrl, token, userId);
  }
  await verifyRestrictedUserLogin(args.baseUrl);
  const output = {
    roleName: ROLE_NAME,
    userId,
    email: USER_EMAIL,
    password: USER_PASSWORD,
    grantedSnippets: ['agentGateway.readRuns', 'agentGateway.readRunDetails'],
    omittedSnippets: ['agentGateway.readTerminal'],
    defaultRole: ROLE_NAME,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

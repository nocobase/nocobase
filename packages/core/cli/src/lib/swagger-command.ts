/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { executeRawApiRequest } from './api-client.js';
import { ensureCrossEnvConfirmed } from './env-guard.js';

export const swaggerRequestFlags = {
  env: Flags.string({
    char: 'e',
    description: 'CLI env name; omitted uses the current env',
  }),
  yes: Flags.boolean({
    char: 'y',
    description: 'Confirm using --env when it targets a different env than the current env',
    default: false,
  }),
  'api-base-url': Flags.string({
    description: 'NocoBase API base URL, for example http://localhost:13000/api',
  }),
  role: Flags.string({
    description: 'Role override, sent as X-Role',
  }),
  token: Flags.string({
    char: 't',
    description: 'API key or access token override',
  }),
};

export type SwaggerRequestFlags = {
  env?: string;
  yes?: boolean;
  'api-base-url'?: string;
  role?: string;
  token?: string;
};

export async function executeSwaggerRequest(
  command: Command,
  flags: SwaggerRequestFlags,
  path: string,
  query?: Record<string, string | undefined>,
) {
  const requestedEnv = flags.env?.trim() || undefined;
  const confirmed = await ensureCrossEnvConfirmed({
    command,
    requestedEnv,
    yes: flags.yes,
  });
  if (!confirmed) {
    return undefined;
  }

  return executeRawApiRequest({
    envName: requestedEnv,
    baseUrl: flags['api-base-url'],
    token: flags.token,
    role: flags.role,
    method: 'GET',
    path,
    query,
  });
}

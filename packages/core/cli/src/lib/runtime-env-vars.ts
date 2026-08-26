/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ManagedAppRuntime } from './app-runtime.js';
import { resolveBuiltinDbConnection } from './builtin-db.js';

function put(out: Record<string, string>, key: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }
  out[key] = String(value);
}

export async function buildRuntimeEnvVars(
  runtime: ManagedAppRuntime,
): Promise<Record<string, string>> {
  const config = runtime.env.config ?? {};
  const out = {
    ...runtime.env.envVars,
  };

  if (runtime.kind !== 'local' && runtime.kind !== 'docker') {
    return out;
  }

  if (!config.builtinDb) {
    return out;
  }

  const connection = await resolveBuiltinDbConnection(runtime);
  put(out, 'DB_DIALECT', connection.dbDialect);
  put(out, 'DB_HOST', connection.dbHost);
  put(out, 'DB_PORT', connection.dbPort);
  return out;
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { PortalDefinition } from './portal-types';

export interface PortalSystemLogInput {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  definition?: PortalDefinition;
  error?: unknown;
  fields?: Record<string, unknown>;
}

const levelValues = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

const getDateStamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const serializeError = (error: unknown): unknown => {
  if (!error) {
    return undefined;
  }

  if (!(error instanceof Error)) {
    return error;
  }

  const errorWithCode = error as Error & { cause?: unknown; code?: unknown; status?: unknown };
  return {
    type: error.name,
    message: error.message,
    stack: error.stack,
    code: errorWithCode.code,
    status: errorWithCode.status,
    cause: serializeError(error.cause),
  };
};

export const writePortalSystemLog = (input: PortalSystemLogInput): void => {
  const rootDir = input.definition?.rootDir;
  if (!rootDir) {
    return;
  }

  const logDir = path.join(rootDir, 'logs', 'embedded');
  mkdirSync(logDir, { recursive: true });

  const line = JSON.stringify({
    level: levelValues[input.level],
    time: new Date().toISOString(),
    channel: 'system',
    mode: 'embedded',
    appName: input.definition?.appName ?? 'main',
    portalName: input.definition?.portalName ?? input.definition?.id ?? 'main',
    portalId: input.definition?.id,
    basePath: input.definition?.basePath,
    rootDir,
    ...input.fields,
    err: serializeError(input.error),
    msg: input.msg,
  });

  appendFileSync(path.join(logDir, `system-${getDateStamp()}.log`), `${line}\n`, 'utf8');
};

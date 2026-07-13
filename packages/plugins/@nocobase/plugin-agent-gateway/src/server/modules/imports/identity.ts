/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { UniqueConstraintError } from 'sequelize';

import { AgentProviderKey } from '../../../shared/providerCapabilities';
import { getString } from '../../actions/utils';
import { hashExternalImportValue, sanitizeExternalImportKeyPart } from '../../services/externalImportUtils';

const MAX_DATABASE_STRING_LENGTH = 255;
const DEFAULT_IMPORT_BATCH_KEY = 'initial';
const MAX_BATCH_KEY_LENGTH = 200;
const MAX_FOUNDATION_ATTEMPTS = 3;

export interface ExternalIdentityDescriptor {
  identityKey: string;
  identityType: 'external-run-key' | 'run-code';
  externalRunKey: string | null;
  explicitRunCode: string | null;
  runCode: string;
}

function getExternalRunCode(values: Record<string, unknown>, provider: AgentProviderKey) {
  const explicitRunCode = getString(values.runCode);
  if (explicitRunCode) {
    return explicitRunCode;
  }
  const externalRunKey = getString(values.externalRunKey);
  if (externalRunKey) {
    const suffix = sanitizeExternalImportKeyPart(externalRunKey, 48);
    const hash = hashExternalImportValue(`${provider}\0${externalRunKey}`).slice(0, 16);
    return suffix ? `external_${hash}_${suffix}` : `external_${hash}`;
  }
  return '';
}

export function getExternalIdentityDescriptor(
  ctx: Context,
  values: Record<string, unknown>,
  provider: AgentProviderKey,
): ExternalIdentityDescriptor {
  const externalRunKey = getString(values.externalRunKey) || null;
  const explicitRunCode = getString(values.runCode);
  const runCode = getExternalRunCode(values, provider);
  if (explicitRunCode.length > MAX_DATABASE_STRING_LENGTH) {
    ctx.throw(413, `runCode must not exceed ${MAX_DATABASE_STRING_LENGTH} characters`);
  }
  if (externalRunKey) {
    return {
      identityKey: `external-run-key:${hashExternalImportValue(`${provider}\0${externalRunKey}`)}`,
      identityType: 'external-run-key',
      externalRunKey,
      explicitRunCode: explicitRunCode || null,
      runCode,
    };
  }
  if (explicitRunCode) {
    return {
      identityKey: `run-code:${hashExternalImportValue(explicitRunCode)}`,
      identityType: 'run-code',
      externalRunKey: null,
      explicitRunCode,
      runCode,
    };
  }
  ctx.throw(400, 'externalRunKey or runCode is required');
}

export function getBatchKey(ctx: Context, value: unknown, required: boolean) {
  const batchKey = getString(value) || (required ? '' : DEFAULT_IMPORT_BATCH_KEY);
  if (!batchKey) {
    ctx.throw(400, 'batchKey is required');
  }
  if (batchKey.length > MAX_BATCH_KEY_LENGTH) {
    ctx.throw(400, `batchKey must not exceed ${MAX_BATCH_KEY_LENGTH} characters`);
  }
  return batchKey;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof UniqueConstraintError ||
    (error instanceof Error && error.name === 'SequelizeUniqueConstraintError')
  );
}

export async function retryImportFoundation<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_FOUNDATION_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

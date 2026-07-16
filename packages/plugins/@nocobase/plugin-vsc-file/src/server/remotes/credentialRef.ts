/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSyncError } from './RemoteSyncAdapter';

const authRefPattern = /^\{\{ \$env\.([A-Za-z_][A-Za-z0-9_]*) \}\}$/;

export interface VscRemoteAuthRef {
  expression: string;
  name: string;
}

export interface VscRemoteAuthRefRecord {
  name: string;
  type: string;
}

export type VscRemoteAuthRefLookup = (name: string) => Promise<VscRemoteAuthRefRecord | null>;

export function parseVscRemoteAuthRef(input: unknown): VscRemoteAuthRef {
  if (typeof input !== 'string') {
    throw new RemoteSyncError('AUTH_REF_INVALID', 'Remote authRef must be a complete environment expression');
  }
  const match = authRefPattern.exec(input);
  if (!match) {
    throw new RemoteSyncError('AUTH_REF_INVALID', 'Remote authRef must be a complete environment expression');
  }
  return { expression: input, name: match[1] };
}

export async function validateVscRemoteAuthRef(
  input: unknown,
  lookup: VscRemoteAuthRefLookup,
): Promise<VscRemoteAuthRef> {
  const parsed = parseVscRemoteAuthRef(input);
  const record = await lookup(parsed.name);
  if (!record || record.name !== parsed.name || record.type !== 'secret') {
    throw new RemoteSyncError('AUTH_REF_INVALID', 'Remote authRef must reference a secret variable', {
      details: { reasonCode: 'secret-variable-required' },
    });
  }
  return parsed;
}

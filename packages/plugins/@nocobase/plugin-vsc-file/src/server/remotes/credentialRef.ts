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
const MAX_LITERAL_CREDENTIAL_LENGTH = 255;

export type VscRemoteAuthRef = { expression: string; name: string } | { expression: string; value: string };

export interface VscRemoteAuthRefRecord {
  name: string;
  type: string;
}

export type VscRemoteAuthRefLookup = (name: string) => Promise<VscRemoteAuthRefRecord | null>;

export function parseVscRemoteAuthRef(input: unknown): VscRemoteAuthRef {
  if (typeof input !== 'string') {
    throw invalidAuthRef();
  }
  const match = authRefPattern.exec(input);
  if (match) {
    return { expression: input, name: match[1] };
  }
  if (
    !input ||
    input.trim() !== input ||
    input.length > MAX_LITERAL_CREDENTIAL_LENGTH ||
    hasControlCharacter(input) ||
    input.includes('{{') ||
    input.includes('}}')
  ) {
    throw invalidAuthRef();
  }
  return { expression: input, value: input };
}

export async function validateVscRemoteAuthRef(
  input: unknown,
  lookup: VscRemoteAuthRefLookup,
): Promise<VscRemoteAuthRef> {
  const parsed = parseVscRemoteAuthRef(input);
  if ('value' in parsed) {
    return parsed;
  }
  const record = await lookup(parsed.name);
  if (!record || record.name !== parsed.name || record.type !== 'secret') {
    throw new RemoteSyncError('AUTH_REF_INVALID', 'Remote authRef must reference a secret variable', {
      details: { reasonCode: 'secret-variable-required' },
    });
  }
  return parsed;
}

function invalidAuthRef(): RemoteSyncError {
  return new RemoteSyncError(
    'AUTH_REF_INVALID',
    'Remote authRef must be a complete environment expression or a non-empty literal credential',
  );
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

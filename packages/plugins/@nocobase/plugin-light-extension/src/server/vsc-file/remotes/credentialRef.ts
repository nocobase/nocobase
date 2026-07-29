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
const maxLiteralTokenLength = 4096;
const parsedAuthRefs = new WeakSet<object>();
const validatedAuthRefs = new WeakSet<object>();
const validatedLiteralTokens = new WeakSet<object>();
declare const parsedAuthRefBrand: unique symbol;
declare const validatedAuthRefBrand: unique symbol;
declare const validatedLiteralTokenBrand: unique symbol;

export interface ParsedVscRemoteAuthRef {
  readonly expression: string;
  readonly name: string;
  readonly [parsedAuthRefBrand]: true;
}

export interface VscRemoteAuthRef extends ParsedVscRemoteAuthRef {
  readonly [validatedAuthRefBrand]: true;
}

export interface VscRemoteLiteralToken {
  readonly token: string;
  readonly [validatedLiteralTokenBrand]: true;
}

export type VscRemoteCredentialRef = VscRemoteAuthRef | VscRemoteLiteralToken;

export interface VscRemoteAuthRefRecord {
  name: string;
  type: string;
}

export type VscRemoteAuthRefLookup = (name: string) => Promise<VscRemoteAuthRefRecord | null>;

export function parseVscRemoteAuthRef(input: unknown): ParsedVscRemoteAuthRef {
  if (typeof input !== 'string') {
    throw invalidAuthRef();
  }
  const match = authRefPattern.exec(input);
  if (!match) {
    throw invalidAuthRef();
  }
  const parsed = Object.freeze({ expression: input, name: match[1] }) as ParsedVscRemoteAuthRef;
  parsedAuthRefs.add(parsed);
  return parsed;
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
  validatedAuthRefs.add(parsed);
  return parsed as VscRemoteAuthRef;
}

export async function validateVscRemoteCredentialRef(
  input: unknown,
  lookup: VscRemoteAuthRefLookup,
): Promise<VscRemoteCredentialRef> {
  if (typeof input === 'string' && authRefPattern.test(input)) {
    return validateVscRemoteAuthRef(input, lookup);
  }
  if (
    typeof input !== 'string' ||
    input.length === 0 ||
    input.length > maxLiteralTokenLength ||
    !/^\S+$/u.test(input) ||
    input.includes('{{') ||
    input.includes('}}')
  ) {
    throw invalidAuthRef();
  }
  const token = Object.freeze({ token: input }) as VscRemoteLiteralToken;
  validatedLiteralTokens.add(token);
  return token;
}

export function serializeVscRemoteAuthRef(authRef: VscRemoteAuthRef): string {
  if (!parsedAuthRefs.has(authRef) || !validatedAuthRefs.has(authRef)) {
    throw invalidAuthRef();
  }
  return authRef.expression;
}

export function serializeVscRemoteCredentialRef(credential: VscRemoteCredentialRef): string {
  if (validatedLiteralTokens.has(credential)) {
    return (credential as VscRemoteLiteralToken).token;
  }
  return serializeVscRemoteAuthRef(credential as VscRemoteAuthRef);
}

export function isVscRemoteLiteralToken(credential: VscRemoteCredentialRef): credential is VscRemoteLiteralToken {
  return validatedLiteralTokens.has(credential);
}

function invalidAuthRef(): RemoteSyncError {
  return new RemoteSyncError('AUTH_REF_INVALID', 'Remote credential must be a Secret variable or token');
}

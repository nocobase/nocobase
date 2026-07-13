/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export type AgentGatewayTokenPurpose = 'invitation' | 'node' | 'claim' | 'stream' | 'skill';

export interface OneTimeToken {
  token: string;
  tokenHash: string;
  tokenLast4: string;
  purpose: AgentGatewayTokenPurpose;
}

const TOKEN_PREFIXES: Record<AgentGatewayTokenPurpose, string> = {
  invitation: 'ag_inv',
  node: 'ag_node',
  claim: 'ag_claim',
  stream: 'ag_stream',
  skill: 'ag_skill',
};

const HASH_PREFIX = 'agent-gateway-token-v1';

export function getTokenLast4(token: string) {
  return token.slice(-4);
}

export function hashToken(token: string, purpose: AgentGatewayTokenPurpose) {
  return createHash('sha256').update(`${HASH_PREFIX}:${purpose}:`).update(token).digest('hex');
}

export function verifyTokenHash(
  token: string,
  tokenHash: string | null | undefined,
  purpose: AgentGatewayTokenPurpose,
) {
  if (!tokenHash) {
    return false;
  }

  const expectedHash = hashToken(token, purpose);
  const expected = Buffer.from(expectedHash, 'hex');
  const stored = Buffer.from(tokenHash, 'hex');

  if (stored.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(expected, stored);
}

export function createOneTimeToken(purpose: AgentGatewayTokenPurpose, randomBytesLength = 32): OneTimeToken {
  const token = `${TOKEN_PREFIXES[purpose]}_${randomBytes(randomBytesLength).toString('base64url')}`;

  return {
    token,
    tokenHash: hashToken(token, purpose),
    tokenLast4: getTokenLast4(token),
    purpose,
  };
}

export function createInvitationToken() {
  return createOneTimeToken('invitation');
}

export function createNodeToken() {
  return createOneTimeToken('node');
}

export function createClaimToken() {
  return createOneTimeToken('claim');
}

export function createStreamToken() {
  return createOneTimeToken('stream');
}

export function createSkillCapabilityToken() {
  return createOneTimeToken('skill');
}

export function hashInvitationToken(token: string) {
  return hashToken(token, 'invitation');
}

export function hashNodeToken(token: string) {
  return hashToken(token, 'node');
}

export function hashClaimToken(token: string) {
  return hashToken(token, 'claim');
}

export function hashStreamToken(token: string) {
  return hashToken(token, 'stream');
}

export function hashSkillCapabilityToken(token: string) {
  return hashToken(token, 'skill');
}

export function verifyInvitationToken(token: string, tokenHash: string | null | undefined) {
  return verifyTokenHash(token, tokenHash, 'invitation');
}

export function verifyNodeToken(token: string, tokenHash: string | null | undefined) {
  return verifyTokenHash(token, tokenHash, 'node');
}

export function verifyClaimToken(token: string, tokenHash: string | null | undefined) {
  return verifyTokenHash(token, tokenHash, 'claim');
}

export function verifyStreamToken(token: string, tokenHash: string | null | undefined) {
  return verifyTokenHash(token, tokenHash, 'stream');
}

export function verifySkillCapabilityToken(token: string, tokenHash: string | null | undefined) {
  return verifyTokenHash(token, tokenHash, 'skill');
}

export function toStoredTokenFields<THashField extends string, TLast4Field extends string>(
  token: Pick<OneTimeToken, 'tokenHash' | 'tokenLast4'>,
  tokenHashField: THashField,
  tokenLast4Field: TLast4Field,
) {
  return {
    [tokenHashField]: token.tokenHash,
    [tokenLast4Field]: token.tokenLast4,
  } as Record<THashField | TLast4Field, string>;
}

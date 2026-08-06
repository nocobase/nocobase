/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type JwtSessionPayload = {
  userId?: unknown;
  signInTime?: unknown;
  jti?: unknown;
};

const rdCache = new Map<string, string>();

function toBase64Url(input: string) {
  if (typeof btoa === 'function') {
    return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  return Buffer.from(input, 'binary').toString('base64url');
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  if (typeof atob === 'function') {
    return atob(padded);
  }
  return Buffer.from(padded, 'base64').toString('binary');
}

function fastHash(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function xorString(input: string, mask: string) {
  if (!mask) return '';
  let output = '';
  for (let index = 0; index < input.length; index += 1) {
    output += String.fromCharCode(input.charCodeAt(index) ^ mask.charCodeAt(index % mask.length));
  }
  return output;
}

export function decodeJwtSessionPayload(token?: string | null): JwtSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(fromBase64Url(parts[1])) as JwtSessionPayload;
  } catch {
    return null;
  }
}

export function getFlowModelRdSessionId(payload?: JwtSessionPayload | null) {
  const userId = payload?.userId;
  const sessionKey = payload?.signInTime || payload?.jti;
  if (
    (typeof userId !== 'string' && typeof userId !== 'number') ||
    (typeof sessionKey !== 'string' && typeof sessionKey !== 'number')
  ) {
    return '';
  }
  return `${userId}:${sessionKey}`;
}

export function getFlowModelRdSessionIdFromToken(token?: string | null) {
  return getFlowModelRdSessionId(decodeJwtSessionPayload(token));
}

export function generateFlowModelRd(flowModelUid?: string | number | null, sessionId?: string | null) {
  if ((typeof flowModelUid !== 'string' && typeof flowModelUid !== 'number') || !sessionId) return undefined;
  const uid = String(flowModelUid);
  const cacheKey = `${sessionId}\n${uid}`;
  const cached = rdCache.get(cacheKey);
  if (cached) return cached;

  const cipher = toBase64Url(xorString(uid, fastHash(`mask:v1:${sessionId}`)));
  const check = fastHash(`check:v1:${sessionId}:${uid}`);
  const rd = `v1.${cipher}.${check}`;
  rdCache.set(cacheKey, rd);
  return rd;
}

export function generateFlowModelRdFromToken(flowModelUid?: string | number | null, token?: string | null) {
  return generateFlowModelRd(flowModelUid, getFlowModelRdSessionIdFromToken(token));
}

export function resolveFlowModelUidFromRd(rd?: string | null, sessionId?: string | null) {
  if (!rd || !sessionId || typeof rd !== 'string') return undefined;
  const parts = rd.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1' || !parts[1] || !parts[2]) return undefined;

  try {
    const uid = xorString(fromBase64Url(parts[1]), fastHash(`mask:v1:${sessionId}`));
    const check = fastHash(`check:v1:${sessionId}:${uid}`);
    return check === parts[2] ? uid : undefined;
  } catch {
    return undefined;
  }
}

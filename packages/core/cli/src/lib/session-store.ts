/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CliHomeScope } from './cli-home.js';
import { resolveCliHomeDir } from './cli-home.js';

export interface SessionState {
  currentEnv?: string;
  updatedAt?: string;
}

export function getSessionId(): string | undefined {
  const value = String(process.env.NB_SESSION_ID ?? '').trim();
  return value || undefined;
}

function sessionsDir(scope?: CliHomeScope) {
  return path.join(resolveCliHomeDir(scope), 'sessions');
}

export function getSessionFilePath(sessionId: string, scope?: CliHomeScope) {
  return path.join(sessionsDir(scope), `${sessionId}.json`);
}

export async function loadSessionState(sessionId: string, scope?: CliHomeScope): Promise<SessionState | undefined> {
  try {
    const content = await fs.readFile(getSessionFilePath(sessionId, scope), 'utf8');
    const parsed = JSON.parse(content) as SessionState;
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch (_error) {
    return undefined;
  }
}

export async function saveSessionState(sessionId: string, state: SessionState, scope?: CliHomeScope) {
  const filePath = getSessionFilePath(sessionId, scope);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2));
}

export async function deleteSessionState(sessionId: string, scope?: CliHomeScope) {
  await fs.rm(getSessionFilePath(sessionId, scope), { force: true });
}

export async function getSessionCurrentEnv(scope?: CliHomeScope) {
  const sessionId = getSessionId();
  if (!sessionId) {
    return undefined;
  }

  const state = await loadSessionState(sessionId, scope);
  const currentEnv = String(state?.currentEnv ?? '').trim();
  return currentEnv || undefined;
}

export async function setSessionCurrentEnv(envName: string, scope?: CliHomeScope) {
  const sessionId = getSessionId();
  if (!sessionId) {
    return false;
  }

  await saveSessionState(sessionId, {
    currentEnv: envName,
    updatedAt: new Date().toISOString(),
  }, scope);
  return true;
}

export async function clearSessionCurrentEnv(scope?: CliHomeScope) {
  const sessionId = getSessionId();
  if (!sessionId) {
    return false;
  }

  await deleteSessionState(sessionId, scope);
  return true;
}

export async function resolveEffectiveCurrentEnv(
  validEnvNames: string[],
  options: {
    scope?: CliHomeScope;
    lastEnv?: string;
  } = {},
) {
  const sessionId = getSessionId();
  const normalizedValidNames = validEnvNames.filter(Boolean);

  if (sessionId) {
    const state = await loadSessionState(sessionId, options.scope);
    const sessionEnv = String(state?.currentEnv ?? '').trim();
    if (sessionEnv && normalizedValidNames.includes(sessionEnv)) {
      return sessionEnv;
    }

     if (sessionEnv) {
      const lastEnv = String(options.lastEnv ?? '').trim();
      const fallbackEnv = lastEnv && normalizedValidNames.includes(lastEnv)
        ? lastEnv
        : normalizedValidNames[0];

      if (fallbackEnv) {
        await saveSessionState(sessionId, {
          currentEnv: fallbackEnv,
          updatedAt: new Date().toISOString(),
        }, options.scope);
        return fallbackEnv;
      }

      await deleteSessionState(sessionId, options.scope);
    }
  }

  const lastEnv = String(options.lastEnv ?? '').trim();
  if (lastEnv && normalizedValidNames.includes(lastEnv)) {
    return lastEnv;
  }

  return normalizedValidNames[0] || 'default';
}

export async function cleanupCurrentSessionAfterEnvRemoval(
  removedEnv: string,
  options: {
    scope?: CliHomeScope;
    fallbackEnv?: string;
  } = {},
) {
  const sessionId = getSessionId();
  if (!sessionId) {
    return false;
  }

  const state = await loadSessionState(sessionId, options.scope);
  const sessionEnv = String(state?.currentEnv ?? '').trim();
  if (sessionEnv !== removedEnv) {
    return false;
  }

  const fallbackEnv = String(options.fallbackEnv ?? '').trim();
  if (fallbackEnv) {
    await saveSessionState(sessionId, {
      currentEnv: fallbackEnv,
      updatedAt: new Date().toISOString(),
    }, options.scope);
    return true;
  }

  await deleteSessionState(sessionId, options.scope);
  return true;
}

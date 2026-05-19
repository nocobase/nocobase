/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import { normalizeNodeOptions, normalizeSessionEnv, resolveNormalizedSessionId } from '../../bin/session-env.js';

describe('normalizeSessionEnv', () => {
  test('uses CODEX_THREAD_ID as the effective NB session id', () => {
    const env = {
      CODEX_THREAD_ID: 'thread-123',
      OPENCODE_RUN_ID: 'run-456',
      COPILOT_AGENT_SESSION_ID: 'copilot-789',
      CLAUDE_CODE_SESSION_ID: 'claude-999',
      NB_SESSION_ID: 'legacy-session',
    };

    const normalized = normalizeSessionEnv(env);

    expect(normalized).toBe('thread-123');
    expect(env.NB_SESSION_ID).toBe('thread-123');
  });

  test('uses OPENCODE_RUN_ID when CODEX_THREAD_ID is absent', () => {
    const env = {
      OPENCODE_RUN_ID: 'run-456',
      COPILOT_AGENT_SESSION_ID: 'copilot-789',
      CLAUDE_CODE_SESSION_ID: 'claude-999',
      NB_SESSION_ID: 'legacy-session',
    };

    const normalized = normalizeSessionEnv(env);

    expect(normalized).toBe('run-456');
    expect(env.NB_SESSION_ID).toBe('run-456');
  });

  test('uses COPILOT_AGENT_SESSION_ID when higher-priority ids are absent', () => {
    const env = {
      COPILOT_AGENT_SESSION_ID: 'copilot-789',
      CLAUDE_CODE_SESSION_ID: 'claude-999',
      NB_SESSION_ID: 'legacy-session',
    };

    const normalized = normalizeSessionEnv(env);

    expect(normalized).toBe('copilot-789');
    expect(env.NB_SESSION_ID).toBe('copilot-789');
  });

  test('uses CLAUDE_CODE_SESSION_ID when it is the only supported source', () => {
    const env = {
      CLAUDE_CODE_SESSION_ID: 'claude-999',
      NB_SESSION_ID: 'legacy-session',
    };

    const normalized = normalizeSessionEnv(env);

    expect(normalized).toBe('claude-999');
    expect(env.NB_SESSION_ID).toBe('claude-999');
  });

  test('does not change NB_SESSION_ID when no supported agent session id is present', () => {
    const env = {
      NB_SESSION_ID: 'legacy-session',
    };

    const normalized = normalizeSessionEnv(env);

    expect(normalized).toBeUndefined();
    expect(env.NB_SESSION_ID).toBe('legacy-session');
  });

  test('ignores blank CODEX_THREAD_ID values', () => {
    const env = {
      CODEX_THREAD_ID: '   ',
      OPENCODE_RUN_ID: '   ',
      COPILOT_AGENT_SESSION_ID: '   ',
      CLAUDE_CODE_SESSION_ID: '   ',
      NB_SESSION_ID: 'legacy-session',
    };

    const normalized = normalizeSessionEnv(env);

    expect(normalized).toBeUndefined();
    expect(env.NB_SESSION_ID).toBe('legacy-session');
  });
});

describe('resolveNormalizedSessionId', () => {
  test('prefers higher-priority sources in order', () => {
    expect(resolveNormalizedSessionId({
      CODEX_THREAD_ID: 'thread-123',
      OPENCODE_RUN_ID: 'run-456',
      COPILOT_AGENT_SESSION_ID: 'copilot-789',
      CLAUDE_CODE_SESSION_ID: 'claude-999',
    })).toBe('thread-123');

    expect(resolveNormalizedSessionId({
      OPENCODE_RUN_ID: 'run-456',
      COPILOT_AGENT_SESSION_ID: 'copilot-789',
      CLAUDE_CODE_SESSION_ID: 'claude-999',
    })).toBe('run-456');

    expect(resolveNormalizedSessionId({
      COPILOT_AGENT_SESSION_ID: 'copilot-789',
      CLAUDE_CODE_SESSION_ID: 'claude-999',
    })).toBe('copilot-789');
  });
});

describe('normalizeNodeOptions', () => {
  test('adds --preserve-symlinks when NODE_OPTIONS is empty', () => {
    const env: Record<string, string> = {};

    const normalized = normalizeNodeOptions(env);

    expect(normalized).toBe('--preserve-symlinks');
    expect(env.NODE_OPTIONS).toBe('--preserve-symlinks');
  });

  test('appends --preserve-symlinks without removing existing flags', () => {
    const env = {
      NODE_OPTIONS: '--max-old-space-size=4096',
    };

    const normalized = normalizeNodeOptions(env);

    expect(normalized).toBe('--max-old-space-size=4096 --preserve-symlinks');
    expect(env.NODE_OPTIONS).toBe('--max-old-space-size=4096 --preserve-symlinks');
  });

  test('does not append --preserve-symlinks twice', () => {
    const env = {
      NODE_OPTIONS: '--max-old-space-size=4096 --preserve-symlinks',
    };

    const normalized = normalizeNodeOptions(env);

    expect(normalized).toBe('--max-old-space-size=4096 --preserve-symlinks');
    expect(env.NODE_OPTIONS).toBe('--max-old-space-size=4096 --preserve-symlinks');
  });
});

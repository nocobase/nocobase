/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { FlowEngine } from '../flowEngine';
import { setRunJSApiFailureReporting, type RunJSApiFailureEvent } from '../runjsApiFailureReporter';
import { getDirtyAwareApiClient } from '../utils/dirtyAwareApiClient';

describe('RunJS API failure reporting', () => {
  it('reports one sanitized permission event and rethrows the exact request error', async () => {
    const engine = new FlowEngine();
    const events: RunJSApiFailureEvent[] = [];
    const error = {
      code: 'AXIOS_ERROR',
      config: { headers: { authorization: 'Bearer secret-token' }, data: { password: 'secret' } },
      response: {
        status: 403,
        data: {
          errors: [{ code: 'NO_PERMISSION', message: 'body secret-token' }],
          token: 'secret-token',
        },
      },
    };
    setRunJSApiFailureReporting(engine.context, {
      identity: {
        executionId: 'execution:1',
        artifactHash: 'a'.repeat(64),
        sourceURL: 'nocobase-runjs://bundle/test.js',
      },
      reporter: { report: (event) => events.push(event) },
    });
    const api = {
      request: vi.fn(async () => Promise.reject(error)),
      resource: vi.fn(() => ({})),
    };
    const wrapped = getDirtyAwareApiClient(api, engine.context) as typeof api;

    await expect(wrapped.request({ url: 'posts:update', method: 'patch' } as never)).rejects.toBe(error);

    expect(events).toEqual([
      expect.objectContaining({
        identity: expect.objectContaining({ executionId: 'execution:1' }),
        issue: {
          schemaVersion: 1,
          type: 'api',
          phase: 'permission',
          severity: 'error',
          method: 'PATCH',
          resource: 'posts',
          action: 'update',
          status: 403,
          reasonCode: 'NO_PERMISSION',
        },
      }),
    ]);
    expect(JSON.stringify(events)).not.toContain('secret-token');
    expect(JSON.stringify(events)).not.toContain('password');
  });

  it('covers resource actions but ignores external URLs and contexts without a reporter', async () => {
    const engine = new FlowEngine();
    const report = vi.fn();
    const failure = Object.assign(new Error('failed'), { response: { status: 500 } });
    const list = vi.fn(async () => Promise.reject(failure));
    const api = {
      request: vi.fn(async () => Promise.reject(failure)),
      resource: vi.fn(() => ({ list })),
    };
    setRunJSApiFailureReporting(engine.context, {
      identity: {
        executionId: 'execution:2',
        artifactHash: 'b'.repeat(64),
        sourceURL: 'nocobase-runjs://bundle/test-2.js',
      },
      reporter: { report },
    });
    const wrapped = getDirtyAwareApiClient(api, engine.context) as typeof api;

    await expect(wrapped.resource('posts').list()).rejects.toBe(failure);
    await expect(wrapped.request({ url: 'https://example.com/api/posts:list' } as never)).rejects.toBe(failure);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0][0]).toMatchObject({
      issue: { method: 'GET', resource: 'posts', action: 'list', phase: 'api' },
    });

    setRunJSApiFailureReporting(engine.context, undefined);
    await expect(wrapped.resource('posts').list()).rejects.toBe(failure);
    expect(report).toHaveBeenCalledTimes(1);
  });
});

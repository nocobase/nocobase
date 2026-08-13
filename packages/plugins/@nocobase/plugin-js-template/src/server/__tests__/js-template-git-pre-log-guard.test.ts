/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  jsTemplateGitPostBodyLogGuard,
  jsTemplateGitPreLogGuard,
  registerJsTemplateGitPreLogGuard,
} from '../jsTemplateGitPreLogGuard';

describe('JS Template Git pre-log guard', () => {
  it('registers before the core request logger', () => {
    const use = vi.fn();
    registerJsTemplateGitPreLogGuard({ use } as never);
    expect(use).toHaveBeenNthCalledWith(1, jsTemplateGitPreLogGuard, {
      tag: 'js-template-git-pre-log-guard',
      before: 'logger',
    });
    expect(use).toHaveBeenNthCalledWith(2, jsTemplateGitPostBodyLogGuard, {
      tag: 'js-template-git-post-body-log-guard',
      after: 'bodyParser',
      before: 'auth',
    });
  });

  it.each([400, 403, 422, 500])(
    'redacts final action params before the response logger observes status %s',
    async (status) => {
      const credential = `literal-credential-${status}`;
      const authRefValue = `{{ $env.AUTH_REF_${status} }}`;
      const ctx = {
        action: {
          params: {
            values: {
              authRef: authRefValue,
              config: { nested: [{ password: credential }] },
            },
          },
        },
        path: '/api/jsTemplateSync:configure',
        status,
      };

      await jsTemplateGitPostBodyLogGuard(ctx, async () => {
        ctx.status = status;
      });

      const serialized = JSON.stringify(ctx.action);
      expect(serialized).toContain('[REDACTED]');
      expect(serialized).not.toContain(credential);
      expect(serialized).not.toContain(authRefValue);
    },
  );

  it('redacts credential-like provider errors and source payloads on every response path', async () => {
    const stderr = 'fatal: Authentication failed for git-stderr-secret';
    const source = 'export default "source-text-secret";';
    const ctx = {
      action: {
        params: {
          values: { config: { url: 'https://git.example.com/project.git' } },
        },
      },
      body: {
        errors: [
          {
            code: 'REMOTE_UNAVAILABLE',
            credential: 'literal-credential-secret',
            stderr,
            source,
          },
        ],
      },
      path: '/api/jsTemplateSync:pull',
      status: 500,
    };

    await jsTemplateGitPostBodyLogGuard(ctx, async () => undefined);

    expect(JSON.stringify(ctx)).not.toMatch(/literal-credential-secret|git-stderr-secret|source-text-secret/u);
    expect(ctx.body).toMatchObject({
      errors: [{ credential: '[REDACTED]', stderr: '[REDACTED]', source: '[REDACTED]' }],
    });
  });

  it('redacts frozen response payloads without treating safe source metadata as source code', async () => {
    const sharedError = Object.freeze({ credential: 'frozen-credential-secret' });
    const ctx = {
      action: {
        params: {
          values: { sourceType: 'git', resourceName: 'jsTemplateSync' },
        },
      },
      body: Object.freeze({
        sourceType: 'git',
        contentHash: 'safe-content-hash',
        error: sharedError,
        repeatedError: sharedError,
      }),
      path: '/api/jsTemplateSync:createFromGit',
      status: 202,
    };

    await jsTemplateGitPostBodyLogGuard(ctx, async () => undefined);

    expect(ctx.action.params).toEqual({ values: { sourceType: 'git', resourceName: 'jsTemplateSync' } });
    expect(ctx.body).toEqual({
      sourceType: 'git',
      contentHash: 'safe-content-hash',
      error: { credential: '[REDACTED]' },
      repeatedError: { credential: '[REDACTED]' },
    });
    expect(ctx.body.error).toBe(ctx.body.repeatedError);
  });

  it.each([
    ['query', { url: '/api/jsTemplateSync:configure?authRef=raw-query-secret' }],
    [
      'header',
      {
        url: '/api/jsTemplateSync:configure',
        request: { headers: { 'x-git-credential': 'raw-header-secret' } },
      },
    ],
    ['path', { url: '/api/jsTemplateSync:configure/credential/raw-path-secret' }],
  ] as const)('rejects and redacts %s credentials before the request logger', async (_label, input) => {
    const ctx = {
      method: 'POST',
      path: '/api/jsTemplateSync:configure',
      request: { path: '/api/jsTemplateSync:configure', ...input.request },
      ...input,
    };
    const next = vi.fn(async () => undefined);

    await jsTemplateGitPreLogGuard(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx).toMatchObject({ status: 400, body: { errors: [{ code: 'JS_TEMPLATE_INVALID_INPUT' }] } });
    expect(JSON.stringify(ctx)).not.toMatch(/raw-(?:query|header|path)-secret/u);
  });

  it('passes ordinary JS Template Git requests and unrelated routes unchanged', async () => {
    const next = vi.fn(async () => undefined);
    const gitContext = {
      path: '/api/jsTemplateSync:configure',
      url: '/api/jsTemplateSync:configure?projectId=project-1',
      request: { headers: { 'x-csrf-token': 'csrf-value' } },
    };
    await jsTemplateGitPreLogGuard(gitContext, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(gitContext).toMatchObject({ url: '/api/jsTemplateSync:configure?projectId=project-1' });

    const unrelated = {
      path: '/api/users:list',
      url: '/api/users:list?authRef=ordinary-user-filter',
    };
    await jsTemplateGitPreLogGuard(unrelated, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(unrelated.url).toContain('ordinary-user-filter');
  });

  it('allows the standard session authorization header used by authenticated API requests', async () => {
    const next = vi.fn(async () => undefined);
    const ctx = {
      path: '/api/jsTemplateSync:createFromGit',
      url: '/api/jsTemplateSync:createFromGit',
      request: { headers: { authorization: 'Bearer signed-session-token' } },
    };

    await jsTemplateGitPreLogGuard(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.request.headers.authorization).toBe('Bearer signed-session-token');
  });
});

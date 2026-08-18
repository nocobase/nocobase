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
    'provides redacted action params to the response logger without changing request params at status %s',
    async (status) => {
      const credential = `literal-credential-${status}`;
      const authRefValue = `{{ $env.AUTH_REF_${status} }}`;
      const credentialUrl = `https://alice:${credential}@git.example.com/project.git`;
      const params = {
        values: {
          authRef: authRefValue,
          config: { url: credentialUrl, nested: [{ password: credential }] },
        },
      };
      const ctx = {
        action: {
          params,
          toJSON() {
            return { actionName: 'configure', params: this.params };
          },
        },
        path: '/api/jsTemplateSync:configure',
        status,
      };

      await jsTemplateGitPostBodyLogGuard(ctx, async () => {
        ctx.status = status;
      });

      const serialized = JSON.stringify(ctx.action.toJSON());
      expect(serialized).toContain('[REDACTED]');
      expect(serialized).not.toContain(credential);
      expect(serialized).not.toContain(authRefValue);
      expect(serialized).not.toContain(credentialUrl);
      expect(ctx.action.params).toBe(params);
      expect(ctx.action.params.values.authRef).toBe(authRefValue);
      expect(ctx.action.params.values.config.url).toBe(credentialUrl);
      expect(ctx.action.params.values.config.nested[0].password).toBe(credential);
    },
  );

  it('keeps a stable error DTO unchanged while redacting its independent action log view', async () => {
    const stderr = 'fatal: Authentication failed for git-stderr-secret';
    const credential = 'literal-credential-secret';
    const params = {
      values: {
        credential,
        stderr,
      },
    };
    const body = Object.freeze({
      errors: [
        Object.freeze({
          code: 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
          message: 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
          details: Object.freeze({ reasonCode: 'sync-operation-failed', retryable: true }),
        }),
      ],
    });
    const ctx = {
      action: {
        params,
        toJSON() {
          return { actionName: 'pull', params: this.params };
        },
      },
      body,
      path: '/api/jsTemplateSync:pull',
      status: 500,
    };

    await jsTemplateGitPostBodyLogGuard(ctx, async () => undefined);

    expect(ctx.body).toBe(body);
    expect(ctx.body.errors[0]).toEqual({
      code: 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
      message: 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
      details: { reasonCode: 'sync-operation-failed', retryable: true },
    });
    expect(JSON.stringify(ctx.body)).not.toMatch(/literal-credential-secret|git-stderr-secret/u);
    expect(JSON.stringify(ctx.action.toJSON())).not.toMatch(/literal-credential-secret|git-stderr-secret/u);
    expect(ctx.action.params).toBe(params);
  });

  it('restores the original action serializer and preserves the downstream error while unwinding', async () => {
    const credential = 'unwinding-credential-secret';
    const params = { values: { password: credential } };
    const body = Object.freeze({ errors: [Object.freeze({ code: 'DOWNSTREAM_FAILURE' })] });
    const downstreamError = new Error('downstream-failure');
    const action = {
      params,
      toJSON() {
        return { actionName: 'pull', params: this.params };
      },
    };
    const originalToJSON = action.toJSON;
    const ctx = {
      action,
      body,
      path: '/api/jsTemplateSync:pull',
      status: 500,
    };
    let loggedAction: unknown;

    await expect(
      jsTemplateGitPreLogGuard(ctx, async () => {
        try {
          await jsTemplateGitPostBodyLogGuard(ctx, async () => {
            throw downstreamError;
          });
        } catch (error) {
          loggedAction = ctx.action.toJSON();
          throw error;
        }
      }),
    ).rejects.toBe(downstreamError);

    expect(JSON.stringify(loggedAction)).not.toContain(credential);
    expect(ctx.action.toJSON).toBe(originalToJSON);
    expect(ctx.action.params).toBe(params);
    expect(ctx.body).toBe(body);
  });

  it('uses a minimal redacted log view when action serialization fails without replacing the downstream error', async () => {
    const credential = 'serializer-failure-credential';
    const params = { values: { credential } };
    const body = Object.freeze({ errors: [Object.freeze({ code: 'DOWNSTREAM_FAILURE' })] });
    const downstreamError = new Error('downstream-failure');
    const action = {
      params,
      toJSON() {
        throw new Error('tojson-failure');
      },
    };
    const originalToJSON = action.toJSON;
    const ctx = {
      action,
      body,
      path: '/api/jsTemplateSync:push',
      status: 500,
    };
    let loggedAction: unknown;

    await expect(
      jsTemplateGitPreLogGuard(ctx, async () => {
        try {
          await jsTemplateGitPostBodyLogGuard(ctx, async () => {
            throw downstreamError;
          });
        } catch (error) {
          loggedAction = ctx.action.toJSON();
          throw error;
        }
      }),
    ).rejects.toBe(downstreamError);

    expect(loggedAction).toEqual({ params: '[REDACTED]' });
    expect(ctx.action.toJSON).toBe(originalToJSON);
    expect(ctx.action.params).toBe(params);
    expect(ctx.body).toBe(body);
  });

  it.each(['get', 'configure', 'plan', 'pull', 'push'] as const)(
    'preserves the frozen %s success response and shared source object while exposing only a sanitized log view',
    async (actionName) => {
      const source = Object.freeze({
        provider: 'git',
        config: Object.freeze({ url: 'https://git.example.com/project.git', branch: 'main' }),
        status: 'active',
        credentialConfigured: true,
        authRefDisplay: '********',
      });
      const body = Object.freeze({ action: actionName, source, repeatedSource: source });
      const sourceCode = `export default "${actionName}-source-text-secret";`;
      const authRef = `{{ $env.${actionName.toUpperCase()}_TOKEN }}`;
      const params = { values: { source: sourceCode, authRef } };
      const action = {
        params,
        toJSON() {
          return { actionName, resourceName: 'jsTemplateSync', params: this.params };
        },
      };
      const originalToJSON = action.toJSON;
      const ctx = {
        action,
        body,
        path: `/api/jsTemplateSync:${actionName}`,
        status: 200,
      };
      let loggedAction: unknown;

      await jsTemplateGitPreLogGuard(ctx, async () => {
        await jsTemplateGitPostBodyLogGuard(ctx, async () => undefined);
        loggedAction = ctx.action.toJSON();
      });

      expect(ctx.body).toBe(body);
      expect(ctx.body.source).toBe(source);
      expect(ctx.body.repeatedSource).toBe(source);
      expect(ctx.body.source).toEqual({
        provider: 'git',
        config: { url: 'https://git.example.com/project.git', branch: 'main' },
        status: 'active',
        credentialConfigured: true,
        authRefDisplay: '********',
      });
      expect(loggedAction).toMatchObject({ params: { values: { source: '[REDACTED]', authRef: '[REDACTED]' } } });
      expect(JSON.stringify(loggedAction)).not.toContain(sourceCode);
      expect(JSON.stringify(loggedAction)).not.toContain(authRef);
      expect(ctx.action.params).toBe(params);
      expect(ctx.action.toJSON).toBe(originalToJSON);
    },
  );

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

import { expect, it, vi } from 'vitest';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { MiddlewareHandler } from 'hono';
import { apiRoutes } from '../../server/routes/index.js';
import {
  generateApiDocument,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';

it.each([401, 403, 200])(
  'checks access before inspection (%i)',
  async (status) => {
    const inspectSettings = vi.fn(() => [
      {
        path: 'server.port',
        value: '13000',
        source: 'file',
        fileValue: '13000',
      },
    ]);
    const identity: MiddlewareHandler = async (c, next) =>
      status === 401 ? c.json({}, 401) : next();
    const permission: MiddlewareHandler<AuthorizationEnv> = async (c, next) => {
      c.set('authz', {
        can: () => status === 200,
      } as unknown as AuthorizationEnv['Variables']['authz']);
      await next();
    };
    const app = {
      config: { inspectSettings },
      container: {
        resolve: (token: unknown) =>
          token === authenticationToken
            ? { required: () => identity }
            : token === authorizationToken
              ? { middleware: () => permission }
              : undefined,
      },
    };
    const router = await apiRoutes.createRouter(
      app as unknown as AppPluginApplication,
    );
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    if (status === 200) {
      const document = await generateApiDocument(router, {
        info: { title: 'Inspector', version: '1' },
      });
      expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    }
    const res = await router.request('/configInspector');
    expect(res.status).toBe(status);
    expect(inspectSettings).toHaveBeenCalledTimes(status === 200 ? 1 : 0);
    if (status === 200) expect((await res.json()).data.yaml).toContain('port:');
  },
);

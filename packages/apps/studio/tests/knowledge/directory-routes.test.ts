// @vitest-environment node
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { knowledgeToken } from '@nocobase/app-plugin-knowledge/server/tokens';
import {
  projectsToken,
  projectsAccessToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { knowledgeDirectoryRoutes } from '../../server/knowledge/directory-routes.js';
import { studioError } from '../../server/http/errors.js';

async function router(grant = true, signedIn = true) {
  const container = new ServiceContainer();
  const required: () => MiddlewareHandler = () => async (c, next) => {
    if (!signedIn)
      throw studioError('UNAUTHENTICATED', 'UNAUTHENTICATED', 'Sign in first.');
    c.set('auth' as never, { user: { id: 'u1' } } as never);
    await next();
  };
  container.instance(authenticationToken, { required } as never);
  container.instance(authorizationToken, {
    middleware: (): MiddlewareHandler => async (c, next) => {
      c.set('authz' as never, { can: () => Promise.resolve(grant) } as never);
      await next();
    },
  } as never);
  container.instance(projectsAccessToken, {
    permissionsOfUser: () => Promise.resolve({ scopes: {}, settings: {} }),
  } as never);
  const list = vi.fn().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
  container.instance(projectsToken, { projects: { list } } as never);
  const summaries = vi.fn().mockResolvedValue([]);
  const searchMany = vi.fn().mockResolvedValue([]);
  container.instance(knowledgeToken, {
    docs: { summaries, searchMany },
  } as never);
  const app = new Hono();
  app.route(
    '/',
    await knowledgeDirectoryRoutes.createRouter({ container } as never),
  );
  return { app, summaries, searchMany, list };
}

describe('Studio knowledge directory boundary', () => {
  it('refuses anonymous callers and missing page grants before enumerating projects', async () => {
    for (const [grant, signedIn, status] of [
      [true, false, 401],
      [false, true, 403],
    ] as const) {
      const { app, summaries, list } = await router(grant, signedIn);
      expect((await app.request('/knowledgeDirectory')).status).toBe(status);
      expect(list).not.toHaveBeenCalled();
      expect(summaries).not.toHaveBeenCalled();
    }
  });
  it('uses the same full authorized project set for counts and global search without client space input', async () => {
    const { app, summaries, searchMany, list } = await router();
    const refs = [
      { scope: 'project', scopeId: 'p1' },
      { scope: 'project', scopeId: 'p2' },
      { scope: 'system', scopeId: '' },
    ];
    expect((await app.request('/knowledgeDirectory')).status).toBe(200);
    expect(summaries).toHaveBeenCalledWith({ userId: 'u1' }, refs);
    expect(
      (
        await app.request(
          '/knowledgeDirectory/search?q=needle&pageSize=10&scopeId=forged',
        )
      ).status,
    ).toBe(200);
    expect(searchMany).toHaveBeenCalledWith({ userId: 'u1' }, refs, 'needle', {
      limit: 10,
    });
    expect(list).toHaveBeenCalledTimes(2);
    expect(
      (await app.request('/knowledgeDirectory/search?q=needle&pageSize=101'))
        .status,
    ).toBe(400);
  });
});

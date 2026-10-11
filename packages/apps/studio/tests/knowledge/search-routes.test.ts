// @vitest-environment node
/**
 * `GET /api/knowledgeSearch` as the settings page reads it: the vector index's store, availability, reason code and
 * progress, in the documented shape.
 */
import os from 'node:os';

import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { createAppPaths } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_KNOWLEDGE_SEARCH,
  type KnowledgeIndexStatus,
} from '../../shared/knowledge.js';
import { studioAccessToken } from '../../server/access/token.js';
import { KnowledgeSearchConfigSchema } from '../../server/knowledge/schemas.js';
import {
  studioKnowledgeSearchToken,
  knowledgeSearchRoutes,
} from '../../server/knowledge/search-routes.js';

async function routesWith(index: KnowledgeIndexStatus, read = true) {
  const container = new ServiceContainer();
  const required: () => MiddlewareHandler = () => async (context, next) => {
    context.set('auth' as never, { user: { id: 'u1' } } as never);
    await next();
  };
  container.instance(authenticationToken, { required } as never);
  container.instance(studioAccessToken, {
    grantsOfUser: () =>
      Promise.resolve({
        settings: {
          'studio.knowledgeSearch/read': read,
          'studio.knowledgeSearch/manage': false,
        },
      }),
  } as never);
  container.instance(studioKnowledgeSearchToken, {
    settings: {
      get: () => Promise.resolve(DEFAULT_KNOWLEDGE_SEARCH),
      save: () => Promise.resolve(),
      onChange: () => () => undefined,
    } as never,
    index: () => Promise.resolve(index),
  });
  const app = new Hono();
  app.route(
    '/',
    await knowledgeSearchRoutes.createRouter({
      appName: 'main',
      publicBasePath: '',
      config: { app: { name: 'main', publicBasePath: '' } } as never,
      paths: createAppPaths({ rootDir: os.tmpdir() }),
      router: app,
      container,
    } as never),
  );
  return app;
}

describe('the knowledge search status', () => {
  it('answers the store, its progress and a reason code', async () => {
    const building: KnowledgeIndexStatus = {
      available: true,
      store: { type: 'sqlite-vec', target: 'storage/vectors.sqlite' },
      reason: null,
      active: null,
      building: {
        modelService: 'openai',
        model: 'text-embedding-3-small',
        dimension: 1536,
        indexed: 120,
        total: 480,
      },
      pending: 360,
      failed: 0,
    };
    const response = await (
      await routesWith(building)
    ).request('/knowledgeSearch');
    expect(response.status).toBe(200);
    const { data } = (await response.json()) as { data: unknown };
    const config = KnowledgeSearchConfigSchema.parse(data);
    expect(config.index).toEqual(building);
    expect(config.canManage).toBe(false);

    const off: KnowledgeIndexStatus = {
      available: false,
      store: null,
      reason: 'VECTORS_OFF',
      active: null,
      building: null,
      pending: 0,
      failed: 0,
    };
    const answer = (await (
      await (await routesWith(off)).request('/knowledgeSearch')
    ).json()) as { data: unknown };
    expect(KnowledgeSearchConfigSchema.parse(answer.data).index).toEqual(off);
  });

  it('is refused without the read grant', async () => {
    const response = await (
      await routesWith(
        {
          available: false,
          store: null,
          reason: 'INDEX_NOT_SET_UP',
          active: null,
          building: null,
          pending: 0,
          failed: 0,
        },
        false,
      )
    ).request('/knowledgeSearch');
    expect(response.status).toBe(403);
  });
});

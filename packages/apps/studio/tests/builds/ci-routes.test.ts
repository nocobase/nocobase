// @vitest-environment node
/**
 * The CI setup routes under `/api/repositoryDeployments/{resourceId}/ci` (`server/releases/routes.ts`): reading needs
 * a sign-in and sight of the project, setting up again and rotating need managing it, checked before the setup runs;
 * the three are documented and are the commands `build ci get|setup|rotate`. `…/builds` lists what CI reported. A
 * repository keeps no preview variables: a preview takes its environment's values and its own App's.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import type { Application } from '@nocobase/app-server/application';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { studioAccessToken } from '../../server/access/token.js';
import type { CiSetup } from '../../server/builds/ci-setup.js';
import {
  studioBuildsToken,
  studioCiSetupToken,
} from '../../server/builds/token.js';
import { studioPreviewsToken } from '../../server/previews/token.js';
import { studioRepositoryLinksToken } from '../../server/releases/provider.js';
import { releasesRoutes } from '../../server/releases/routes.js';
import type { CiSetupView } from '../../shared/builds.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let api: Hono;
let router: Hono;
let resourceId: string;
let asked: string[];

const view = (id: string, canManage: boolean): CiSetupView => ({
  resourceId: id,
  repo: 'acme/shop',
  auto: true,
  state: 'pr-open',
  key: null,
  secretName: 'NB_STUDIO_API_KEY',
  secretKind: 'GitHub Actions secret',
  workflowPaths: ['.github/workflows/nb-studio-shop-preview.yml'],
  pullRequest: null,
  workflowSha: null,
  lastRotatedAt: null,
  lastError: null,
  lastFailure: null,
  canManage,
});

beforeEach(async () => {
  asked = [];
  h = await createBridgeHarness({ releases: true, previews: true });
  for (const id of ['alice', 'carol']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  await h.releases!.environments.create(SYSTEM_CALLER, {
    id: 'staging',
    name: 'Staging',
    driver: 'fake',
    config: {},
  });
  const project = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Shop',
    visibility: 'members',
  });
  resourceId = (
    await h.projects.projects.addResource(h.viewer('alice'), project.id, {
      type: 'gitRepo',
      url: 'https://github.com/acme/shop.git',
      defaultRef: 'main',
    })
  ).id;

  const container = new ServiceContainer();
  // A person is named by `x-test-user`; without it, 401.
  const required: MiddlewareHandler = async (context, next) => {
    const user = context.req.header('x-test-user');
    if (!user)
      return context.json(
        { error: { code: 401, status: 'UNAUTHENTICATED' } },
        401,
      );
    context.set('auth' as never, { user: { id: user } } as never);
    await next();
  };
  const middleware: MiddlewareHandler = async (context, next) => {
    const auth = context.get('auth' as never) as { user: { id: string } };
    context.set(
      'authz' as never,
      { identity: { principal: { type: 'user', id: auth.user.id } } } as never,
    );
    await next();
  };
  container.instance(authenticationToken, {
    required: () => required,
  } as never);
  container.instance(authorizationToken, {
    middleware: () => middleware,
  } as never);
  container.instance(studioAccessToken, {
    permissionsOf: (identity: { principal: { id: string } }) =>
      Promise.resolve(h.viewer(identity.principal.id).permissions),
  } as never);
  container.instance(studioRepositoryLinksToken, h.links!);
  const ci: Pick<CiSetup, 'view' | 'setup' | 'rotate'> = {
    view: (id, canManage) => Promise.resolve(view(id, canManage)),
    setup: (userId, id, options) => {
      asked.push(`setup ${userId} ${id}${options?.reveal ? ' reveal' : ''}`);
      return Promise.resolve(options?.reveal ? 'secret-setup' : null);
    },
    rotate: (userId, id, options) => {
      asked.push(`rotate ${userId} ${id}${options?.reveal ? ' reveal' : ''}`);
      return Promise.resolve(options?.reveal ? 'secret-rotate' : null);
    },
  };
  container.instance(studioCiSetupToken, ci as never);
  container.instance(studioBuildsToken, h.builds!);
  container.instance(studioPreviewsToken, h.previews!);
  const app = {
    container,
    config: { get: () => undefined },
    publicBasePath: '',
  } as unknown as Application;
  router = (await releasesRoutes.createRouter(app)) as Hono;
  api = new Hono();
  api.route('/api', router);
});
afterEach(() => h.close());

const call = (method: string, path: string, user?: string, json?: unknown) =>
  api.request(`/api/repositoryDeployments/${path}`, {
    method,
    headers: {
      ...(user ? { 'x-test-user': user } : {}),
      ...(json ? { 'content-type': 'application/json' } : {}),
    },
    ...(json ? { body: JSON.stringify(json) } : {}),
  });

describe('a repository’s preview variables', () => {
  it('are gone: a preview takes its environment’s values and its own App’s', async () => {
    const path = `${resourceId}/previewVariables`;
    expect((await call('GET', path, 'alice')).status).toBe(404);
    expect(
      (await call('PUT', `${path}/SMTP_HOST`, 'alice', { value: 'x' })).status,
    ).toBe(404);
  });
});

describe('the CI setup routes', () => {
  it('answer the setup to whoever sees the project, and nothing without a sign-in', async () => {
    expect((await call('GET', `${resourceId}/ci`)).status).toBe(401);
    const read = await call('GET', `${resourceId}/ci`, 'alice');
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({
      data: { state: 'pr-open', canManage: true },
    });
    const unknown = await call('GET', 'nope/ci', 'alice');
    expect(unknown.status).toBe(404);
  });

  it('set up again and rotate only for someone who manages the project', async () => {
    for (const action of ['setup', 'rotate']) {
      expect((await call('POST', `${resourceId}/ci/${action}`)).status).toBe(
        401,
      );
      const refused = await call('POST', `${resourceId}/ci/${action}`, 'carol');
      expect([403, 404]).toContain(refused.status);
      const done = await call('POST', `${resourceId}/ci/${action}`, 'alice');
      expect(done.status).toBe(200);
      expect(await done.json()).toMatchObject({ data: { canManage: true } });
    }
    expect(asked).toEqual([
      `setup alice ${resourceId}`,
      `rotate alice ${resourceId}`,
    ]);
  });

  it('answer the secret only when it is revealed, to someone who manages the project', async () => {
    for (const action of ['setup', 'rotate']) {
      const written = await call(
        'POST',
        `${resourceId}/ci/${action}`,
        'alice',
        {
          reveal: false,
        },
      );
      expect(
        ((await written.json()) as { data: Record<string, unknown> }).data,
      ).not.toHaveProperty('secret');
      const refused = await call(
        'POST',
        `${resourceId}/ci/${action}`,
        'carol',
        {
          reveal: true,
        },
      );
      expect([403, 404]).toContain(refused.status);
      expect(JSON.stringify(await refused.json())).not.toContain('secret-');
      const revealed = await call(
        'POST',
        `${resourceId}/ci/${action}`,
        'alice',
        { reveal: true },
      );
      expect(revealed.status).toBe(200);
      expect(await revealed.json()).toMatchObject({
        data: { canManage: true, secret: `secret-${action}` },
      });
      expect(
        (
          await call('POST', `${resourceId}/ci/${action}`, 'alice', {
            reveal: 'yes',
          })
        ).status,
      ).toBe(400);
    }
    expect(asked).toEqual([
      `setup alice ${resourceId}`,
      `setup alice ${resourceId} reveal`,
      `rotate alice ${resourceId}`,
      `rotate alice ${resourceId} reveal`,
    ]);
  });

  it('are documented, and are the commands build ci get, setup and rotate', async () => {
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const cli = (path: string, method: 'get' | 'post') =>
      (
        document.paths?.[path]?.[method] as Record<string, unknown> | undefined
      )?.['x-cli'];
    expect(
      cli('/api/repositoryDeployments/{resourceId}/ci', 'get'),
    ).toMatchObject({ command: 'build ci get' });
    expect(
      cli('/api/repositoryDeployments/{resourceId}/ci/setup', 'post'),
    ).toMatchObject({ command: 'build ci setup' });
    const setup = document.paths?.[
      '/api/repositoryDeployments/{resourceId}/ci/setup'
    ]?.post as { requestBody?: unknown } | undefined;
    expect(JSON.stringify(setup?.requestBody)).toContain('reveal');
    expect(
      cli('/api/repositoryDeployments/{resourceId}/ci/rotate', 'post'),
    ).toMatchObject({ command: 'build ci rotate' });
  });
});

describe('the repository builds route', () => {
  const report = (
    id: string,
    minutes: number,
    extra: Record<string, unknown> = {},
  ) => {
    const at = new Date(Date.UTC(2026, 9, 1, 12, minutes));
    return h.database
      .connection()
      .query.insertInto('studioBuilds')
      .values({
        id,
        appId: 'shop',
        resourceId,
        sha: id.padEnd(40, '0'),
        pullRequestId: 'pr-1',
        state: 'succeeded',
        superseded: false,
        verifiedAt: at,
        createdAt: at,
        updatedAt: at,
        ...extra,
      })
      .execute();
  };

  it('answers the newest builds of the repository a page at a time, to whoever sees it', async () => {
    await report('b1', 1);
    await report('b2', 3, {
      pullRequestId: null,
      ref: 'main',
      state: 'failed',
      logsUrl: 'https://github.com/acme/shop/actions/runs/7',
    });
    await report('b3', 2, { resourceId: 'elsewhere' });
    expect((await call('GET', `${resourceId}/builds`)).status).toBe(401);
    const read = await call('GET', `${resourceId}/builds?pageSize=1`, 'alice');
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({
      data: [
        {
          id: 'b2',
          ref: 'main',
          pullRequest: false,
          state: 'failed',
          logsUrl: 'https://github.com/acme/shop/actions/runs/7',
        },
      ],
      meta: { page: 1, pageSize: 1, total: 2 },
    });
    const second = await call(
      'GET',
      `${resourceId}/builds?pageSize=1&page=2`,
      'alice',
    );
    expect(await second.json()).toMatchObject({ data: [{ id: 'b1' }] });
    expect((await call('GET', 'nope/builds', 'alice')).status).toBe(404);
  });

  it('orders and dates builds by when CI reported them, not by their last update', async () => {
    await report('b1', 1, { updatedAt: new Date(Date.UTC(2026, 9, 1, 12, 9)) });
    await report('b2', 3);
    const read = await call('GET', `${resourceId}/builds`, 'alice');
    expect(await read.json()).toMatchObject({
      data: [
        { id: 'b2', reportedAt: '2026-10-01T12:03:00.000Z' },
        {
          id: 'b1',
          reportedAt: '2026-10-01T12:01:00.000Z',
          updatedAt: '2026-10-01T12:09:00.000Z',
        },
      ],
    });
  });

  it('answers an empty list before CI reported anything', async () => {
    const read = await call('GET', `${resourceId}/builds`, 'alice');
    expect(await read.json()).toEqual({
      data: [],
      meta: { page: 1, pageSize: 5, total: 0 },
    });
  });

  it('is documented, and is the command build list', async () => {
    const document = await generateApiDocument(router, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operation = document.paths?.[
      '/api/repositoryDeployments/{resourceId}/builds'
    ]?.get as Record<string, unknown> | undefined;
    expect(operation).toMatchObject({
      operationId: 'repositoryDeploymentsListBuilds',
      'x-cli': { command: 'build list' },
    });
  });
});

// @vitest-environment node
/**
 * The CI routes (`server/builds/ci-run-routes.ts`): reading where a repository's CI stands needs a sign-in and sight
 * of the project, running "Configure CI" and taking an App off the list need managing it (checked before anything
 * runs) and a valid run, and generating the standard file and listing the environments need only a sign-in; all are
 * documented and are the commands `build ci connection|configure|remove|workflows|environments`.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { studioAccessToken } from '../../server/access/token.js';
import { ciRunRoutes } from '../../server/builds/ci-run-routes.js';
import { parseCiRun } from '../../server/builds/ci-modes.js';
import type { CiSetup } from '../../server/builds/ci-setup.js';
import { studioCiSetupToken } from '../../server/builds/token.js';
import { studioRepositoryLinksToken } from '../../server/releases/provider.js';
import type { CiConnectionView } from '../../shared/ci-modes.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let api: Hono;
let router: Hono;
let resourceId: string;
let configured: unknown[];
let removed: unknown[];

const connection = (id: string, canManage: boolean) =>
  ({
    resourceId: id,
    repo: 'acme/shop',
    auto: false,
    state: 'disabled',
    key: null,
    secretName: 'NB_STUDIO_API_KEY',
    secretKind: null,
    workflowPaths: [],
    pullRequest: null,
    workflowSha: null,
    lastRotatedAt: null,
    lastError: null,
    lastFailure: null,
    canManage,
    connection: 'none',
    task: null,
    reported: false,
    connected: true,
    apps: [],
    environments: [],
  }) satisfies CiConnectionView;

beforeEach(async () => {
  configured = [];
  removed = [];
  h = await createBridgeHarness({ releases: true, previews: true });
  for (const id of ['alice', 'carol']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  const project = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Shop',
    visibility: 'members',
  });
  resourceId = (
    await h.projects.projects.addResource(h.viewer('alice'), project.id, {
      type: 'gitRepo',
      url: 'https://github.com/acme/shop.git',
      defaultRef: 'main',
      binding: {
        provider: 'github',
        connectionId: 'c1',
        repoId: '1',
        fullName: 'acme/shop',
      },
    } as never)
  ).id;
  const container = new ServiceContainer();
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
  const ci: Pick<CiSetup, 'connection' | 'configure' | 'removeApp'> = {
    connection: (id, canManage) => Promise.resolve(connection(id, canManage)),
    configure: (_, id, choice) => {
      parseCiRun(choice, 'shop');
      configured.push({ id, choice });
      return Promise.resolve();
    },
    removeApp: (_, id, row) => {
      if (row.appId !== 'crm') return Promise.resolve(false);
      removed.push({ id, row });
      return Promise.resolve(true);
    },
  };
  container.instance(studioCiSetupToken, ci as never);
  const app = {
    container,
    config: { get: () => undefined },
    publicBasePath: '/main',
  } as unknown as Application;
  router = (await ciRunRoutes.createRouter(app)) as Hono;
  api = new Hono();
  api.route('/api', router);
});
afterEach(() => h.close());

const call = (method: string, path: string, user?: string, body?: unknown) =>
  api.request(`http://studio.test/api/repositoryDeployments/${path}`, {
    method,
    headers: {
      ...(user ? { 'x-test-user': user } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

describe('the CI routes', () => {
  it('answer the connection to whoever sees the project', async () => {
    expect((await call('GET', `${resourceId}/ci/connection`)).status).toBe(401);
    const read = await call('GET', `${resourceId}/ci/connection`, 'alice');
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({
      data: { connection: 'none', apps: [], environments: [], canManage: true },
    });
    expect((await call('GET', 'nope/ci/connection', 'alice')).status).toBe(404);
  });

  it('take the repository as owner/repo, among the projects the caller sees', async () => {
    const named = await call('GET', 'ACME%2FShop/ci/connection', 'alice');
    expect(named.status).toBe(200);
    expect(await named.json()).toMatchObject({ data: { resourceId } });
    expect(
      (await call('GET', 'acme%2Fnothing/ci/connection', 'alice')).status,
    ).toBe(404);
    expect(
      (await call('GET', 'acme%2Fshop/ci/connection', 'carol')).status,
    ).toBe(404);
    // A second project working in it: which one is meant cannot be told.
    const fork = await h.projects.projects.create(h.viewer('alice'), {
      name: 'Shop fork',
      visibility: 'members',
    });
    await h.projects.projects.addResource(h.viewer('alice'), fork.id, {
      type: 'gitRepo',
      url: 'https://github.com/acme/shop.git',
      defaultRef: 'main',
      binding: {
        provider: 'github',
        connectionId: 'c1',
        repoId: '1',
        fullName: 'acme/shop',
      },
    } as never);
    const ambiguous = await call('GET', 'acme%2Fshop/ci/connection', 'alice');
    expect(ambiguous.status).toBe(400);
    expect(await ambiguous.json()).toMatchObject({
      error: { reason: 'REPOSITORY_AMBIGUOUS' },
    });
  });

  it('run Configure CI only for someone who manages the project, refusing an invalid run', async () => {
    const choice = {
      method: 'direct',
      app: { directory: '.', appId: 'shop-staging' },
      target: { trigger: 'branch', ref: 'main', environmentId: 'staging' },
    };
    expect(
      (await call('POST', `${resourceId}/ci/configure`, undefined, choice))
        .status,
    ).toBe(401);
    expect([403, 404]).toContain(
      (await call('POST', `${resourceId}/ci/configure`, 'carol', choice))
        .status,
    );
    expect(configured).toEqual([]);
    for (const [run, reason] of [
      [
        { method: 'direct', app: { directory: '../up', appId: 'shop' } },
        'INVALID_CI_APP',
      ],
      [
        {
          method: 'direct',
          target: { trigger: 'tag', ref: 'v 1', environmentId: 'production' },
        },
        'INVALID_CI_TARGET',
      ],
    ] as const) {
      const refused = await call(
        'POST',
        `${resourceId}/ci/configure`,
        'alice',
        run,
      );
      expect(refused.status).toBe(400);
      expect(await refused.json()).toMatchObject({ error: { reason } });
    }
    const done = await call(
      'POST',
      `${resourceId}/ci/configure`,
      'alice',
      choice,
    );
    expect(done.status).toBe(200);
    expect(configured).toEqual([{ id: resourceId, choice }]);
  });

  it('take an App off the list only for someone who manages the project', async () => {
    const path = `${resourceId}/ci/apps/crm?environmentId=preview&pullRequests=true`;
    expect((await call('DELETE', path)).status).toBe(401);
    expect([403, 404]).toContain((await call('DELETE', path, 'carol')).status);
    expect(removed).toEqual([]);
    const missing = await call(
      'DELETE',
      `${resourceId}/ci/apps/nope?environmentId=preview`,
      'alice',
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: { reason: 'CI_APP_NOT_FOUND' },
    });
    expect(
      (await call('DELETE', `${resourceId}/ci/apps/crm`, 'alice')).status,
    ).toBe(400);
    expect((await call('DELETE', path, 'alice')).status).toBe(204);
    expect(removed).toEqual([
      {
        id: resourceId,
        row: { environmentId: 'preview', appId: 'crm', pullRequests: true },
      },
    ]);
  });

  it('generate the standard file of an application and target not added yet, with Studio’s address', async () => {
    const answer = await call('POST', 'ciWorkflows/generate', 'carol', {
      app: { directory: 'apps/admin', appId: 'admin-staging' },
      target: { trigger: 'branch', environmentId: 'staging' },
      defaultBranch: 'develop',
    });
    expect(answer.status).toBe(200);
    const body = (await answer.json()) as {
      data: { path: string; content: string }[];
      meta: { total: number };
    };
    expect(body.meta.total).toBe(1);
    expect(body.data[0]!.path).toBe(
      '.github/workflows/nb-studio-admin-staging.yml',
    );
    expect(body.data[0]!.content).toContain(
      "NB_STUDIO_URL: 'http://studio.test/main'",
    );
    expect(body.data[0]!.content).toContain("branches: ['develop']");
    // The CLI reads the repository from the run: the file names none.
    expect(body.data[0]!.content).not.toContain('REPOSITORY');
    const invalid = await call('POST', 'ciWorkflows/generate', 'carol', {
      app: { directory: '.', appId: 'shop' },
      target: { trigger: 'pullRequest', environmentId: 'Not An Id' },
    });
    expect(invalid.status).toBe(400);
    expect(
      (
        await call('POST', 'ciWorkflows/generate', undefined, {
          app: { directory: '.', appId: 'shop' },
        })
      ).status,
    ).toBe(401);
  });

  it('list the environments a run may deploy to for whoever is signed in', async () => {
    expect((await call('GET', 'ciWorkflows/environments')).status).toBe(401);
    const listed = await call('GET', 'ciWorkflows/environments', 'carol');
    expect(listed.status).toBe(200);
    // This application has no release management: there is none.
    expect(await listed.json()).toEqual({ data: [], meta: { total: 0 } });
  });

  it('are documented, and are the commands build ci connection, configure, remove, workflows and environments', async () => {
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const cli = (path: string, method: 'get' | 'put' | 'post' | 'delete') =>
      (
        document.paths?.[path]?.[method] as Record<string, unknown> | undefined
      )?.['x-cli'];
    expect(
      cli('/api/repositoryDeployments/{resourceId}/ci/connection', 'get'),
    ).toMatchObject({ command: 'build ci connection' });
    expect(
      cli('/api/repositoryDeployments/{resourceId}/ci/configure', 'post'),
    ).toMatchObject({ command: 'build ci configure' });
    expect(
      cli('/api/repositoryDeployments/{resourceId}/ci/apps/{appId}', 'delete'),
    ).toMatchObject({ command: 'build ci remove' });
    expect(
      cli('/api/repositoryDeployments/ciWorkflows/generate', 'post'),
    ).toMatchObject({ command: 'build ci workflows' });
    expect(
      cli('/api/repositoryDeployments/ciWorkflows/environments', 'get'),
    ).toMatchObject({ command: 'build ci environments' });
  });
});

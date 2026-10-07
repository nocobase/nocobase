// @vitest-environment node
/**
 * `/api/projects/plans` for a caller the application acts as an agent for: its plans come from the source the
 * application gives (`projectsPlanSourceToken`), it lists that source's plans unless it asks for `all`, and an agent
 * the application gives no source is refused. A person still names the source.
 */
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlanSource } from '../../shared/plans.js';
import { apiRoutes } from '../../server/routes/api.js';
import {
  projectsAccessToken,
  projectsPlanSourceToken,
  projectsRequestActorToken,
  projectsToken,
  type ProjectsAccess,
} from '../../server/tokens.js';
import { createHarness, permissionsOf, type Harness } from '../harness.js';

const CONVERSATION: PlanSource = {
  kind: 'conversation',
  key: 'conversation:c-1',
  data: { conversationId: 'c-1' },
};

let h: Harness;
let router: Hono;
/** The source the application gives an agent's request; `null` refuses it. */
let source: PlanSource | null;

beforeEach(async () => {
  h = await createHarness();
  await h.addUser('alice', 'Alice');
  source = CONVERSATION;
  const authentication = new Auth({
    connection: h.database.connection(),
    secret: 'projects-plan-routes-test-secret-at-least-32-chars',
    baseURL: 'http://example.test',
  });
  vi.spyOn(authentication, 'getSession').mockImplementation(async (headers) => {
    const id = headers.get('x-test-user');
    if (!id) return null;
    const now = new Date();
    return {
      user: {
        id,
        name: id,
        email: `${id}@example.test`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: 's',
        token: 't',
        userId: id,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: now,
        updatedAt: now,
      },
    };
  });
  const authorization: { middleware(): MiddlewareHandler } = {
    middleware: () => async (context, next) => {
      context.set('authz', {
        identity: { principal: { type: 'user', id: 'alice' }, subjects: [] },
      } as never);
      await next();
    },
  };
  const access: ProjectsAccess = {
    permissionsOf: () => Promise.resolve(permissionsOf('admin', 'alice')),
    admit: () => Promise.resolve(),
    changed: () => Promise.resolve(),
    administrators: () => Promise.resolve([]),
  };
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(authorizationToken, authorization as never);
  container.instance(projectsToken, h.services);
  container.instance(projectsAccessToken, access);
  // `x-test-agent` stands for an agent's run in alice's conversation.
  container.instance(projectsRequestActorToken, (context) =>
    Promise.resolve(
      context.req.header('x-test-agent')
        ? {
            type: 'user',
            id: 'alice',
            via: 'agent' as const,
            trace: { agentId: 'a-1', runId: 'r-1', conversationId: 'c-1' },
          }
        : undefined,
    ),
  );
  container.instance(projectsPlanSourceToken, () => Promise.resolve(source));
  router = new Hono();
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: createAppPaths({ rootDir: '/tmp/projects-plan-routes' }),
    router,
    container,
  };
  router.route('/api', await apiRoutes.createRouter(app));
});
afterEach(() => h.close());

const call = (
  path: string,
  init: { method?: string; body?: unknown; agent?: boolean } = {},
) =>
  router.request(`/api/projects${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      'x-test-user': 'alice',
      ...(init.agent ? { 'x-test-agent': 'yes' } : {}),
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });

async function rows() {
  const issue = await h.services.issues.create(h.viewer('alice'), {
    title: 'A',
  });
  return [
    {
      op: 'issue.update',
      params: { issue: issue.identifier, set: { priority: 'high' } },
    },
  ];
}

describe('plans an agent proposes', () => {
  it('come from the source the application gives, for the person it acts for', async () => {
    const created = await call('/plans', {
      method: 'POST',
      agent: true,
      body: { title: 'Raise A', rows: await rows() },
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      data: { source: PlanSource; deciderUserId: string; proposer: unknown };
      meta: { message: string };
    };
    expect(body.data).toMatchObject({
      source: { kind: 'conversation', key: 'conversation:c-1' },
      deciderUserId: 'alice',
      proposer: { agentId: 'a-1', conversationId: 'c-1' },
    });
    expect(body.meta.message).toContain('waiting for them to execute it');
  });

  it("lists that source's plans unless asked for all", async () => {
    const plan = await rows();
    await call('/plans', {
      method: 'POST',
      body: {
        title: 'Elsewhere',
        source: { kind: 'manual', key: 'manual:1' },
        rows: plan,
      },
    });
    await call('/plans', {
      method: 'POST',
      agent: true,
      body: { title: 'Here', rows: plan },
    });
    const titles = async (path: string, agent: boolean) =>
      (
        (await (await call(path, { agent })).json()) as {
          data: { title: string }[];
        }
      ).data
        .map((item) => item.title)
        .sort();
    expect(await titles('/plans', true)).toEqual(['Here']);
    expect(await titles('/plans?all=true', true)).toEqual([
      'Elsewhere',
      'Here',
    ]);
    expect(await titles('/plans', false)).toEqual(['Elsewhere', 'Here']);
  });

  it('refuses an agent the application gives no source, and asks a person for one', async () => {
    source = null;
    const refused = await call('/plans', {
      method: 'POST',
      agent: true,
      body: { title: 'Raise A', rows: await rows() },
    });
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({
      error: { reason: 'PLAN_SOURCE_FORBIDDEN', domain: 'projects' },
    });
    const unsourced = await call('/plans', {
      method: 'POST',
      body: { title: 'Raise A', rows: await rows() },
    });
    expect(unsourced.status).toBe(400);
    expect(await unsourced.json()).toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [{ field: 'source' }],
      },
    });
  });
});

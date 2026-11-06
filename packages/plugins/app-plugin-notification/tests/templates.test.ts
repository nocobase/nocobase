import { describe, expect, it, vi } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import { ApiError, findUndeclaredApiRoutes } from '@nocobase/app-server/router';
import {
  NotificationTemplateRegistry,
  notificationTemplateRegistryToken,
  describeNotificationTemplateChannel,
  type NotificationTemplateDefinition,
} from '../server/templates.js';
import { createTemplateRoutes } from '../server/routes/templates.js';

function definition(
  overrides: Partial<NotificationTemplateDefinition> = {},
): NotificationTemplateDefinition {
  return {
    id: 'example.assigned',
    contributor: 'example',
    category: 'Tasks',
    name: 'Task assigned',
    trigger: 'Task created',
    recipients: 'Assignee',
    businessRule: 'Business triggered',
    locales: ['en-US'],
    languagePolicy: 'English only',
    variables: [{ name: 'title', description: 'Task title' }],
    channels: () => [
      { name: 'inbox', type: 'in-app', configured: true, enabled: true },
    ],
    render: (_locale, example) => ({
      title: example === 'sample' ? 'New task: Sample' : 'New task: {{title}}',
      body: 'Synthetic content',
    }),
    ...overrides,
  };
}

describe('source-owned template directory', () => {
  it('reflects registration, replacement and removal, rejecting duplicate ids', async () => {
    const registry = new NotificationTemplateRegistry();
    expect(registry.list()).toEqual([]);
    const remove = registry.register(definition());
    expect(() => registry.register(definition())).toThrow('already registered');
    expect(registry.get('example.assigned')?.name).toBe('Task assigned');
    remove();
    expect(registry.get('example.assigned')).toBeUndefined();
    const release = registry.register(definition({ name: 'Changed task' }));
    remove();
    expect(registry.list()[0]?.name).toBe('Changed task');
    release();
    expect(await registry.preview('example.assigned', 'en-US')).toBeUndefined();
  });

  it('uses fixed synthetic inputs, reports fallback and allowlists returned fields', async () => {
    const registry = new NotificationTemplateRegistry();
    const render = vi.fn((locale: string, sample: string) => ({
      title: `${locale}:${sample}`,
      body: '<script>inert text</script>',
      to: 'must-not-escape',
      token: 'must-not-escape',
    }));
    registry.register(definition({ render }));
    const preview = await registry.preview('example.assigned', 'zh-CN');
    expect(preview).toMatchObject({
      synthetic: true,
      requestedLocale: 'zh-CN',
      effectiveLocale: 'en-US',
      content: { title: 'en-US:sample' },
      definition: { title: 'en-US:definition' },
    });
    expect(JSON.stringify(preview)).not.toContain('must-not-escape');
    expect(render.mock.calls).toEqual([
      ['en-US', 'sample'],
      ['en-US', 'definition'],
    ]);
  });

  it('separates missing configuration from disabled channels without exposing transport fields', () => {
    expect(describeNotificationTemplateChannel(undefined, 'email')).toEqual({
      name: 'email',
      type: 'unknown',
      configured: false,
      enabled: null,
    });
    const config = {
      channels: {
        email: {
          type: 'smtp',
          enabled: false,
          auth: { pass: 'secret-not-returned' },
        },
      },
    };
    expect(describeNotificationTemplateChannel(config, 'email')).toEqual({
      name: 'email',
      type: 'smtp',
      configured: true,
      enabled: false,
    });
  });
});

function fixture(authenticated = true, allowed = true) {
  const container = new ServiceContainer();
  const registry = new NotificationTemplateRegistry();
  const render = vi.fn(definition().render);
  registry.register(definition({ render }));
  const can = vi.fn(async () => allowed);
  container.instance(notificationTemplateRegistryToken, registry);
  container.instance(authenticationToken, {
    required: () => async (_context, next) => {
      if (!authenticated)
        throw new ApiError({
          status: 'UNAUTHENTICATED',
          domain: 'auth',
          reason: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required.',
        });
      await next();
    },
  } as unknown as Auth);
  container.instance(authorizationToken, {
    middleware: () => async (context, next) => {
      context.set('authz', { can });
      await next();
    },
  } as unknown as Authorization);
  return { router: createTemplateRoutes(container), can, render, registry };
}

describe('template routes own their permission boundary', () => {
  it.each([
    ['GET', '/templates'],
    ['GET', '/templates/missing'],
    ['POST', '/templates/missing/preview'],
  ])(
    '%s %s checks identity and permission before existence or input',
    async (method, path) => {
      const anonymous = fixture(false);
      expect((await anonymous.router.request(path, { method })).status).toBe(
        401,
      );
      expect(anonymous.can).not.toHaveBeenCalled();
      const denied = fixture(true, false);
      const response = await denied.router.request(path, { method });
      expect(response.status).toBe(403);
      expect(denied.render).not.toHaveBeenCalled();
      expect(denied.can).toHaveBeenCalledWith({
        resource: { type: 'page', id: 'notification.templates' },
        action: 'access',
      });
    },
  );

  it('supports filters, detail, missing/empty results and strict synthetic-only preview', async () => {
    const { router, render } = fixture();
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    expect(
      await (
        await router.request(
          '/templates?search=assigned&category=Tasks&channel=in-app',
        )
      ).json(),
    ).toMatchObject({ meta: { total: 1 } });
    expect(
      await (await router.request('/templates?search=missing')).json(),
    ).toEqual({ data: [], meta: { total: 0 } });
    expect((await router.request('/templates/example.assigned')).status).toBe(
      200,
    );
    expect((await router.request('/templates/missing')).status).toBe(404);
    const response = await router.request(
      '/templates/example.assigned/preview',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: 'zh-CN' }),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      data: {
        synthetic: true,
        effectiveLocale: 'en-US',
        content: { title: 'New task: Sample' },
      },
    });
    expect(render).toHaveBeenCalledTimes(2);
    expect(
      (
        await router.request('/templates/example.assigned/preview', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ locale: 'en-US', recipientId: 'real-user' }),
        })
      ).status,
    ).toBe(400);
    expect(render).toHaveBeenCalledTimes(2);
  });
});

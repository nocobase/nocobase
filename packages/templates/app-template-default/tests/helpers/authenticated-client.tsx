import type { ReactElement } from 'react';
import { randomUUID } from 'node:crypto';
import { CookieJar } from 'jsdom';
import { afterAll, beforeAll, onTestFinished, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { renderWithApp } from '@nocobase/app-testing/client';
import authorization from '@nocobase/app-plugin-authorization/client/plugin';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { PermissionGrant } from '@nocobase/authorization/core';
import authentication from '@nocobase/app-plugin-authentication/client/plugin';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
  type TestSession,
  type SignInCredentials,
} from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../../server/standalone.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

/** Real application, authentication and cookies; only deliberate transport failures are injected by the caller. */
export async function renderAuthenticatedClient(
  ui: ReactElement,
  options: {
    member?: boolean;
    grants?: readonly PermissionGrant[];
    route?: string;
    locale?: string;
    prepare?: (server: TestApp, session: TestSession) => Promise<void>;
    namespaces?: NonNullable<Parameters<typeof renderWithApp>[1]>['namespaces'];
    beforeRequest?: (request: Request) => void | Promise<void>;
    afterResponse?: (
      request: Request,
      response: Response,
    ) => void | Promise<void>;
  } = {},
  sharedServer?: TestApp,
) {
  const server = sharedServer ?? (await createClientTestServer());
  if (!sharedServer) onTestFinished(() => server.close());
  const identity = sharedServer ? randomUUID() : '';
  const permissionSetKey = identity ? `test-access-${identity}` : 'test-access';
  const member = {
    name: 'Test member',
    email: identity ? `member-${identity}@example.test` : 'member@example.test',
    password: 'test-member-password',
  };
  if (options.member || sharedServer) {
    const response = await server.request('/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify(member),
    });
    if (!response.ok)
      throw new Error(`Member registration failed: ${await response.text()}`);
  }
  const authz = server.application.container.resolve(authorizationToken);
  const session = await signIn(
    server,
    options.member || sharedServer ? member : DEFAULT_ADMIN_CREDENTIALS,
  );
  if (sharedServer && !options.member) {
    await authz.permissionSets.assign({
      id: randomUUID(),
      permissionSet: 'root',
      subject: { type: 'user', id: session.user.id },
    });
  }
  if (options.grants) {
    await authz.permissionSets.create({
      key: permissionSetKey,
      grants: options.grants,
    });
    await authz.permissionSets.assign({
      id: identity ? `test-assignment-${identity}` : 'test-assignment',
      permissionSet: permissionSetKey,
      subject: { type: 'user', id: session.user.id },
    });
  }
  return renderClient(server, session, permissionSetKey, ui, options);
}

function createClientTestServer() {
  return createTestApp({
    createServer: createStandaloneServer,
    // Local preview origins must not change test cookie security or trusted origins.
    server: {
      env: {
        APP_PUBLIC_ORIGIN: 'http://localhost',
        BETTER_AUTH_TRUSTED_ORIGINS: 'http://localhost',
      },
    },
    connections: ['main'],
    config: {
      logging: { enabled: false },
      app: { publicOrigin: 'http://localhost' },
      auth: {
        secret: 'test-auth-secret-at-least-32-characters',
        emailAndPassword: { disableSignUp: false },
        advanced: { disableOriginCheck: false, disableCSRFCheck: false },
      },
    },
  });
}

/**
 * Reuse installation within a file whose tests only change their own identity's state.
 * Each render gets a new user, session, grants, cookies and client. Tests that mutate
 * shared application configuration or business data use renderAuthenticatedClient instead.
 */
export function createAuthenticatedClientRenderer() {
  let server: TestApp | undefined;
  beforeAll(async () => {
    server = await createClientTestServer();
  });
  afterAll(async () => {
    await server?.close();
  });
  return (
    ui: ReactElement,
    options: Parameters<typeof renderAuthenticatedClient>[1] = {},
  ) => {
    if (!server) throw new Error('The test application has not started.');
    return renderAuthenticatedClient(ui, options, server);
  };
}

async function renderClient(
  server: TestApp,
  session: TestSession,
  permissionSetKey: string,
  ui: ReactElement,
  options: NonNullable<Parameters<typeof renderAuthenticatedClient>[1]>,
) {
  await options.prepare?.(server, session);
  const jar = new CookieJar();
  const root = `http://localhost${server.publicBasePath.replace(/\/$/u, '')}`;
  for (const cookie of session.cookie.split('; ')) {
    await jar.setCookie(`${cookie}; Path=/`, root);
  }
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    request.headers.set('cookie', await jar.getCookieString(request.url));
    request.headers.set('origin', 'http://localhost');
    await options.beforeRequest?.(request);
    const response = await server.fetch(request);
    for (const cookie of response.headers.getSetCookie()) {
      await jar.setCookie(cookie, request.url);
    }
    await options.afterResponse?.(request, response);
    return response;
  };
  // Better Auth uses fetch directly; route it to the real in-process server with browser cookie handling.
  vi.stubGlobal('fetch', fetch);
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });
  let identity: ReturnType<typeof useAuthentication> | undefined;
  function SessionObserver() {
    identity = useAuthentication();
    return ui;
  }
  const view = await renderWithApp(<SessionObserver />, {
    plugins: [authentication(), authorization()],
    namespace: packageMetadata.name,
    namespaces: {
      ...options.namespaces,
      [packageMetadata.name]: {
        'en-US': async () => ({ default: enUS }),
        'zh-CN': async () => ({ default: zhCN }),
      },
    },
    ...(options.route ? { route: options.route } : {}),
    ...(options.locale ? { locale: options.locale } : {}),
    server: { publicBasePath: server.publicBasePath, fetch },
  });
  await waitFor(() => {
    if (identity?.isPending || identity?.session?.user.id !== session.user.id) {
      throw new Error('The signed-in session has not reached the client.');
    }
  });
  return {
    ...view,
    server,
    session,
    permissionSetKey,
    identity: () => identity!,
    async signInAs(credentials: SignInCredentials) {
      const next = await signIn(server, credentials);
      await jar.removeAllCookies();
      for (const cookie of next.cookie.split('; '))
        await jar.setCookie(`${cookie}; Path=/`, root);
      await act(() => identity!.refresh());
      return next;
    },
  };
}

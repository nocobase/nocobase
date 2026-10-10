/**
 * The host sending a person back to `/oauth/git/callback`: back to their Git settings with the reason in words the page
 * can show (and the host's own code), and a line in the server log for every failure that never carries the code or
 * the state, since these root routes write no request log of their own. A session that ended while the person was on
 * the host is answered by the session check itself, and still becomes a redirect (through sign-in) and a log line.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import { Auth } from '@nocobase/app-plugin-authentication';
import type { MiddlewareHandler } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import type { GitConnections } from '../../server/git/connections.js';
import {
  createGitOAuthRouter,
  type GitOAuthLogger,
} from '../../server/git/routes.js';
import type { StudioGitBinding } from '../../server/git/token.js';

const signedIn: MiddlewareHandler = async (context, next) => {
  context.set('auth' as never, { user: { id: 'u1' } } as never);
  await next();
};

function setup(completeAuthorization: GitConnections['completeAuthorization']) {
  const logger = { info: vi.fn(), warn: vi.fn() } satisfies GitOAuthLogger;
  const binding = {
    appPath: (path: string) => `/main${path}`,
    callbackUrl: () => '/main/oauth/git/callback',
    gitSettings: async () => ({ manage: false }),
    connections: () => ({ completeAuthorization }) as unknown as GitConnections,
  } as unknown as StudioGitBinding;
  const router = createGitOAuthRouter({ required: signedIn, binding, logger });
  return { router, logger };
}

describe('the return from authorizing the app', () => {
  it('goes back to the person’s Git settings, connected', async () => {
    const complete = vi.fn(async () => undefined);
    const { router, logger } = setup(complete);
    const response = await router.request(
      'http://studio.test/oauth/git/callback?code=c-secret&state=s-secret',
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      '/main/account/git?connected=1',
    );
    expect(complete).toHaveBeenCalledWith('u1', {
      code: 'c-secret',
      state: 's-secret',
      error: undefined,
      redirectUri: 'http://studio.test/main/oauth/git/callback',
    });
    expect(logger.info).toHaveBeenCalledOnce();
  });

  it('goes back with the reason and the host’s code, and logs it without the code or the state', async () => {
    const { router, logger } = setup(async () => {
      throw new ProtocolError(
        'INVALID_REQUEST',
        'The host refused the authorization (bad_verification_code).',
        {
          code: 'GIT_AUTHORIZATION_REFUSED',
          hostError: 'bad_verification_code',
        },
      );
    });
    const response = await router.request(
      'http://studio.test/oauth/git/callback?code=c-secret&state=s-secret',
    );
    expect(response.headers.get('location')).toBe(
      '/main/account/git?error=GIT_AUTHORIZATION_REFUSED&hostError=bad_verification_code',
    );
    expect(logger.warn).toHaveBeenCalledOnce();
    const [fields, message] = logger.warn.mock.calls[0]!;
    expect(message).toBe('Personal git authorization failed');
    expect(fields).toMatchObject({
      path: '/oauth/git/callback',
      userId: 'u1',
      reason: 'GIT_AUTHORIZATION_REFUSED',
      hostError: 'bad_verification_code',
    });
    expect(JSON.stringify(fields)).not.toMatch(/c-secret|s-secret/u);
  });

  it('logs the cause of an unexpected failure, and still sends the person back', async () => {
    const { router, logger } = setup(async () => {
      throw Object.assign(
        new ProtocolError(
          'INTERNAL_ERROR',
          'The code host could not be reached.',
        ),
        { cause: new TypeError('socket hang up') },
      );
    });
    const response = await router.request(
      'http://studio.test/oauth/git/callback?code=c-secret&state=s-secret',
    );
    expect(response.headers.get('location')).toBe(
      '/main/account/git?error=GIT_AUTHORIZATION_FAILED',
    );
    expect(logger.warn.mock.calls[0]![0]).toMatchObject({
      reason: 'GIT_AUTHORIZATION_FAILED',
      error: 'TypeError: socket hang up',
    });
  });

  it('sends a person whose session ended to sign in, then back with the reason, and logs it', async () => {
    // The real session check, finding no session: it answers 401 itself, without throwing.
    const auth = Object.assign(Object.create(Auth.prototype) as Auth, {
      getSession: async () => null,
    });
    const complete = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn() } satisfies GitOAuthLogger;
    const router = createGitOAuthRouter({
      required: auth.required(),
      binding: {
        appPath: (path: string) => `/main${path}`,
        callbackUrl: () => '/main/oauth/git/callback',
        gitSettings: async () => ({ manage: true }),
        connections: () =>
          ({ completeAuthorization: complete }) as unknown as GitConnections,
      } as unknown as StudioGitBinding,
      logger,
    });
    const response = await router.request(
      'http://studio.test/oauth/git/callback?code=c-secret&state=s-secret',
    );
    expect(response.status).toBe(302);
    const location = new URL(
      response.headers.get('location')!,
      'http://studio.test',
    );
    expect(location.pathname).toBe('/main/login');
    expect(location.searchParams.get('redirect')).toBe(
      '/account/git?error=GIT_SESSION_EXPIRED',
    );
    expect(complete).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
    const [fields] = logger.warn.mock.calls[0]!;
    expect(fields).toMatchObject({
      path: '/oauth/git/callback',
      reason: 'GIT_SESSION_EXPIRED',
      status: 401,
    });
    expect(JSON.stringify(fields)).not.toMatch(/c-secret|s-secret/u);
    // The returns from creating and installing an app, the same way, to Settings › Git.
    const setup = await router.request(
      'http://studio.test/oauth/git/setup?installation_id=1&state=s-secret',
    );
    expect(
      new URL(
        setup.headers.get('location')!,
        'http://studio.test',
      ).searchParams.get('redirect'),
    ).toBe('/config/git?error=GIT_SESSION_EXPIRED');
  });

  it('passes on what the host sent in place of a code', async () => {
    const complete = vi.fn(async () => {
      throw new ProtocolError('INVALID_REQUEST', 'Declined.', {
        code: 'GIT_AUTHORIZATION_DENIED',
      });
    });
    const { router, logger } = setup(complete);
    const response = await router.request(
      'http://studio.test/oauth/git/callback?error=access_denied&state=s-secret',
    );
    expect(complete).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ error: 'access_denied', code: undefined }),
    );
    expect(response.headers.get('location')).toBe(
      '/main/account/git?error=GIT_AUTHORIZATION_DENIED',
    );
    expect(logger.warn.mock.calls[0]![0]).toMatchObject({
      reason: 'GIT_AUTHORIZATION_DENIED',
    });
  });
});

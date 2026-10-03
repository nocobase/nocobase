// What another package's tests import to act as a signed-in user of an application that runs this plugin. It signs
// in through the application's own sign-in route, so the session it returns is the one a browser would hold.

/** An application under test: what `createTestApp()` from `@nocobase/app-testing/server` returns qualifies. */
export interface SignInTarget {
  readonly fetch: (request: Request) => Response | Promise<Response>;
  /** The application's public base path, such as `/main`; empty when it is served at the root. */
  readonly publicBasePath: string;
}

export type SignInCredentials =
  | { readonly username: string; readonly password: string }
  | { readonly email: string; readonly password: string };

export interface SignedInUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly username?: string | null;
}

/** A signed-in user of an application under test. */
export interface TestSession {
  readonly user: SignedInUser;
  /** The `cookie` request header that carries the session. */
  readonly cookie: string;
  /**
   * Sends a request as this user. A path starting with `/` is resolved against the application's API root, so
   * `session.fetch('/users')` reaches `<publicBasePath>/api/users`; the session cookie is added to the headers given.
   */
  fetch(path: string, init?: RequestInit): Promise<Response>;
}

/**
 * The administrator the plugin's default-administrator seed creates when `users.initialAdmin` is not configured, as an
 * application started with its seeds holds it.
 */
export const DEFAULT_ADMIN_CREDENTIALS: {
  readonly username: string;
  readonly email: string;
  readonly password: string;
} = Object.freeze({
  username: 'nocobase',
  email: 'admin@nocobase.com',
  password: 'admin123',
});

/** The origin requests are addressed to; the application routes by path, so any origin reaches it. */
const TEST_ORIGIN = 'http://localhost';

/**
 * Signs in through the application's sign-in route — by username when the credentials name one, which needs the
 * Better Auth `username` plugin the application templates configure, and by email otherwise — and returns the session.
 * Throws with the route's answer when the sign-in is refused.
 */
export async function signIn(
  app: SignInTarget,
  credentials: SignInCredentials,
): Promise<TestSession> {
  const apiRoot = `${TEST_ORIGIN}${trimTrailingSlash(app.publicBasePath)}/api`;
  const byUsername = 'username' in credentials;
  const response = await app.fetch(
    new Request(
      `${apiRoot}/auth/sign-in/${byUsername ? 'username' : 'email'}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(credentials),
      },
    ),
  );
  if (!response.ok) {
    throw new Error(
      `Sign-in as "${byUsername ? credentials.username : credentials.email}" failed with ${response.status}: ${await response.text()}`,
    );
  }
  const body = (await response.json()) as { user?: SignedInUser };
  if (!body.user) {
    throw new Error('Sign-in succeeded without returning the signed-in user.');
  }
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
  return {
    user: body.user,
    cookie,
    fetch: async (path, init = {}) => {
      const headers = new Headers(init.headers);
      headers.set(
        'cookie',
        [headers.get('cookie'), cookie].filter(Boolean).join('; '),
      );
      return app.fetch(
        new Request(path.startsWith('/') ? `${apiRoot}${path}` : path, {
          ...init,
          headers,
        }),
      );
    },
  };
}

function trimTrailingSlash(path: string): string {
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

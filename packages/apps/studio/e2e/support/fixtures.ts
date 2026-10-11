/**
 * What every browser test starts from: the throwaway server global setup started (`server.ts`), a browser context
 * signed in as one of the demo accounts, and a small API client sharing that context's session for setting up data
 * and checking what the interface did.
 *
 *   test.use({ user: 'lisa' });            // sign in as another demo account
 *   test('...', async ({ page, api }) => {  // `page` is already signed in
 *     const issue = await api.post('projects/issues', { title: '…' });
 *   });
 */
import {
  expect,
  test as base,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';

import { ADMIN, readState } from './server.ts';

export { expect };

/** The demo accounts (`server/demo/data.ts`), all with the password `demo1234`, and the initial administrator. */
export const USERS = {
  admin: { email: ADMIN.email, password: ADMIN.password, name: 'Super Admin' },
  alex: {
    email: 'alex@example.com',
    password: 'demo1234',
    name: 'Alex Turner',
  },
  lisa: {
    email: 'lisa@example.com',
    password: 'demo1234',
    name: 'Lisa Nguyen',
  },
  wendy: {
    email: 'wendy@example.com',
    password: 'demo1234',
    name: 'Wendy Foster',
  },
  leo: { email: 'leo@example.com', password: 'demo1234', name: 'Leo Young' },
} as const;

export type DemoUser = keyof typeof USERS;

export const server = readState();

/** The address of a page under Studio's mount, such as `url('/issues')`. */
export const url = (path: string): string =>
  `${server.baseURL}${path.startsWith('/') ? path : `/${path}`}`;

/** Matches Studio's home page, with or without a trailing slash after the mount, and the given query. */
export const atHome =
  (search = '') =>
  (address: URL): boolean =>
    address.pathname.replace(/\/$/u, '') === new URL(server.baseURL).pathname &&
    address.search === search;

/**
 * Better Auth and the API refuse a write without the application's own Origin. Each call takes a connection of its
 * own: reusing an idle keep-alive connection races the server closing it after its keep-alive timeout, and the request
 * then fails with ECONNRESET, which a browser would retry but Playwright's request context does not.
 */
const CONNECTION_HEADERS = { origin: server.origin, connection: 'close' };

export class Api {
  constructor(private readonly request: APIRequestContext) {}

  private async send<T>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.request.fetch(url(`/api/${path}`), {
      method,
      headers: { ...CONNECTION_HEADERS, ...headers },
      ...(body === undefined ? {} : { data: body as object }),
    });
    const text = await response.text();
    if (!response.ok())
      throw new Error(
        `${method} /api/${path}: ${response.status()} ${text.slice(0, 500)}`,
      );
    if (!text) return undefined as T;
    const json = JSON.parse(text) as { data?: unknown };
    return (
      json && typeof json === 'object' && 'data' in json ? json.data : json
    ) as T;
  }

  get<T = unknown>(path: string, headers?: Record<string, string>) {
    return this.send<T>('GET', path, undefined, headers);
  }

  post<T = unknown>(
    path: string,
    body: unknown = {},
    headers?: Record<string, string>,
  ) {
    return this.send<T>('POST', path, body, headers);
  }

  patch<T = unknown>(path: string, body: unknown) {
    return this.send<T>('PATCH', path, body);
  }

  put<T = unknown>(path: string, body: unknown) {
    return this.send<T>('PUT', path, body);
  }

  delete<T = unknown>(path: string) {
    return this.send<T>('DELETE', path);
  }
}

/** Signs a browser context in through the API; the context's pages and requests then share the session cookie. */
export async function signIn(
  context: BrowserContext,
  user: DemoUser,
): Promise<void> {
  const { email, password } = USERS[user];
  const response = await context.request.post(url('/api/auth/sign-in/email'), {
    data: { email, password },
    headers: CONNECTION_HEADERS,
  });
  if (!response.ok())
    throw new Error(
      `Signing in as ${user} failed: ${response.status()} ${await response.text()}`,
    );
}

/** Opens a page and waits until the application has rendered its first screen. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(url(path));
  await page.waitForLoadState('networkidle');
}

/**
 * How far the page sticks out sideways, in CSS pixels: the largest overflow of the document, the body, each `main`
 * and each open dialog, so content clipped by an `overflow: hidden` container counts too. Scroll areas meant to scroll
 * sideways (`overflow-x: auto` or `scroll`, such as a wide table or the board) are not counted. 0 means nothing sticks
 * out.
 */
export function horizontalOverflow(page: Page): Promise<number> {
  // The tooling tsconfig has no DOM library; the function runs in the browser.
  return page.evaluate<number>(`(() => {
    const candidates = [document.documentElement, document.body, ...document.querySelectorAll('main, [role="dialog"]')];
    let worst = 0;
    for (const element of candidates) {
      const style = getComputedStyle(element);
      const scrolls = element !== document.documentElement && (style.overflowX === 'auto' || style.overflowX === 'scroll');
      if (scrolls) continue;
      worst = Math.max(worst, element.scrollWidth - element.clientWidth);
    }
    return worst;
  })()`);
}

/** A unique suffix, so that tests running again against the same server do not collide. */
export const unique = (): string =>
  `${Date.now().toString(36)}${Math.floor(Math.random() * 1296)
    .toString(36)
    .padStart(2, '0')}`;

interface Fixtures {
  /** The demo account the test's `page` and `api` are signed in as. */
  user: DemoUser;
  api: Api;
  /** Errors thrown in the page; the test fails if any occurred. */
  pageErrors: string[];
}

export const test = base.extend<Fixtures>({
  user: ['alex', { option: true }],
  context: async ({ context, user }, use) => {
    await signIn(context, user);
    await use(context);
  },
  api: async ({ context }, use) => {
    await use(new Api(context.request));
  },
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use(errors);
      expect(errors, 'uncaught errors in the page').toEqual([]);
    },
    { auto: true },
  ],
});

/** An API client signed in as another demo account, in a context of its own. */
export async function apiAs(
  browser: import('@playwright/test').Browser,
  user: DemoUser,
): Promise<{ api: Api; close: () => Promise<void> }> {
  const context = await browser.newContext();
  await signIn(context, user);
  return { api: new Api(context.request), close: () => context.close() };
}

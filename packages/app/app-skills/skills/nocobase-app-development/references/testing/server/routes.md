# Server example: authentication, permissions, validation and persistence

Use `createAppTest()` when the behavior depends on the application's registered plugins, migrations, seeds and HTTP middleware. Requests pass through the real server in process; this fixture does not open a listening HTTP port. The following complete example covers anonymous access, administrator access, user creation and permissions, invalid input and a missing record.

## Prerequisites and configuration

Use an existing NocoBase 3 application with `server/standalone.ts`, the authentication, authorization and users plugins registered, and the default authorization policy that restricts user management to administrators. The official templates provide this composition. The example explicitly configures the initial administrator seed. If the application changes that seed or its policy, adapt the test identities and expected permissions to the actual application.

The users API provides an existing route to demonstrate the fixture. For feature work, import and test the real application composition and replace these cases with the feature's routes and permission boundaries; do not retain copies of framework tests as feature coverage.

Create `vitest.server.config.ts` at the application root:

```ts
import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  cacheDir: './storage/tests/vite-server',
  test: {
    include: ['tests/server/**/*.test.ts'],
    fileParallelism: false,
    passWithNoTests: false,
  },
});
```

## Create the shared fixture

Create `tests/helpers/app.ts`:

```ts
import { createAppTest } from '@nocobase/app-testing/server';
import { DEFAULT_ADMIN_CREDENTIALS } from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../../server/standalone.js';

export const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
  },
});
```

This provisions `main`. Name every application-owned connection in `connections`, for example `['main', 'analytics']` for an application owning both. An omitted connection keeps the application's configuration; it is not automatically replaced with a test database. Do not override the provisioned connection's host, database or storage in `config.database.connections`.

The application must honor the supplied `configPath`, as the templates do. Migrations and seeds run by default; use `install: false` only when the test installs them itself. The auth values above are fixed test-only values, and the storage directory is temporary.

## Exercise the route

Create `tests/server/users.test.ts`:

```ts
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { expect } from 'vitest';
import { test } from '../helpers/app.js';

test('returns 401 without a session', async ({ request }) => {
  const response = await request('/users');

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    error: { status: 'UNAUTHENTICATED' },
  });
});

test('returns the administrator record after sign-in', async ({ testApp }) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch(
    `/users?q=${encodeURIComponent(admin.user.email)}`,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({
        id: admin.user.id,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
      }),
    ]),
  });
});

test('creates a user but denies that user access to the users list', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const credentials = {
    email: 'server-test-member@example.com',
    password: 'test-member-password',
  };

  const created = await admin.fetch('/users', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    body: JSON.stringify({ name: 'Test member', ...credentials }),
  });
  expect(created.status).toBe(201);

  const member = await signIn(testApp, credentials);
  const forbidden = await member.fetch('/users');
  expect(forbidden.status).toBe(403);
  await expect(forbidden.json()).resolves.toMatchObject({
    error: { status: 'PERMISSION_DENIED' },
  });

  const saved = await admin.fetch(
    `/users?q=${encodeURIComponent(credentials.email)}`,
  );
  expect(saved.status).toBe(200);
  await expect(saved.json()).resolves.toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({
        id: member.user.id,
        name: 'Test member',
        email: credentials.email,
      }),
    ]),
  });
});

test('returns 400 for an invalid page number', async ({ testApp }) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/users?page=0');

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: { status: 'INVALID_ARGUMENT' },
  });
});

test('returns 404 for a missing user', async ({ testApp }) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/users/server-test-missing-user', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    body: JSON.stringify({ name: 'Updated name' }),
  });

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toMatchObject({
    error: { status: 'NOT_FOUND', reason: 'USER_NOT_FOUND' },
  });
});
```

`request('/users')` is anonymous and resolves below the application's API root, including its deployment base path. `signIn()` performs a real sign-in; `admin.fetch()` and `member.fetch()` attach the resulting session cookie. Pass `/users`, not `/api/users` or `/main/api/users`. Mutating requests in this example also send the trusted `origin` and JSON content type.

The response checks distinguish `401 UNAUTHENTICATED`, `403 PERMISSION_DENIED`, `400 INVALID_ARGUMENT` and `404 NOT_FOUND` with `USER_NOT_FOUND`. The creation case verifies persistence by reading the created user back through the administrator's API; it then verifies that the new user's session cannot list users.

## Isolation and cleanup

`createAppTest()` defaults to `scope: 'file'`: cases share one application and its database. The example's only writing case creates its own user and does not depend on another case's data; the remaining cases read the administrator or reject invalid requests. Do not make later tests depend on the created user. Use unique identities for additional writing cases, clean up their records when needed, or choose `scope: 'test'` in the fixture options when each case needs a freshly installed application.

The fixture closes the application before dropping its databases and deleting temporary storage. When using `createTestApp()` directly, close it in `finally` with `await testApp.close()`. When using `createAppTest()`, let the fixture own cleanup; closing it inside a case would invalidate the other cases in the same file. Run server and database suites sequentially.

## Run and check

```bash
pnpm exec vitest run --config vitest.server.config.ts --reporter=verbose
```

Expect five passing cases covering `401`, `200`, `201` followed by `403`, `400`, and `404`. An ordinary user's `403` must come from the real permission middleware, not an always-allow or always-deny mock.

For application-owned routes, also verify the route's [API declaration](../../testing.md#the-api-document). Return to [testing and verification](../../testing.md).

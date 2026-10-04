// @vitest-environment node
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';

import { createStandaloneServer } from '../../server/standalone.ts';

// The installed application, signed into through its own sign-in route: the session, the permission sets the
// departments example grants, and the confidentiality restriction it assigns company-wide all apply as they do for a
// user of the running application, on whichever database NOCOBASE_TEST_DB_DIALECT selects.
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
    hub: { host: { enabled: false } },
  },
});

const QUOTES_RULE = 'example-public-authorizationExampleQuotes';

/** A demo account the departments example seeds: Leo, a proposal engineer in North Sales. */
const ENGINEER = {
  email: 'leo@departments.example',
  password: 'departments-demo',
};

async function quoteIds(session: TestSession): Promise<string[]> {
  const response = await session.fetch(
    '/authorizationExample/sales/quotes?pageSize=100',
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as { data: { id: string }[] };
  return body.data.map((quote) => quote.id);
}

describe('the sales confidentiality restriction, through a signed-in session', () => {
  test('rejects a request without a session', async ({ request }) => {
    const response = await request('/authorizationExample/sales/quotes');
    expect(response.status).toBe(401);
  });

  test('leaves confidential quotes out of an engineer’s list and in an administrator’s', async ({
    testApp,
    connection,
  }) => {
    const confidentialProjects = await connection.query
      .selectFrom('authorizationExampleProjects')
      .select(['id'])
      .where('confidential', '=', true)
      .execute();
    const confidentialQuotes = (
      await connection.query
        .selectFrom('authorizationExampleQuotes')
        .select(['id'])
        .where(
          'projectId',
          'in',
          confidentialProjects.map((project) => project.id),
        )
        .execute()
    ).map((quote) => String(quote.id));
    expect(confidentialQuotes.length).toBeGreaterThan(0);

    const administrator = await quoteIds(
      await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS),
    );
    expect(administrator).toEqual(expect.arrayContaining(confidentialQuotes));

    const engineer = await quoteIds(await signIn(testApp, ENGINEER));
    expect(engineer.length).toBeGreaterThan(0);
    expect(engineer.filter((id) => confidentialQuotes.includes(id))).toEqual(
      [],
    );
  });

  test('shows the engineer the confidential quotes once the restriction is no longer assigned', async ({
    testApp,
    connection,
  }) => {
    const engineer = await signIn(testApp, ENGINEER);
    const restricted = await quoteIds(engineer);
    await connection.query
      .deleteFrom('authorizationRestrictionRuleAssignments')
      .where('restrictionRuleId', '=', QUOTES_RULE)
      .execute();
    const unrestricted = await quoteIds(engineer);
    expect(unrestricted.length).toBeGreaterThan(restricted.length);
    expect(unrestricted).toEqual(expect.arrayContaining(restricted));
  });
});

import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  authenticationToken,
  createUserAdministrationService,
} from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { knowledgeAccessToken, knowledgeToken } from '../../server/tokens.js';
import { expect } from 'vitest';

export { startMockOpenAI } from '../../../app-plugin-agents/tests/mock-openai.js';

/** Real isolated application users, session authentication and the production access resolver. */
export async function knowledgeReaderFixture(
  app: Application,
  fetch: (request: Request) => Response | Promise<Response>,
) {
  const auth = app.container.resolve(authenticationToken);
  const authorization = app.container.resolve(authorizationToken);
  const users = createUserAdministrationService({
    auth,
    connection: app.container.resolve(databaseManagerToken).connection(),
  });
  const user = await users.create({
    name: 'Alice',
    email: 'alice@knowledge.invalid',
    password: 'fixture-password-123',
  });
  const response = await fetch(
    new Request(
      `http://localhost${(await auth.openAPISchema()).basePath}/sign-in/email`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({
          email: user.email,
          password: 'fixture-password-123',
        }),
      },
    ),
  );
  expect(response.status).toBe(200);
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
  const credentials = await auth.getSession(new Headers({ cookie }));
  app.container.singleton(knowledgeAccessToken, () => ({
    space: (ref) => (ref.scope === 'project' ? ref : null),
    inherits: () => [],
    forReader: (reader) => ({
      access: async (ref) => ({
        read:
          reader.userId === 'admin' ||
          (reader.userId === user.id && ref.scopeId !== 'secret'),
        propose: false,
        edit: reader.userId === 'admin',
        manage: reader.userId === 'admin',
      }),
    }),
    title: async (ref) => ref.scopeId,
    names: async () => new Map(),
  }));
  const knowledge = app.container.resolve(knowledgeToken);
  const documents = [];
  for (const scopeId of ['one', 'two', 'secret'])
    documents.push(
      await knowledge.docs.create(
        { userId: 'admin' },
        {
          scope: 'project',
          scopeId,
          title: scopeId,
          content: `Release procedure for ${scopeId}.`,
        },
      ),
    );
  const hidden = await knowledge.docs.create(
    { userId: 'admin' },
    {
      scope: 'project',
      scopeId: 'one',
      title: 'Hidden',
      content: 'Release private node.',
    },
  );
  await knowledge.permissions.replace({ userId: 'admin' }, hidden.id, {
    mode: 'custom',
    entries: [],
  });
  const context = {
    user: { id: user.id },
    credentials,
    authorization: authorization.for({
      principal: { type: 'user', id: user.id },
    }),
  };
  return {
    auth,
    user,
    cookie,
    context,
    knowledge,
    documents,
    hidden,
  };
}

export async function knowledgeAgentFixture(
  app: Application,
  fetch: (request: Request) => Response | Promise<Response>,
) {
  return {
    ...(await knowledgeReaderFixture(app, fetch)),
    agents: app.container.resolve(agentsToken),
  };
}

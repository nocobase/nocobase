// @vitest-environment node

import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { knowledgeAccessToken } from '@nocobase/app-plugin-knowledge/server';
import { DEFAULT_SPACE } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
  },
});

const headers = {
  'content-type': 'application/json',
  origin: 'http://localhost',
};
const spaces = '/knowledge/spaces?scope=default&scopeId=';
const document = {
  ...DEFAULT_SPACE,
  kind: 'article',
  title: 'Examples knowledge',
  content: '# Knowledge\n\nA shared application document.',
};

test('enables Knowledge with default-space grants, without granting members automatic access', async ({
  testApp,
  request,
}) => {
  expect((await request(spaces)).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  expect((await admin.fetch(spaces)).status).toBe(200);
  expect(
    (
      await admin.fetch('/knowledge/docs', {
        method: 'POST',
        headers,
        body: JSON.stringify(document),
      })
    ).status,
  ).toBe(201);

  const credentials = {
    email: 'knowledge-reader@example.com',
    password: 'correct horse battery staple',
  };
  expect(
    (
      await request('/auth/sign-up/email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...credentials,
          name: 'Knowledge reader',
          username: 'knowledgereader',
        }),
      })
    ).status,
  ).toBe(200);
  const member = await signIn(testApp, credentials);
  expect((await member.fetch(spaces)).status).toBe(404);
  expect((await member.fetch('/knowledgeDirectory')).status).toBe(403);
  expect((await member.fetch('/knowledgeDirectory/search?q=')).status).toBe(
    403,
  );
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'knowledge-reader',
    grants: [
      {
        resource: { type: 'page', id: 'knowledge' },
        actions: [{ action: 'access' }],
      },
      {
        resource: { type: 'kb', id: 'kb.knowledge' },
        actions: [{ action: 'read.related' }],
      },
    ],
  });
  await authz.permissionSets.assign({
    id: 'knowledge-reader-assignment',
    permissionSet: 'knowledge-reader',
    subject: { type: 'user', id: member.user.id },
  });
  expect((await member.fetch(spaces)).status).toBe(200);
  const directory = await member.fetch('/knowledgeDirectory');
  expect(directory.status).toBe(200);
  expect(
    ((await directory.json()) as { meta: { total: number } }).meta.total,
  ).toBe(3);
  for (const scope of ['sales', 'engineering']) {
    expect(
      (await member.fetch(`/knowledge/spaces?scope=${scope}&scopeId=`)).status,
    ).toBe(200);
    expect(
      (
        await member.fetch('/knowledge/docs', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...document, scope }),
        })
      ).status,
    ).toBe(403);
  }
  expect(
    (
      await member.fetch('/knowledge/docs', {
        method: 'POST',
        headers,
        body: JSON.stringify(document),
      })
    ).status,
  ).toBe(403);

  const resolver = testApp.application.container.resolve(knowledgeAccessToken);
  expect(
    resolver.space({ scope: 'project', scopeId: 'unregistered' }),
  ).toBeNull();
  const actor = resolver.forReader({
    userId: admin.user.id,
    actor: { kind: 'agent', id: 'test-agent' },
  });
  expect(await actor.access(DEFAULT_SPACE)).toEqual({
    read: true,
    propose: true,
    edit: false,
    manage: false,
  });
  expect(
    await actor.access({ scope: 'project', scopeId: 'unregistered' }),
  ).toEqual({ read: false, propose: false, edit: false, manage: false });
});

test('lists empty catalog spaces, saves chunking before content, and searches all three spaces', async ({
  testApp,
  request,
}) => {
  const directoryPath = '/knowledgeDirectory';
  expect((await request(directoryPath)).status).toBe(401);
  expect((await request(`${directoryPath}/search?q=`)).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const list = async () => {
    const response = await admin.fetch(directoryPath);
    expect(response.status).toBe(200);
    return (await response.json()) as {
      data: {
        space: { id: string | null; scope: string; scopeId: string };
        documents: number;
      }[];
      meta: { total: number };
    };
  };
  const initial = await list();
  expect(initial.meta.total).toBe(3);
  expect(initial.data.map(({ space }) => space.scope)).toEqual([
    'default',
    'sales',
    'engineering',
  ]);
  expect(
    initial.data
      .filter(({ space }) => space.scope !== 'default')
      .every(({ space, documents }) => space.id === null && documents === 0),
  ).toBe(true);

  const override = { headingDepth: 2, target: 800, max: 1600 };
  const configured = await admin.fetch('/knowledge/chunking', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ scope: 'sales', scopeId: '', override }),
  });
  expect(configured.status).toBe(200);
  expect(
    (await list()).data.find(({ space }) => space.scope === 'sales')?.space.id,
  ).toEqual(expect.any(String));
  expect((await list()).data.map(({ documents }) => documents)).toEqual(
    initial.data.map(({ documents }) => documents),
  );

  for (const scope of ['default', 'sales', 'engineering']) {
    const response = await admin.fetch('/knowledge/docs', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...document,
        scope,
        title: `${scope} catalogfixture`,
        content: `# ${scope}\n\ncatalogfixture content`,
      }),
    });
    expect(response.status).toBe(201);
  }
  expect((await list()).data.map(({ documents }) => documents)).toEqual(
    initial.data.map(({ documents }) => documents + 1),
  );
  const response = await admin.fetch(
    `${directoryPath}/search?q=catalogfixture`,
  );
  expect(response.status).toBe(200);
  const result = (await response.json()) as {
    data: { scope: string }[];
  };
  expect(new Set(result.data.map(({ scope }) => scope))).toEqual(
    new Set(['default', 'sales', 'engineering']),
  );
  expect((await admin.fetch(`${directoryPath}/search?q=`)).status).toBe(400);
});

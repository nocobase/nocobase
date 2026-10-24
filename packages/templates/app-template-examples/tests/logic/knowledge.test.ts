// @vitest-environment node

import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { knowledgeAccessToken } from '@nocobase/app-plugin-knowledge/server';
import { DEFAULT_SPACE } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect, vi } from 'vitest';
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
  ).toBe(1);
  for (const scope of ['sales', 'engineering']) {
    expect(
      (await member.fetch(`/knowledge/spaces?scope=${scope}&scopeId=`)).status,
    ).toBe(400);
    expect(
      (
        await member.fetch('/knowledge/docs', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...document, scope }),
        })
      ).status,
    ).toBe(400);
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

test('recognizes only default while preserving documents from removed spaces', async ({
  testApp,
  request,
}) => {
  expect((await request('/knowledgeDirectory')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const resolver = testApp.application.container.resolve(knowledgeAccessToken);
  // Simulate the pre-upgrade catalog only while creating/reading legacy records.
  const legacyAccess = () => {
    const space = vi.spyOn(resolver, 'space').mockImplementation((ref) => ref);
    const reader = vi.spyOn(resolver, 'forReader').mockReturnValue({
      access: async () => ({
        read: true,
        propose: true,
        edit: true,
        manage: true,
      }),
    });
    return () => {
      space.mockRestore();
      reader.mockRestore();
    };
  };
  const legacy: { id: string; scope: string; content: string }[] = [];
  let restore = legacyAccess();
  try {
    for (const scope of ['sales', 'engineering']) {
      const content = `# Legacy\n\nretainedcatalogfixture ${scope}`;
      const response = await admin.fetch('/knowledge/docs', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...document, scope, content }),
      });
      expect(response.status).toBe(201);
      legacy.push({ ...(await response.json()).data, content });
    }
  } finally {
    restore();
  }

  const list = await admin.fetch('/knowledgeDirectory');
  expect(list.status).toBe(200);
  expect(await list.json()).toMatchObject({
    data: [{ space: { scope: 'default', scopeId: '' } }],
    meta: { total: 1 },
  });
  for (const old of legacy) {
    expect(resolver.space({ scope: old.scope, scopeId: '' })).toBeNull();
    expect(
      (await admin.fetch(`/knowledge/spaces?scope=${old.scope}&scopeId=`))
        .status,
    ).toBe(400);
    expect((await admin.fetch(`/knowledge/docs/${old.id}`)).status).toBe(404);
    expect(
      (
        await admin.fetch('/knowledge/docs', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...document, scope: old.scope }),
        })
      ).status,
    ).toBe(400);
  }
  const override = { headingDepth: 2, target: 800, max: 1600 };
  expect(
    (
      await admin.fetch('/knowledge/chunking', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...DEFAULT_SPACE, override }),
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await admin.fetch('/knowledge/docs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...document,
          content: '# Default\n\nretainedcatalogfixture default',
        }),
      })
    ).status,
  ).toBe(201);
  for (const path of [
    '/knowledgeDirectory/search?q=retainedcatalogfixture',
    '/knowledge/search?q=retainedcatalogfixture',
  ]) {
    const response = await admin.fetch(path);
    expect(response.status).toBe(200);
    const result = (await response.json()).data as { scope: string }[];
    expect(result.length).toBeGreaterThan(0);
    expect(new Set(result.map((hit) => hit.scope))).toEqual(
      new Set(['default']),
    );
  }
  // Registration removal is reversible; no historical row was deleted or rewritten.
  restore = legacyAccess();
  try {
    for (const old of legacy) {
      const response = await admin.fetch(`/knowledge/docs/${old.id}`);
      expect(response.status).toBe(200);
      expect((await response.json()).data.content).toBe(old.content);
    }
  } finally {
    restore();
  }
  expect((await admin.fetch('/knowledgeDirectory/search?q=')).status).toBe(400);
});

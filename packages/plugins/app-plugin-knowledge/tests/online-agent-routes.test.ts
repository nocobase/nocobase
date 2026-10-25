// @vitest-environment node
import { createAppTest } from '@nocobase/app-testing/server';
import { ONLINE_AGENT_CREDENTIAL } from '@nocobase/app-plugin-agents/server/tokens';
import { createClaimedRun } from '../../app-plugin-agents/tests/helpers/claimed-run.js';
import { expect, vi } from 'vitest';
import { createStandaloneServer } from './fixtures/indexing-app/server/standalone.js';
import { knowledgeAgentFixture } from './helpers/online-agent.js';

const test = createAppTest({
  scope: 'test',
  createServer: createStandaloneServer,
});

test('ticket redemption stays ahead of the production session guard and passes only its bearer credential', async ({
  app,
  fetch,
  request,
}) => {
  const f = await knowledgeAgentFixture(app, fetch);
  const session = vi
    .spyOn(f.auth, 'getSession')
    .mockRejectedValue(
      new Error('Ticket redemption must not read session authentication.'),
    );
  const redeem = vi.spyOn(f.knowledge.proposals, 'redeem');
  const response = await request('/knowledge/tickets/missing-ticket/redeem', {
    method: 'POST',
    headers: {
      authorization: 'Bearer fixture-ticket',
      'content-type': 'application/octet-stream',
    },
    body: 'fixture bytes',
  });
  expect(response.status).toBe(401);
  expect(JSON.stringify(await response.json())).toContain('INVALID_TICKET');
  expect(session).not.toHaveBeenCalled();
  expect(redeem).toHaveBeenCalledWith(
    'missing-ticket',
    'fixture-ticket',
    expect.any(File),
  );
});
test('production required/guard admits only native execution reads and preserves personal ACL', async ({
  app,
  fetch,
  request,
}) => {
  const f = await knowledgeAgentFixture(app, fetch);
  expect((await request('/knowledge/search?q=Release')).status).toBe(401);
  expect(
    (
      await request(`/knowledge/docs/${f.hidden.id}`, {
        headers: { cookie: f.cookie },
      })
    ).status,
  ).toBe(404);
  expect(
    (
      await request(`/knowledge/docs/${f.documents[0]!.id}`, {
        headers: { cookie: f.cookie },
      })
    ).status,
  ).toBe(200);
  const session = f.context.credentials;
  if (!session) throw new Error('Missing fixture session');
  const getSession = vi.spyOn(f.auth, 'getSession');
  const reader = vi.spyOn(f.knowledge.docs, 'searchAll');
  const document = await app.container
    .resolve((await import('@nocobase/app-server/router')).apiDocsToken)
    .getDocument();
  const operations = Object.values(document.paths ?? {}).flatMap((path) =>
    Object.values(path ?? {}).filter(
      (value) => value && typeof value === 'object' && 'operationId' in value,
    ),
  );
  expect(
    operations
      .filter(
        (operation) =>
          'security' in operation &&
          JSON.stringify(operation.security).includes('runToken'),
      )
      .filter((operation) =>
        String(operation.operationId).startsWith('knowledge'),
      )
      .map((operation) => operation.operationId)
      .sort(),
  ).toEqual(['knowledgeGetDoc', 'knowledgeSearchDocs']);
  expect(
    document.paths?.['/api/knowledge/search']?.get?.['x-cli'],
  ).toMatchObject({ command: 'kb search', identities: ['person'] });
  for (const operation of [
    document.paths?.['/api/knowledge/search']?.get,
    document.paths?.['/api/knowledge/docs/{docId}']?.get,
  ]) {
    expect(operation?.security).toEqual([
      { cookieAuth: [] },
      { apiKeyAuth: [] },
      { runToken: [] },
    ]);
    expect(operation?.['x-cli']).not.toHaveProperty('action');
    expect(operation?.['x-cli']).toMatchObject({ identities: ['person'] });
  }
  const native = {
    ...session,
    credential: {
      type: ONLINE_AGENT_CREDENTIAL,
      scheme: 'runToken',
      id: 'execution-fixture',
      userId: f.user.id,
    },
  };
  try {
    getSession.mockResolvedValue(native);
    const response = await request(
      '/knowledge/search?q=Release&userId=admin&actor=admin',
    );
    expect(response.status).toBe(200);
    expect(reader).toHaveBeenLastCalledWith(
      {
        userId: f.user.id,
        actor: { kind: 'online-agent', id: 'execution-fixture' },
      },
      'Release',
      expect.any(Object),
    );
    for (const [method, path] of [
      ['GET', '/knowledge/spaces?scope=project&scopeId=one'],
      ['POST', '/knowledge/docs'],
      ['PATCH', `/knowledge/docs/${f.documents[0]!.id}`],
      ['DELETE', `/knowledge/docs/${f.documents[0]!.id}`],
      ...['permissions', 'index', 'file', 'versions', 'access'].map(
        (suffix) => ['GET', `/knowledge/docs/${f.documents[0]!.id}/${suffix}`],
      ),
      ['POST', `/knowledge/docs/${f.documents[0]!.id}/reindex`],
      ['GET', '/knowledge/indexing/settings'],
      ['GET', '/knowledge/proposals?scope=project&scopeId=one'],
    ])
      expect(
        (
          await request(path!, {
            method,
            headers: { 'content-type': 'application/json' },
          })
        ).status,
        `${method} ${path}`,
      ).toBe(403);
    for (const type of ['run', 'other-issued']) {
      getSession.mockResolvedValue({
        ...native,
        credential: { ...native.credential, type },
      });
      expect((await request('/knowledge/search?q=Release')).status).toBe(403);
      expect(
        (await request(`/knowledge/docs/${f.documents[0]!.id}`)).status,
      ).toBe(403);
    }
    getSession.mockResolvedValue({
      ...session,
      user: { ...session.user, kind: 'service' },
    });
    expect((await request('/knowledge/search?q=Release')).status).toBe(403);
    getSession.mockResolvedValue(session);
    const stop = f.auth.addScopedCredentialCheck(() => true);
    try {
      expect((await request('/knowledge/search?q=Release')).status).toBe(403);
    } finally {
      stop();
    }
    expect((await request('/knowledge/search?q=Release')).status).toBe(200);
  } finally {
    getSession.mockRestore();
  }
});

test('a genuinely claimed fgr Run authenticates but cannot discover or read Knowledge', async ({
  app,
  fetch,
  request,
}) => {
  const f = await knowledgeAgentFixture(app, fetch);
  const { payload } = await createClaimedRun(f.agents, f.user.id);
  const token = payload.cli.credential.content.token;
  if (typeof token !== 'string') throw new Error('Missing fixture Run token.');
  expect(token.startsWith('fgr_')).toBe(true);
  const headers = { 'x-nocobase-run-token': token };
  const session = await f.auth.getSession(new Headers(headers));
  expect(session).toMatchObject({
    user: { id: f.user.id },
    credential: { type: 'run', scheme: 'runToken' },
  });
  const manifest = await request('/cli/manifest', { headers });
  expect(manifest.status).toBe(200);
  const data = (await manifest.json()).data;
  expect(data.identity.kind).toBe('run');
  expect(
    data.commands.some((command: { id: string }) =>
      command.id.startsWith('kb:'),
    ),
  ).toBe(false);
  for (const path of [
    '/knowledge/search?q=Release',
    `/knowledge/docs/${f.documents[0]!.id}`,
  ]) {
    expect((await request(path, { headers })).status).toBe(403);
  }
  const person = await request('/cli/manifest', {
    headers: { cookie: f.cookie },
  });
  expect(person.status).toBe(200);
  expect(
    (await person.json()).data.commands.map(
      (command: { id: string }) => command.id,
    ),
  ).toEqual(expect.arrayContaining(['kb:search', 'kb:read']));
});

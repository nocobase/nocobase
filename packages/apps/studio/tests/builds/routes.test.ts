// @vitest-environment node
/**
 * CI's build routes (`server/builds/routes.ts`), the commands `build status`, `app ensure`, `deploy` and `release
 * upload`: a person and a scoped API key reach them, the key acting as a key within its scope's level; an agent's run
 * token does not.
 */
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { bindingOf, tokenConnection } from '../git/helpers.js';
import { createArtifact } from '../releases/fixtures.js';

const REPO = 'acme/shop';
const MAIN = 'c3'.repeat(20);

let h: BridgeHarness;
let dir: string;

const build = { appId: 'web', sha: MAIN } as const;
/** A scoped API key of `ci`, at `level` on release management's Apps. */
const key = (level: 'read' | 'write' | 'admin') => ({
  user: 'ci',
  headers: {
    'x-test-key-scope': JSON.stringify({ 'releases.apps': { level } }),
  },
});

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'studio-build-routes-'));
  h = await createBridgeHarness({ releases: true, previews: true });
  for (const id of ['alice', 'ci']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  h.roles.set('ci', 'admin');
  await h.releases!.environments.create(SYSTEM_CALLER, {
    id: 'staging',
    name: 'Staging',
    driver: 'fake',
    config: {},
  });
  await h.releases!.releases.createApp(
    { userId: 'alice', kind: 'human', permissions: allPermissions() },
    { id: 'web', name: 'Web', environmentId: 'staging' },
  );
  const project = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Shop',
  });
  const repo = await h.projects.projects.addResource(
    h.viewer('alice'),
    project.id,
    {
      type: 'gitRepo',
      url: `https://github.com/${REPO}.git`,
      defaultRef: 'main',
      binding: bindingOf(await tokenConnection(h), REPO),
    } as never,
  );
  h.github.addRepo(REPO);
  h.github.pushCommits(REPO, 'main', MAIN);
  await h.links!.save(
    {
      userId: 'alice',
      permissions: { scopes: h.viewer('alice').permissions.scopes },
    },
    repo.id,
    { apps: [{ appId: 'web', role: 'staging', previewEnvironmentId: null }] },
  );
});

afterEach(async () => {
  await h.close();
  rmSync(dir, { recursive: true, force: true });
});

async function runToken(actions: readonly string[]): Promise<string> {
  const agentId = await h.createAgent({ actions: [...actions] });
  const conversation = await h.agents.conversations.create('alice', {
    agentId,
  });
  await h.agents.conversations.send('alice', conversation.id, {
    content: 'Ship it.',
  });
  const payload = await h.claimOne();
  return payload.cli.credential.content.token as string;
}

describe('CI’s build routes', () => {
  it('reports, uploads through a ticket and deploys with a scoped key, which acts as a key', async () => {
    const reported = await h.request('POST', '/builds/report', {
      ...key('write'),
      body: { ...build, state: 'building' },
    });
    expect(reported.status).toBe(200);
    expect(reported.body).toMatchObject({
      data: { appId: 'web', state: 'building', ref: 'main' },
      meta: { message: `web at ${MAIN.slice(0, 12)}: building.` },
    });

    const ticketed = await h.request('POST', '/builds/uploadTickets', {
      ...key('write'),
      body: build,
    });
    expect(ticketed.status).toBe(201);
    const ticket = ticketed.body.data;
    expect(ticket).toMatchObject({ method: 'POST' });
    expect(ticket.url).toMatch(/^\/api\/builds\/[^/]+\/uploadArtifact$/u);
    const { bytes } = await createArtifact(dir, '1.0.0');
    const uploaded = await h.request(
      'POST',
      ticket.url.replace(/^\/api/u, ''),
      {
        raw: new Uint8Array(bytes),
        headers: {
          ...ticket.headers,
          'content-type': 'application/octet-stream',
        },
      },
    );
    expect(uploaded.status).toBe(200);
    const releaseId = uploaded.body.data.release.id as string;
    expect(uploaded.body.meta.message).toContain(`Release ${releaseId}`);

    // `write` uploads, but only `admin` deploys.
    const refused = await h.request('POST', '/builds/deploy', {
      ...key('write'),
      body: { appId: 'web', releaseId },
    });
    expect(refused.status).toBe(403);
    const deployed = await h.request('POST', '/builds/deploy', {
      ...key('admin'),
      body: { appId: 'web', releaseId },
    });
    expect(deployed.status).toBe(200);
    expect(deployed.body.data).toMatchObject({ appId: 'web', request: null });
    expect(deployed.body.meta.message).toMatch(/^Deployment \S+ of web/u);
    expect(
      await h.releases!.releases.waitForDeployment(
        deployed.body.data.deployment.id,
      ),
    ).toMatchObject({ status: 'succeeded', actorKind: 'key' });
  });

  it('makes sure of an App, and uploads and deploys an archive through one ticket', async () => {
    // A person who may create Apps makes it (a key scoped to Apps never does).
    const made = await h.request('POST', '/builds/apps/web-next/ensure', {
      user: 'alice',
      body: { environmentId: 'staging', repository: REPO },
    });
    expect(made.status).toBe(200);
    expect(made.body).toMatchObject({
      data: { appId: 'web-next', environmentId: 'staging', created: true },
      meta: { message: 'Created web-next in staging.' },
    });
    const again = await h.request('POST', '/builds/apps/web-next/ensure', {
      ...key('admin'),
      body: { environmentId: 'staging' },
    });
    expect(again.body.data).toMatchObject({ created: false });

    const ticketed = await h.request('POST', '/builds/deploy', {
      ...key('admin'),
      body: { appId: 'web-next', sha: MAIN, file: 'dist.tar.gz' },
    });
    expect(ticketed.status).toBe(200);
    const ticket = ticketed.body.data;
    expect(ticket.url).toMatch(/^\/api\/builds\/[^/]+\/uploadArtifact$/u);
    const { bytes } = await createArtifact(dir, '2.0.0');
    const uploaded = await h.request(
      'POST',
      ticket.url.replace(/^\/api/u, ''),
      {
        raw: new Uint8Array(bytes),
        headers: {
          ...ticket.headers,
          'content-type': 'application/octet-stream',
        },
      },
    );
    expect(uploaded.status).toBe(200);
    expect(uploaded.body.data.deployed).toMatchObject({
      appId: 'web-next',
      request: null,
    });
    expect(uploaded.body.meta.message).toMatch(/Deployment \S+ of web-next/u);
    // A ticket for an upload alone deploys nothing, and a forged one is refused.
    const forged = await h.request('POST', ticket.url.replace(/^\/api/u, ''), {
      raw: new Uint8Array(bytes),
      headers: {
        authorization: `${ticket.headers.authorization}x`,
        'content-type': 'application/octet-stream',
      },
    });
    expect(forged.status).toBe(401);
  });

  it('refuses a key that only reads, and verifies the commit for a person', async () => {
    const reading = await h.request('POST', '/builds/report', {
      ...key('read'),
      body: { ...build, state: 'building' },
    });
    expect(reading.status).toBe(403);
    const person = await h.request('POST', '/builds/uploadTickets', {
      user: 'alice',
      body: { ...build, sha: 'f'.repeat(40) },
    });
    expect(person.status).toBe(400);
    expect(person.body.error.reason).toBe('COMMIT_NOT_VERIFIED');
    const unsigned = await h.request('POST', '/builds/report', {
      body: { ...build, state: 'building' },
    });
    expect(unsigned.status).toBe(401);
  });

  it('does not take an agent’s run token, whatever its actions', async () => {
    const token = await runToken([
      'rel.apps/view',
      'rel.apps/upload',
      'rel.apps/deploy',
    ]);
    for (const [route, body] of [
      ['/builds/report', { ...build, state: 'building' }],
      ['/builds/uploadTickets', build],
      ['/builds/deploy', { appId: 'web', releaseId: 'r' }],
      ['/builds/apps/web/ensure', { environmentId: 'staging' }],
    ] as const) {
      const answer = await h.request('POST', route, { runToken: token, body });
      expect(answer.status).toBe(403);
      expect(answer.body.error.reason).toBe('CREDENTIAL_NOT_ACCEPTED');
    }
  });

  it('is offered to a person, and not to a run', async () => {
    const commands = (await h.manifest({ user: 'alice' })).commands.map(
      (command) => command.id,
    );
    expect(commands).toEqual(
      expect.arrayContaining([
        'build:status',
        'app:ensure',
        'release:upload',
        'deploy',
        'deploy:request:approve',
        'env:create',
        'registry:list',
      ]),
    );
    const run = await runToken(['rel.apps/view', 'rel.apps/deploy']);
    const offered = (await h.manifest({ runToken: run })).commands.map(
      (command) => command.id,
    );
    expect(offered).toEqual(expect.arrayContaining(['app:deploy']));
    expect(offered).not.toContain('deploy');
    expect(offered).not.toContain('release:upload');
  });
});

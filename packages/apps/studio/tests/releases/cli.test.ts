// @vitest-environment node
/**
 * The `nb-studio` CLI's release commands, with release management on an in-memory driver: a person runs the real CLI
 * against release management's routes and Studio's build routes (`x-cli`), uploading a release (the archive streamed to
 * a one-time upload ticket, never through the command gateway), deploying and reading it back, and registering an
 * image CI pushed as a release a Docker environment runs; an agent's run calls the routes within its actions, and
 * never deploys directly to a protected environment.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  runStudioCli,
  type StudioCliResult,
} from '../fixtures/nb-studio-cli.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { bindingOf, tokenConnection } from '../git/helpers.js';
import { checksumOf, createArtifact } from './fixtures.js';

let h: BridgeHarness;
let dir: string;
let server: Server | undefined;
/** Paths the HTTP server saw, with how large their bodies were. */
let seen: { path: string; size: number }[];

beforeEach(async () => {
  h = await createBridgeHarness({ releases: true, previews: true });
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  dir = mkdtempSync(path.join(os.tmpdir(), 'studio-release-cli-'));
  seen = [];
  const releases = h.releases!;
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'preview',
    name: 'Preview',
    driver: 'fake',
  });
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'production',
    name: 'Production',
    driver: 'fake',
    protected: true,
  });
});

afterEach(async () => {
  await new Promise((resolve) =>
    server ? server.close(resolve) : resolve(null),
  );
  server = undefined;
  rmSync(dir, { recursive: true, force: true });
  await h.close();
});

/** The harness's API under `/api` on a local port; a personal API key stands for its user. */
async function serve(): Promise<string> {
  const outer = new Hono();
  outer.route('/api', h.app);
  server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks);
    seen.push({ path: req.url ?? '', size: body.length });
    const headers = req.headers as Record<string, string>;
    if (headers['x-api-key']) headers['x-test-user'] = headers['x-api-key'];
    const response = await outer.fetch(
      new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers,
        ...(body.length > 0 ? { body } : {}),
      }),
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No port.');
  return `http://127.0.0.1:${address.port}`;
}

function studio(
  args: readonly string[],
  env: Readonly<Record<string, string>> = {},
): Promise<StudioCliResult> {
  return runStudioCli(args, {
    cwd: dir,
    env: {
      NB_STUDIO_HOME: path.join(dir, '.home'),
      NB_STUDIO_KEYCHAIN: 'off',
      ...env,
    },
  });
}

async function signIn(user: string): Promise<void> {
  const origin = await serve();
  mkdirSync(path.join(dir, '.home'), { recursive: true });
  writeFileSync(
    path.join(dir, '.home', 'config.json'),
    JSON.stringify({
      server: origin,
      auth: { kind: 'apiKey', storage: 'file', key: user },
    }),
  );
}

describe('a person’s release commands', () => {
  it('creates an App and, as CI, reports and uploads a verified staging build through a ticket, deploys it and reads it back', async () => {
    await signIn('alice');
    const created = await studio([
      'app',
      'create',
      'crm',
      '--env',
      'preview',
      '--name',
      'CRM',
      '--json',
    ]);
    expect(created.stderr).toBe('');
    expect(created.code).toBe(0);
    // The repository building it, on the GitHub stand-in, with the commit on its default branch.
    const sha = '0123456789abcdef0123456789abcdef01234567';
    const project = await h.projects.projects.create(h.viewer('alice'), {
      name: 'CRM',
    });
    const resource = await h.projects.projects.addResource(
      h.viewer('alice'),
      project.id,
      {
        type: 'gitRepo',
        url: 'https://github.com/acme/crm.git',
        defaultRef: 'main',
        binding: bindingOf(await tokenConnection(h), 'acme/crm'),
      } as never,
    );
    h.github.pushCommits('acme/crm', 'main', sha);
    await h.links!.save(
      {
        userId: 'alice',
        permissions: { scopes: h.viewer('alice').permissions.scopes },
      },
      resource.id,
      { apps: [{ appId: 'crm', role: 'staging', previewEnvironmentId: null }] },
    );

    // A GitHub Actions push: the CLI reads the repository and the commit from the run.
    const ci = { GITHUB_REPOSITORY: 'acme/crm', GITHUB_SHA: sha };
    const flags = ['--app', 'crm'];
    const status = await studio(
      [
        'build',
        'status',
        ...flags,
        '--state',
        'building',
        '--logs',
        'https://github.com/acme/crm/actions/runs/1',
        '--json',
      ],
      ci,
    );
    expect(status.stderr).toBe('');
    expect(JSON.parse(status.stdout).result.data).toMatchObject({
      state: 'building',
      ref: 'main',
    });
    const { file, bytes } = await createArtifact(dir, '1.2.0');
    const uploaded = await studio(
      ['release', 'upload', ...flags, '--file', path.basename(file), '--json'],
      ci,
    );
    expect(uploaded.stderr).toBe('');
    expect(uploaded.code).toBe(0);
    const answer = JSON.parse(uploaded.stdout).result.data;
    expect(answer).toMatchObject({
      reused: false,
      build: { state: 'succeeded', sha, ref: 'main' },
      release: {
        appId: 'crm',
        version: '1.2.0',
        checksum: checksumOf(bytes),
        // What deployment marks read the deployed commit from.
        labels: { sha, ref: 'main' },
      },
    });
    // The ticket request carried only its flags; the archive went to the ticket's upload endpoint.
    const command = seen.find((entry) =>
      entry.path.startsWith('/api/builds/uploadTickets'),
    );
    expect(command?.size).toBeLessThan(200);
    expect(seen).toContainEqual({
      path: `/api/builds/${answer.build.id}/uploadArtifact`,
      size: bytes.length,
    });
    // A commit that is not the repository's is refused before anything is uploaded; the flag wins over the run's.
    const stray = await studio(
      [
        'release',
        'upload',
        '--app',
        'crm',
        '--sha',
        'f'.repeat(40),
        '--file',
        path.basename(file),
      ],
      ci,
    );
    expect(stray.code).not.toBe(0);
    // oclif wraps the message, with a margin on each line.
    expect(stray.stderr.replace(/\s*›?\s+/gu, ' ')).toContain(
      'is not a commit of the repository',
    );

    // Uploading again prints the release CI deploys, and stores nothing.
    const again = await studio(
      ['release', 'upload', ...flags, '--file', path.basename(file)],
      ci,
    );
    expect(again.stdout.trim()).toBe(
      `Release ${answer.release.id}: the build of crm at ${sha.slice(0, 12)} was uploaded before.`,
    );
    // Uploading deployed nothing: CI deploys it, at once where the environment needs no approval.
    expect(
      (await h.releases!.releases.listDeployments(SYSTEM_CALLER, 'crm')).total,
    ).toBe(0);
    // A release ignores the run's commit.
    const deployed = await studio(
      ['deploy', '--app', 'crm', '--release', answer.release.id, '--json'],
      ci,
    );
    expect(deployed.stderr).toBe('');
    const outcome = JSON.parse(deployed.stdout).result.data;
    expect(outcome).toMatchObject({ appId: 'crm', request: null });
    await h.releases!.releases.waitForDeployment(outcome.deployment.id);
    const app = await studio(['app', 'get', 'crm', '--json']);
    expect(JSON.parse(app.stdout).result.data).toMatchObject({
      app: { id: 'crm' },
      runtime: { state: 'running' },
      currentVersion: '1.2.0',
    });
    const listed = await studio(['deploy', 'list', 'crm']);
    expect(listed.code).toBe(0);
    expect(listed.stdout).toContain('succeeded');

    // CI's three steps for another App: made where it runs, then uploaded and deployed in one command.
    const ensured = await studio(
      ['app', 'ensure', 'crm-next', '--environment', 'preview', '--json'],
      ci,
    );
    expect(ensured.stderr).toBe('');
    expect(JSON.parse(ensured.stdout).result.data).toEqual({
      appId: 'crm-next',
      environmentId: 'preview',
      created: true,
    });
    const shipped = await studio(
      ['deploy', '--app', 'crm-next', '--file', path.basename(file), '--json'],
      ci,
    );
    expect(shipped.stderr).toBe('');
    expect(shipped.code).toBe(0);
    const received = JSON.parse(shipped.stdout).result.data;
    expect(received).toMatchObject({
      release: { appId: 'crm-next', checksum: checksumOf(bytes) },
      deployed: { appId: 'crm-next', request: null },
    });
    // The same bytes crm holds of the commit: promoted, not stored again.
    expect(received.release.sourceReleaseId).toBe(answer.release.id);
    await h.releases!.releases.waitForDeployment(
      received.deployed.deployment.id,
    );
    const releases = await studio(['release', 'list', 'crm', '--json']);
    expect(JSON.parse(releases.stdout).result.data).toMatchObject([
      { version: '1.2.0' },
    ]);
  });

  it('registers an image CI pushed as a release and deploys it to an environment that runs images', async () => {
    await signIn('alice');
    const releases = h.releases!;
    await releases.environments.create(SYSTEM_CALLER, {
      id: 'docker',
      name: 'Docker',
      driver: 'fake',
      config: { images: true },
    });
    await releases.releases.createApp(await releases.callerForUser('alice'), {
      id: 'shop',
      name: 'Shop',
      environmentId: 'docker',
    });
    const digest = `sha256:${'d'.repeat(64)}`;
    const registered = await studio([
      'release',
      'image',
      'shop',
      '--version',
      '3.1.0',
      '--ref',
      'registry.test/acme/shop:3.1.0',
      '--digest',
      digest,
      '--commit',
      '0123456789abcdef',
      '--label',
      'sha=0123456789abcdef',
      '--deploy',
      '--json',
    ]);
    expect(registered.stderr).toBe('');
    expect(registered.code).toBe(0);
    const release = JSON.parse(registered.stdout).result.data;
    expect(release).toMatchObject({
      appId: 'shop',
      kind: 'image',
      version: '3.1.0',
      reused: false,
      labels: { sha: '0123456789abcdef' },
      artifacts: [
        {
          kind: 'oci-image',
          ref: 'registry.test/acme/shop',
          digest,
          platform: 'linux/amd64',
        },
      ],
    });
    expect(
      await releases.releases.waitForDeployment(release.deploymentId),
    ).toMatchObject({
      status: 'succeeded',
      artifact: { kind: 'image', digest },
    });
    expect(h.driver!.applied.at(-1)?.images).toEqual([
      { ref: 'registry.test/acme/shop', digest, platform: 'linux/amd64' },
    ]);
    // The same push again names the same release; an archive does not run there.
    const again = await studio([
      'release',
      'image',
      'shop',
      '--version',
      '3.1.0',
      '--ref',
      'registry.test/acme/shop',
      '--digest',
      digest,
      '--json',
    ]);
    expect(JSON.parse(again.stdout).result.data).toMatchObject({
      id: release.id,
      reused: true,
    });
    const { bytes } = await createArtifact(dir, '3.2.0');
    const archive = await h.releases!.releases.uploadRelease(
      await h.releases!.callerForUser('alice'),
      'shop',
      { stream: [bytes] as never },
    );
    const refused = await studio([
      'app',
      'deploy',
      'shop',
      '--release',
      archive.id,
    ]);
    expect(refused.code).not.toBe(0);
    expect(refused.stderr).toContain('release image');
  });

  it('turns a person’s deployment to a protected environment into a request that waits for approval', async () => {
    await signIn('alice');
    const releases = h.releases!;
    const alice = await releases.callerForUser('alice');
    await releases.releases.createApp(alice, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'production',
    });
    const { bytes } = await createArtifact(dir, '2.0.0');
    const release = await releases.releases.uploadRelease(alice, 'shop', {
      stream: [bytes] as never,
    });
    // Nothing deploys there directly.
    const refused = await studio([
      'app',
      'deploy',
      'shop',
      '--release',
      release.id,
    ]);
    expect(refused.code).not.toBe(0);
    expect(refused.stderr).toContain('APPROVAL_REQUIRED');
    // `nb-studio deploy` asks instead, and succeeds with the pending request.
    const asked = await studio([
      'deploy',
      '--app',
      'shop',
      '--release',
      release.id,
      '--json',
    ]);
    expect(asked.code).toBe(0);
    const envelope = JSON.parse(asked.stdout);
    expect(envelope).toMatchObject({ ok: true, status: 'success' });
    expect(envelope.result.data).toMatchObject({
      appId: 'shop',
      deployment: null,
      request: { status: 'pending' },
    });
    expect(envelope.result.meta.message).toContain('waits for approval');
    expect(
      (
        await releases.requests.get(
          SYSTEM_CALLER,
          envelope.result.data.request.id,
        )
      ).status,
    ).toBe('pending');
  });
});

describe('an App’s configuration through the CLI', () => {
  it('shows secrets masked, and keeps them when the masked file is saved back', async () => {
    await signIn('alice');
    const releases = h.releases!;
    const alice = await releases.callerForUser('alice');
    await releases.releases.createApp(alice, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'preview',
    });
    const { bytes } = await createArtifact(dir, '1.0.0');
    const release = await releases.releases.uploadRelease(alice, 'shop', {
      stream: [bytes] as never,
    });
    const password = 'Preview-Admin-Pass-42';
    const deployment = await releases.releases.deploy(alice, 'shop', {
      releaseId: release.id,
      config: {
        mode: 'file',
        content: `app:\n  title: Shop\nusers:\n  initialAdmin:\n    username: admin\n    password: ${password}\n`,
      },
    });
    await releases.releases.waitForDeployment(deployment.id);
    const runtime = () => {
      const config = h.driver!.running.get('shop')?.config;
      return config?.mode === 'file' ? config.content : '';
    };
    expect(runtime()).toContain(password);
    const key = /key: (\S+)/u.exec(runtime())?.[1];
    expect(key).toBeTruthy();

    const shown = await studio(['app', 'config', 'get', 'shop', '--json']);
    expect(shown.stderr).toBe('');
    expect(shown.stdout).not.toContain(password);
    expect(shown.stdout).not.toContain(key);
    const document = (
      JSON.parse(shown.stdout) as {
        result: { data: { content: string; secrets: { path: string[] }[] } };
      }
    ).result.data;
    expect(document.secrets.map((secret) => secret.path.join('.'))).toEqual([
      'users.initialAdmin.password',
      'secrets.keys.0.key',
      'auth.secret',
      'session.secret',
    ]);

    // Saving the masked file with an edit keeps the secrets; the next deployment carries them.
    writeFileSync(
      path.join(dir, 'config.yml'),
      document.content.replace('title: Shop', 'title: Store'),
    );
    const saved = await studio([
      'app',
      'config',
      'set',
      'shop',
      '--content-file',
      'config.yml',
      '--json',
    ]);
    expect(saved.stderr).toBe('');
    expect(saved.stdout).not.toContain(password);
    const again = await releases.releases.deploy(alice, 'shop', {
      releaseId: release.id,
    });
    await releases.releases.waitForDeployment(again.id);
    expect(runtime()).toContain('title: Store');
    expect(runtime()).toContain(`password: ${password}`);
    expect(runtime()).toContain(`key: ${key}`);
  });
});

describe('an agent’s release commands', () => {
  async function run(actions: readonly string[]) {
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
  it('deploys to an unprotected environment within its actions, and never to a protected one', async () => {
    const releases = h.releases!;
    const alice = await releases.callerForUser('alice');
    for (const [id, environmentId] of [
      ['crm', 'preview'],
      ['shop', 'production'],
    ] as const)
      await releases.releases.createApp(alice, {
        id,
        name: id,
        environmentId,
      });
    const { bytes } = await createArtifact(dir, '3.0.0');
    const crm = await releases.releases.uploadRelease(alice, 'crm', {
      stream: [bytes] as never,
    });
    const shop = await releases.releases.uploadRelease(alice, 'shop', {
      stream: [bytes] as never,
    });

    const viewer = await run(['rel.apps/view']);
    expect(
      (
        await h.request('GET', '/releases/apps', { runToken: viewer })
      ).body.data.map((app: { app: { id: string } }) => app.app.id),
    ).toEqual(expect.arrayContaining(['crm', 'shop']));
    // Not configured to deploy: refused.
    expect(
      (
        await h.request('POST', '/releases/apps/crm/deploy', {
          runToken: viewer,
          body: { releaseId: crm.id },
        })
      ).status,
    ).toBe(403);

    const deployer = await run(['rel.apps/view', 'rel.apps/deploy']);
    const deployed = await h.request('POST', '/releases/apps/crm/deploy', {
      runToken: deployer,
      body: { releaseId: crm.id },
    });
    expect(deployed.status).toBe(202);
    expect(
      await releases.releases.waitForDeployment(deployed.body.data.id),
    ).toMatchObject({
      status: 'succeeded',
      actorKind: 'agent',
      actorId: 'alice',
    });
    const protectedDeploy = await h.request(
      'POST',
      '/releases/apps/shop/deploy',
      { runToken: deployer, body: { releaseId: shop.id } },
    );
    expect(protectedDeploy.status).toBe(400);
    expect(protectedDeploy.body.error.reason).toBe('APPROVAL_REQUIRED');
    // Deleting is a person's route only.
    const removed = await h.request(
      'DELETE',
      '/releases/apps/crm?confirm=crm',
      {
        runToken: deployer,
      },
    );
    expect(removed.status).toBe(403);
    expect(removed.body.error.reason).toBe('CREDENTIAL_NOT_ACCEPTED');
  });
});

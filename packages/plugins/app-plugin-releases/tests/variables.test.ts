// @vitest-environment node
/**
 * Deployment variables: the manifest a build declares, values per environment and per App, how a deployment resolves
 * them (and refuses one missing a required variable), what it generates, the first administrator, sample data on a
 * first deployment, and what counts as changed.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import {
  resolveVariables,
  type StoredAppVariable,
  type StoredEnvironmentVariable,
} from '../server/services/variables.js';
import type { ReleaseVariablesManifest } from '../shared/releases.js';
import {
  createApiServer,
  createArtifact,
  createHarness,
  streamOf,
  type Harness,
} from './harness.js';

const variable = (
  name: string,
  rest: Partial<ReleaseVariablesManifest['variables'][number]> = {},
) => ({
  name,
  secret: false,
  required: false,
  firstStartOnly: false,
  generate: null,
  ...rest,
});

const MANIFEST: ReleaseVariablesManifest = {
  schemaVersion: 1,
  app: { name: 'shop', version: '1.0.0' },
  variables: [
    variable('SECRETS_KEYS', {
      path: 'secrets.keys',
      secret: true,
      generate: 'secretKeys',
    }),
    variable('AUTH_SECRET', {
      path: 'auth.secret',
      secret: true,
      generate: 'secret',
    }),
    variable('APP_PUBLIC_ORIGIN', { path: 'app.publicOrigin' }),
    variable('APP_SAMPLE_DATA', {
      path: 'app.sampleData',
      type: 'boolean',
      firstStartOnly: true,
    }),
    variable('INITIAL_ADMIN_USERNAME', {
      path: 'users.initialAdmin.username',
      firstStartOnly: true,
    }),
    variable('INITIAL_ADMIN_PASSWORD', {
      path: 'users.initialAdmin.password',
      secret: true,
      firstStartOnly: true,
      generate: 'password',
    }),
    variable('SMTP_PASSWORD', {
      path: 'notification.smtp.password',
      secret: true,
      required: true,
      description: 'The SMTP password.',
    }),
    variable('DB_HOST', {
      path: 'database.connections.main.host',
      hasDefault: true,
    }),
    variable('APP_BASE_PATH', { runtime: true }),
  ],
};

const TEMPLATE = `secrets:
  keys:
    - version: 1
      key: replace-with-a-unique-secret
users:
  initialAdmin:
    username: nocobase
    email: admin@nocobase.com
    password: admin123
`;

describe('variables', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
  });
  afterEach(async () => {
    await harness.close();
  });

  async function upload(
    version = '1.0.0',
    manifest: unknown = MANIFEST,
    appId = 'shop',
  ) {
    const admin = await harness.as('admin', 'admin');
    if (!(await harness.services.releases.findApp(appId)))
      await harness.services.releases.createApp(admin, {
        id: appId,
        name: 'Shop',
        environmentId: 'staging',
      });
    const artifact = await createArtifact(harness.rootDir, version, {
      configTemplate: TEMPLATE,
      variables: manifest,
    });
    const release = await harness.services.releases.uploadRelease(
      admin,
      appId,
      { stream: streamOf(artifact.bytes) },
    );
    return { admin, release };
  }

  async function deploy(releaseId: string, appId = 'shop') {
    const admin = await harness.as('admin', 'admin');
    const deployment = await harness.services.releases.deploy(admin, appId, {
      releaseId,
    });
    return await harness.services.releases.waitForDeployment(deployment.id);
  }

  const lastEnv = () => harness.fake.applied.at(-1)?.env ?? {};

  it('keeps the manifest the archive carries and refuses a deployment missing a required variable', async () => {
    const { admin, release } = await upload();
    expect(
      (
        await harness.services.releases.readReleaseVariables(
          admin,
          'shop',
          release.id,
        )
      )?.variables.map((item) => item.name),
    ).toContain('SMTP_PASSWORD');
    const [listed] = await harness.services.releases.listReleases(
      admin,
      'shop',
    );
    expect(listed?.variables).toEqual({
      declared: 8,
      required: 1,
      missing: ['SMTP_PASSWORD'],
    });
    await expect(
      harness.services.releases.deploy(admin, 'shop', {
        releaseId: release.id,
      }),
    ).rejects.toMatchObject({
      reason: 'VARIABLES_MISSING',
      status: 'FAILED_PRECONDITION',
      metadata: {
        variables: [
          {
            name: 'SMTP_PASSWORD',
            description: 'The SMTP password.',
            secret: true,
          },
        ],
      },
    });
    expect(
      (await harness.services.releases.listDeployments(admin, 'shop')).total,
    ).toBe(0);
  });

  it('keeps an upload that would deploy without its variables, and deploys it by its ID once they are set', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'staging',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0', {
      configTemplate: TEMPLATE,
      variables: MANIFEST,
    });
    await expect(
      harness.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(artifact.bytes),
        deploy: {},
      }),
    ).rejects.toMatchObject({ reason: 'VARIABLES_MISSING' });
    const [release] = await harness.services.releases.listReleases(
      admin,
      'shop',
    );
    expect(release).toBeDefined();
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'smtp-secret',
      },
    );
    expect((await deploy(release!.id)).status).toBe('succeeded');
    expect(lastEnv().SMTP_PASSWORD).toBe('smtp-secret');
  });

  it('resolves the App over its environment, generates secrets once and fills the first start', async () => {
    const { admin, release } = await upload();
    await harness.services.environments.setVariable(
      admin,
      'staging',
      'SMTP_PASSWORD',
      { value: 'from-environment' },
    );
    await harness.services.environments.setVariable(
      admin,
      'staging',
      'DB_HOST',
      {
        value: 'db.internal',
      },
    );
    await harness.services.releases.setAppVariable(admin, 'shop', 'DB_HOST', {
      value: 'db.shop',
    });
    expect((await deploy(release.id)).status).toBe('succeeded');
    const env = lastEnv();
    expect(env).toMatchObject({
      SMTP_PASSWORD: 'from-environment',
      DB_HOST: 'db.shop',
      APP_PUBLIC_ORIGIN: 'https://shop.fake.test',
      SECRETS_KEYS: expect.stringMatching(/^1:[0-9a-f]{64}$/u),
      AUTH_SECRET: expect.any(String),
      INITIAL_ADMIN_PASSWORD: expect.stringMatching(/^[A-Za-z0-9]{16}$/u),
    });
    // The sample data is the environment's choice, off here; nothing reaches the App the runtime sets itself.
    expect(env).not.toHaveProperty('APP_SAMPLE_DATA');
    expect(env).not.toHaveProperty('APP_BASE_PATH');
    // The secrets went to variables, not into config.yml.
    const config = harness.fake.applied.at(-1)?.config;
    const yml = parseYaml(config?.mode === 'file' ? config.content : '') as {
      auth?: unknown;
    };
    expect(yml.auth).toBeUndefined();

    // The generated values are the App's, and a later deployment keeps them; the first start's are gone.
    const { items } = await harness.services.releases.listAppVariables(
      admin,
      'shop',
    );
    const byName = new Map(items.map((item) => [item.name, item]));
    expect(byName.get('AUTH_SECRET')).toMatchObject({
      source: 'generated',
      value: null,
      app: { set: true, value: null, generated: true },
    });
    expect(byName.get('DB_HOST')).toMatchObject({
      source: 'app',
      value: 'db.shop',
      environment: { set: true, value: 'db.internal' },
    });
    expect(byName.get('SMTP_PASSWORD')).toMatchObject({
      source: 'environment',
      value: null,
      environment: { set: true, value: null },
    });
    const second = await upload('1.0.1');
    expect((await deploy(second.release.id)).status).toBe('succeeded');
    expect(lastEnv().AUTH_SECRET).toBe(env.AUTH_SECRET);
    expect(lastEnv().SECRETS_KEYS).toBe(env.SECRETS_KEYS);
    expect(lastEnv()).not.toHaveProperty('INITIAL_ADMIN_PASSWORD');
  });

  it('reports a changed value until the App is deployed again; one read on the first start never counts', async () => {
    const { admin, release } = await upload();
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'a',
      },
    );
    await deploy(release.id);
    expect(
      (await harness.services.releases.getApp(admin, 'shop')).variables,
    ).toEqual({ missing: [], changed: false });
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'INITIAL_ADMIN_USERNAME',
      { value: 'root' },
    );
    expect(
      (await harness.services.releases.getApp(admin, 'shop')).variables
        ?.changed,
    ).toBe(false);
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'b',
      },
    );
    expect(
      (await harness.services.releases.getApp(admin, 'shop')).variables
        ?.changed,
    ).toBe(true);
    await deploy(release.id);
    expect(
      (await harness.services.releases.getApp(admin, 'shop')).variables
        ?.changed,
    ).toBe(false);
  });

  it('shows the generated first administrator to a person who may deploy, until it is saved or expires', async () => {
    const { admin, release } = await upload();
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'x',
      },
    );
    await deploy(release.id);
    const password = lastEnv().INITIAL_ADMIN_PASSWORD;
    const shown = await harness.services.releases.readInitialAdmin(
      admin,
      'shop',
    );
    expect(shown).toMatchObject({
      username: 'nocobase',
      email: 'admin@nocobase.com',
      password,
      expiresAt: expect.any(String),
    });
    // Never an agent's or a key's, and never someone's who may not deploy.
    const agent = await harness.services.callerForUser('admin', 'agent');
    await expect(
      harness.services.releases.readInitialAdmin(agent, 'shop'),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
    const viewer = await harness.as('viewer', 'viewer');
    await expect(
      harness.services.releases.readInitialAdmin(viewer, 'shop'),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    // Expired.
    await harness.database
      .connection()
      .query.updateTable('relDeployments')
      .set({ initialAdminExpiresAt: new Date(Date.now() - 1000) })
      .where('appId', '=', 'shop')
      .execute();
    await expect(
      harness.services.releases.readInitialAdmin(admin, 'shop'),
    ).rejects.toMatchObject({ reason: 'INITIAL_ADMIN_UNAVAILABLE' });
    const row = await harness.database
      .connection()
      .query.selectFrom('relDeployments')
      .select('initialAdmin')
      .where('appId', '=', 'shop')
      .executeTakeFirst();
    expect(row?.initialAdmin).toBeNull();
  });

  it('forgets the first administrator once someone saved it', async () => {
    const { admin, release } = await upload();
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'x',
      },
    );
    await deploy(release.id);
    await harness.services.releases.dismissInitialAdmin(admin, 'shop');
    await expect(
      harness.services.releases.readInitialAdmin(admin, 'shop'),
    ).rejects.toMatchObject({ reason: 'INITIAL_ADMIN_UNAVAILABLE' });
  });

  it('generates no first administrator when one is named', async () => {
    const { admin, release } = await upload();
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'x',
      },
    );
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'INITIAL_ADMIN_PASSWORD',
      { value: 'chosen-by-me' },
    );
    await deploy(release.id);
    expect(lastEnv().INITIAL_ADMIN_PASSWORD).toBe('chosen-by-me');
    await expect(
      harness.services.releases.readInitialAdmin(admin, 'shop'),
    ).rejects.toMatchObject({ reason: 'INITIAL_ADMIN_UNAVAILABLE' });
  });

  it('loads sample data on a first deployment where the environment asks for it', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.environments.update(admin, 'staging', {
      sampleDataOnFirstDeploy: true,
    });
    expect(
      (await harness.services.environments.get(admin, 'staging'))
        .sampleDataOnFirstDeploy,
    ).toBe(true);
    const { release } = await upload();
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'x',
      },
    );
    await deploy(release.id);
    expect(lastEnv().APP_SAMPLE_DATA).toBe('true');
    await deploy(release.id);
    expect(lastEnv()).not.toHaveProperty('APP_SAMPLE_DATA');
  });

  it('gives a preview App none of its target’s values, only its own', async () => {
    const { admin, release } = await upload();
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      {
        value: 'production-secret',
      },
    );
    await harness.services.releases.createApp(admin, {
      id: 'fg-1--shop',
      name: 'FG-1',
      environmentId: 'staging',
      previewOf: 'shop',
    });
    const copy = await harness.services.releases.promoteRelease(
      admin,
      'shop',
      release.id,
      'fg-1--shop',
    );
    await expect(deploy(copy.id, 'fg-1--shop')).rejects.toMatchObject({
      reason: 'VARIABLES_MISSING',
    });
    await harness.services.releases.setAppVariable(
      admin,
      'fg-1--shop',
      'SMTP_PASSWORD',
      { value: 'this-preview-only' },
    );
    await deploy(copy.id, 'fg-1--shop');
    expect(lastEnv().SMTP_PASSWORD).toBe('this-preview-only');
    const shown = await harness.services.releases.readInitialAdmin(
      admin,
      'fg-1--shop',
    );
    // A preview's first administrator goes with the preview.
    expect(shown.expiresAt).toBeNull();
    const { items } = await harness.services.releases.listAppVariables(
      admin,
      'fg-1--shop',
    );
    expect(items.find((item) => item.name === 'SMTP_PASSWORD')).toMatchObject({
      source: 'app',
    });
  });

  it('refuses reserved names and keeps secret values to itself', async () => {
    const admin = await harness.as('admin', 'admin');
    await expect(
      harness.services.environments.setVariable(
        admin,
        'staging',
        'APP_CONFIG_FILE',
        {
          value: '/etc/passwd',
        },
      ),
    ).rejects.toMatchObject({ reason: 'VARIABLE_RESERVED' });
    await expect(
      harness.services.environments.setVariable(admin, 'staging', 'lower', {
        value: 'x',
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_VARIABLE_NAME' });
    await harness.services.environments.setVariable(
      admin,
      'staging',
      'API_TOKEN',
      {
        value: 'secret-token',
      },
    );
    await harness.services.environments.setVariable(
      admin,
      'staging',
      'REGION',
      {
        value: 'eu',
      },
    );
    expect(
      await harness.services.environments.listVariables(admin, 'staging'),
    ).toMatchObject([
      { name: 'API_TOKEN', secret: true, set: true, value: null },
      { name: 'REGION', secret: false, set: true, value: 'eu' },
    ]);
    const viewer = await harness.as('viewer', 'viewer');
    await expect(
      harness.services.environments.setVariable(viewer, 'staging', 'REGION', {
        value: 'us',
      }),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
  });

  it('refuses an archive whose manifest is not one', async () => {
    await expect(
      upload('1.0.0', { schemaVersion: 2, variables: [] }),
    ).rejects.toMatchObject({ reason: 'INVALID_VARIABLES_MANIFEST' });
    await expect(
      upload('1.0.0', {
        schemaVersion: 1,
        variables: [variable('not a name')],
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_VARIABLES_MANIFEST' });
  });

  it('reads the App’s variables against its most recent build, and refuses naming the environment', async () => {
    const { admin, release: first } = await upload('1.0.0');
    await harness.services.releases.setAppVariable(
      admin,
      'shop',
      'SMTP_PASSWORD',
      { value: 'secret' },
    );
    await deploy(first.id);
    const { release: second } = await upload('1.1.0', {
      schemaVersion: 1,
      variables: [
        variable('SMTP_PASSWORD', { secret: true, required: true }),
        variable('PAYMENT_KEY', { secret: true, required: true }),
      ],
    });
    // A build without a manifest declares nothing: the newest one with a manifest still counts.
    const bare = await createArtifact(harness.rootDir, '1.2.0', {
      configTemplate: TEMPLATE,
    });
    await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(bare.bytes),
    });
    const { items, meta } = await harness.services.releases.listAppVariables(
      admin,
      'shop',
    );
    expect(meta).toMatchObject({
      releaseId: second.id,
      releaseVersion: '1.1.0',
      environmentId: 'staging',
      declared: true,
      missing: ['PAYMENT_KEY'],
    });
    expect(
      items.filter((item) => item.declared).map((item) => item.name),
    ).toEqual(['PAYMENT_KEY', 'SMTP_PASSWORD']);
    expect(items.find((item) => item.name === 'SMTP_PASSWORD')).toMatchObject({
      source: 'app',
      value: null,
      app: { set: true, value: null },
    });
    expect(
      (await harness.services.releases.getApp(admin, 'shop')).variables
        ?.missing,
    ).toEqual(['PAYMENT_KEY']);
    await expect(
      harness.services.releases.deploy(admin, 'shop', {
        releaseId: second.id,
      }),
    ).rejects.toMatchObject({
      reason: 'VARIABLES_MISSING',
      metadata: {
        appId: 'shop',
        environmentId: 'staging',
        releaseId: second.id,
        variables: [{ name: 'PAYMENT_KEY' }],
      },
    });
  });

  it('merges what the most recent build of each App of an environment declares', async () => {
    const { admin } = await upload('1.0.0', {
      schemaVersion: 1,
      variables: [
        variable('SMTP_HOST', { required: true, description: 'Mail host.' }),
        variable('SHOP_ONLY'),
      ],
    });
    await upload(
      '1.0.0',
      {
        schemaVersion: 1,
        variables: [
          variable('SMTP_HOST', { required: true }),
          variable('API_TOKEN', { secret: true, required: true }),
        ],
      },
      'blog',
    );
    await harness.services.releases.setAppVariable(admin, 'blog', 'API_TOKEN', {
      value: 'token',
    });
    let declared =
      await harness.services.releases.listEnvironmentDeclaredVariables(
        admin,
        'staging',
      );
    expect(declared).toEqual([
      {
        name: 'API_TOKEN',
        description: null,
        secret: true,
        required: true,
        set: false,
        apps: ['blog'],
        missingIn: [],
      },
      {
        name: 'SHOP_ONLY',
        description: null,
        secret: false,
        required: false,
        set: false,
        apps: ['shop'],
        missingIn: [],
      },
      {
        name: 'SMTP_HOST',
        description: 'Mail host.',
        secret: false,
        required: true,
        set: false,
        apps: ['blog', 'shop'],
        missingIn: ['blog', 'shop'],
      },
    ]);
    await harness.services.environments.setVariable(
      admin,
      'staging',
      'SMTP_HOST',
      { value: 'smtp.example.com' },
    );
    declared = await harness.services.releases.listEnvironmentDeclaredVariables(
      admin,
      'staging',
    );
    expect(declared.find((item) => item.name === 'SMTP_HOST')).toMatchObject({
      set: true,
      missingIn: [],
    });
    // Only the Apps the caller may view count.
    const viewer = await harness.as('viewer', 'viewer');
    expect(
      await harness.services.releases.listEnvironmentDeclaredVariables(
        viewer,
        'staging',
      ),
    ).toEqual([]);
    const nobody = await harness.as('nobody', 'nobody');
    await expect(
      harness.services.releases.listEnvironmentDeclaredVariables(
        nobody,
        'staging',
      ),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
  });

  it('takes an image release’s manifest from CI', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'staging',
    });
    const release = await harness.services.releases.registerImageRelease(
      admin,
      'shop',
      {
        version: '1.0.0',
        ref: 'ghcr.io/acme/shop',
        digest: `sha256:${'a'.repeat(64)}`,
        variables: MANIFEST,
      },
    );
    expect(
      (
        await harness.services.releases.readReleaseVariables(
          admin,
          'shop',
          release.id,
        )
      )?.variables,
    ).toHaveLength(MANIFEST.variables.length);
  });
});

describe('variables over HTTP', () => {
  let harness: Harness;
  let server: Awaited<ReturnType<typeof createApiServer>>;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
    server = await createApiServer(harness.services);
  });
  afterEach(async () => {
    await server.close();
    await harness.close();
  });

  it('sets and lists variables, and keeps the first administrator from keys', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'staging',
    });
    const put = await fetch(`${server.url}/apps/shop/variables/SMTP_PASSWORD`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-test-user': 'admin' },
      body: JSON.stringify({ value: 'secret' }),
    });
    expect(put.status).toBe(200);
    expect(await put.json()).toMatchObject({
      data: { name: 'SMTP_PASSWORD', secret: true, value: null, source: 'app' },
    });
    const list = await fetch(`${server.url}/apps/shop/variables`, {
      headers: { 'x-test-user': 'admin' },
    });
    expect(await list.json()).toMatchObject({
      data: [{ name: 'SMTP_PASSWORD', app: { set: true, value: null } }],
      meta: { total: 1, releaseId: null, missing: [], changed: false },
    });
    const reserved = await fetch(`${server.url}/apps/shop/variables/NODE_ENV`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-test-user': 'admin' },
      body: JSON.stringify({ value: 'development' }),
    });
    expect(reserved.status).toBe(400);
    expect(await reserved.json()).toMatchObject({
      error: { reason: 'VARIABLE_RESERVED' },
    });
    const declared = await fetch(
      `${server.url}/environments/staging/declaredVariables`,
      { headers: { 'x-test-user': 'admin' } },
    );
    expect(declared.status).toBe(200);
    expect(await declared.json()).toEqual({ data: [], meta: { total: 0 } });
    const byKey = await fetch(`${server.url}/apps/shop/initialAdmin`, {
      headers: {
        'x-test-user': 'admin',
        'x-test-key': JSON.stringify({ actions: ['rel.apps/deploy'] }),
      },
    });
    expect(byKey.status).toBe(403);
    const none = await fetch(`${server.url}/apps/shop/initialAdmin`, {
      headers: { 'x-test-user': 'admin' },
    });
    expect(none.status).toBe(404);
    expect(await none.json()).toMatchObject({
      error: { reason: 'INITIAL_ADMIN_UNAVAILABLE' },
    });
  });
});

describe('resolveVariables', () => {
  const stored = (name: string, value: string | null): StoredAppVariable => ({
    id: name,
    appId: 'a',
    name,
    value,
    secret: false,
    generated: false,
  });
  const environment = (
    name: string,
    value: string,
  ): StoredEnvironmentVariable => ({
    id: name,
    environmentId: 'e',
    name,
    value,
    secret: false,
    description: null,
    updatedBy: null,
    updatedAt: new Date(),
  });

  it('takes the strongest source and names what is missing', () => {
    const resolved = resolveVariables({
      manifest: {
        schemaVersion: 1,
        variables: [
          variable('A', { path: 'a', required: true }),
          variable('B', { path: 'b', required: true }),
          variable('C', { path: 'c', required: true }),
          variable('D', { path: 'd', required: true }),
          variable('E', { path: 'e', hasDefault: true }),
          variable('NODE_ENV'),
        ],
      },
      environment: [environment('A', 'env'), environment('B', 'env')],
      app: [stored('A', 'app')],
      configFile: { c: 'from-file', d: 'replace-with-the-password' },
      running: { A: 'app', B: 'old' },
    });
    const source = Object.fromEntries(
      resolved.variables.map((item) => [item.name, item.source]),
    );
    expect(source).toEqual({
      A: 'app',
      B: 'environment',
      C: 'configFile',
      D: 'unset',
      E: 'default',
    });
    expect(resolved.env).toEqual({ A: 'app', B: 'env' });
    expect(resolved.missing.map((item) => item.name)).toEqual(['D']);
    expect(resolved.changed).toBe(true);
  });
});

// @vitest-environment node
/**
 * Secrets in an App's `config.yml`: masked wherever configuration leaves the server (the API, the release template,
 * history and logs), kept when content comes back masked, replaced and cleared one by one, and given to the runtime as
 * stored.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import {
  maskConfig,
  restoreConfigSecrets,
  secretKeyKind,
} from '../server/services/config-secrets.js';
import { CONFIG_SECRET_MASK, formatConfigPath } from '../shared/releases.js';
import {
  createApiServer,
  createArtifact,
  createHarness,
  streamOf,
  type Harness,
} from './harness.js';

const SECRETS = {
  adminPassword: 'Initial-Admin-Pass-71',
  authSecret: 'auth-secret-0123456789-abcdefghijklmnop',
  sessionSecret: 'session-secret-0123456789-abcdefghijkl',
  dbPassword: 'db-password-xyz',
  s3Secret: 's3-secret-access-key-value',
  token: 'tok_live_1234567890',
} as const;

const CONFIG = `# Shop, deployed by release management.
app:
  title: Shop
users:
  initialAdmin:
    username: admin
    email: admin@example.com
    password: ${SECRETS.adminPassword}
auth:
  secret: ${SECRETS.authSecret} # generated
  emailAndPassword:
    enabled: true
session:
  secret: ${SECRETS.sessionSecret}
database:
  connections:
    main:
      dialect: postgres
      host: db
      password: ${SECRETS.dbPassword}
      url: postgres://shop:${SECRETS.dbPassword}@db:5432/shop
storage:
  s3:
    accessKeyId: AKIAEXAMPLE
    secretAccessKey: ${SECRETS.s3Secret}
    publicKey: not-a-secret
webhooks:
  - name: deploys
    tokens:
      - ${SECRETS.token}
ai:
  maxTokens: 4096
`;

describe('config secret rules', () => {
  it('recognises secret keys by their last word', () => {
    for (const key of [
      'password',
      'secret',
      'secretsKey',
      'clientSecret',
      'secret_access_key',
      'apiKey',
      'apikey',
      'token',
      'refreshToken',
      'dsn',
      'credentials',
      'privateKey',
    ])
      expect([key, secretKeyKind(key)]).not.toEqual([key, null]);
    for (const key of [
      'username',
      'email',
      'enabled',
      'publicKey',
      'primaryKey',
      'keyPrefix',
      'tokenUrl',
      'accessKeyId',
      'host',
    ])
      expect([key, secretKeyKind(key)]).toEqual([key, null]);
    expect(secretKeyKind('password')).toBe('any');
    expect(secretKeyKind('maxTokens')).toBe('string');
  });

  it('masks every secret and keeps the rest of the file as written', () => {
    const masked = maskConfig(CONFIG);
    for (const value of Object.values(SECRETS))
      expect(masked.content).not.toContain(value);
    expect(
      masked.secrets.map((secret) => formatConfigPath(secret.path)),
    ).toEqual([
      'users.initialAdmin.password',
      'auth.secret',
      'session.secret',
      'database.connections.main.password',
      'database.connections.main.url',
      'storage.s3.secretAccessKey',
      'webhooks[0].tokens[0]',
    ]);
    // Comments, order and non-secret values stay.
    expect(masked.content).toContain('# Shop, deployed by release management.');
    expect(masked.content).toContain('# generated');
    const parsed = parseYaml(masked.content) as Record<string, any>;
    expect(parsed.users.initialAdmin).toEqual({
      username: 'admin',
      email: 'admin@example.com',
      password: CONFIG_SECRET_MASK,
    });
    expect(parsed.storage.s3).toEqual({
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: CONFIG_SECRET_MASK,
      publicKey: 'not-a-secret',
    });
    expect(parsed.ai.maxTokens).toBe(4096);
  });

  it('masks a secret wherever it appears, and numbers under a password', () => {
    const masked = maskConfig(
      [
        'db:',
        '  password: &pw shared-password-1',
        'replica:',
        '  password: *pw',
        'notes:',
        '  copy: shared-password-1',
        '  dsnLike: host=db password=shared-password-1',
        'pin:',
        '  password: 123456',
        '',
      ].join('\n'),
    );
    expect(masked.content).not.toContain('shared-password-1');
    expect(masked.content).not.toContain('123456');
    const restored = restoreConfigSecrets(
      masked.content,
      [
        'db:',
        '  password: &pw shared-password-1',
        'notes:',
        '  copy: shared-password-1',
        '  dsnLike: host=db password=shared-password-1',
        'pin:',
        '  password: 123456',
        '',
      ].join('\n'),
    );
    expect(parseYaml(restored)).toEqual({
      db: { password: 'shared-password-1' },
      replica: { password: 'shared-password-1' },
      notes: {
        copy: 'shared-password-1',
        dsnLike: 'host=db password=shared-password-1',
      },
      pin: { password: 123456 },
    });
  });

  it('restores masked values, replaces and clears secrets, and refuses a mask with nothing stored', () => {
    const masked = maskConfig(CONFIG).content;
    expect(restoreConfigSecrets(masked, CONFIG)).toBe(CONFIG);
    const changed = parseYaml(
      restoreConfigSecrets(
        masked.replace('title: Shop', 'title: Store'),
        CONFIG,
        [
          {
            path: ['auth', 'secret'],
            value: 'a-brand-new-auth-secret-0123456789',
          },
          { path: ['storage', 's3', 'secretAccessKey'], value: null },
          { path: ['mail', 'password'], value: 'new-mail-password' },
        ],
      ),
    ) as Record<string, any>;
    expect(changed.app.title).toBe('Store');
    expect(changed.auth.secret).toBe('a-brand-new-auth-secret-0123456789');
    expect(changed.session.secret).toBe(SECRETS.sessionSecret);
    expect(changed.users.initialAdmin.password).toBe(SECRETS.adminPassword);
    expect(changed.storage.s3).toEqual({
      accessKeyId: 'AKIAEXAMPLE',
      publicKey: 'not-a-secret',
    });
    expect(changed.mail).toEqual({ password: 'new-mail-password' });
    // A mask moved to where nothing is stored cannot be restored.
    expect(() =>
      restoreConfigSecrets(
        `other:\n  password: ${CONFIG_SECRET_MASK}\n`,
        CONFIG,
      ),
    ).toThrow(expect.objectContaining({ reason: 'CONFIG_SECRET_NOT_STORED' }));
    for (const changes of [
      'nope',
      [{ path: [], value: 'x' }],
      [{ path: ['a'], value: CONFIG_SECRET_MASK }],
      [{ path: ['a'], value: '' }],
      [{ path: ['a'], value: 1 }],
    ])
      expect(() => restoreConfigSecrets('a: 1\n', null, changes)).toThrow(
        expect.objectContaining({ reason: 'INVALID_CONFIG_SECRET' }),
      );
  });
});

describe('config secrets through the API', () => {
  let harness: Harness;
  let server: Awaited<ReturnType<typeof createApiServer>>;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
    harness.application.roles.set('admin', 'admin');
    server = await createApiServer(harness.services);
  });
  afterEach(async () => {
    await server.close();
    await harness.close();
  });

  /** A response's raw text and parsed body. */
  const call = async (
    path: string,
    init: { method?: string; json?: unknown } = {},
  ) => {
    const response = await fetch(`${server.url}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'x-test-user': 'admin',
        ...(init.json === undefined
          ? {}
          : { 'content-type': 'application/json' }),
      },
      body: init.json === undefined ? undefined : JSON.stringify(init.json),
    });
    const text = await response.text();
    return {
      status: response.status,
      text,
      body: JSON.parse(text) as { data?: any; error?: { code: string } },
    };
  };

  const runtimeConfig = (appId: string): Record<string, any> => {
    const config = harness.fake.running.get(appId)?.config;
    if (config?.mode !== 'file') throw new Error('No file configuration.');
    return parseYaml(config.content) as Record<string, any>;
  };

  const expectNoSecret = (text: string, secrets: readonly string[]) => {
    for (const secret of secrets) expect(text).not.toContain(secret);
  };

  it('never answers a secret, keeps masked ones, and replaces and clears them', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'staging',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0', {
      configTemplate: CONFIG,
    });
    const release = await harness.services.releases.uploadRelease(
      admin,
      'shop',
      { stream: streamOf(artifact.bytes) },
    );
    const deployed = await call('/apps/shop/deploy', {
      method: 'POST',
      json: { releaseId: release.id },
    });
    expect(deployed.status).toBe(202);
    await harness.services.releases.waitForDeployment(deployed.body.data.id);
    const all = Object.values(SECRETS);
    // The runtime got the real values.
    expect(runtimeConfig('shop').users.initialAdmin.password).toBe(
      SECRETS.adminPassword,
    );

    // Nothing that leaves the server holds one.
    const config = await call('/apps/shop/config');
    expect(config.status).toBe(200);
    // The file's seven, and the secrets key generated at deployment.
    expect(config.body.data.secrets).toHaveLength(8);
    for (const path of [
      '/apps/shop/config',
      '/apps/shop',
      '/apps',
      '/apps/shop/releases',
      `/apps/shop/releases/${release.id}`,
      `/apps/shop/releases/${release.id}/configTemplate`,
      '/apps/shop/deployments',
      `/apps/shop/deployments/${deployed.body.data.id}`,
      `/apps/shop/deployments/${deployed.body.data.id}/logs`,
    ]) {
      const response = await call(path);
      expect([path, response.status]).toEqual([path, 200]);
      expectNoSecret(response.text, all);
    }

    // Saving the masked text with an edit keeps every secret.
    const edited = await call('/apps/shop/config', {
      method: 'PUT',
      json: {
        content: (config.body.data.content as string).replace(
          'title: Shop',
          'title: Store',
        ),
      },
    });
    expect(edited.status).toBe(200);
    expectNoSecret(edited.text, all);
    const reloaded = () =>
      parseYaml(harness.fake.reloaded.get('shop')!) as Record<string, any>;
    expect(reloaded()).toMatchObject({
      app: { title: 'Store' },
      users: { initialAdmin: { password: SECRETS.adminPassword } },
      auth: { secret: SECRETS.authSecret },
      database: { connections: { main: { password: SECRETS.dbPassword } } },
    });

    // Replacing one secret and clearing another; the answer shows neither.
    const replaced = await call('/apps/shop/config', {
      method: 'PUT',
      json: {
        content: edited.body.data.content,
        secretChanges: [
          {
            path: ['users', 'initialAdmin', 'password'],
            value: 'Replaced-Admin-Pass-99',
          },
          { path: ['storage', 's3', 'secretAccessKey'], value: null },
        ],
      },
    });
    expect(replaced.status).toBe(200);
    expectNoSecret(replaced.text, [...all, 'Replaced-Admin-Pass-99']);
    expect(
      replaced.body.data.secrets.map((secret: { path: string[] }) =>
        secret.path.join('.'),
      ),
    ).not.toContain('storage.s3.secretAccessKey');
    expect(reloaded().users.initialAdmin.password).toBe(
      'Replaced-Admin-Pass-99',
    );
    expect(reloaded().storage.s3).toEqual({
      accessKeyId: 'AKIAEXAMPLE',
      publicKey: 'not-a-secret',
    });
    expect(reloaded().auth.secret).toBe(SECRETS.authSecret);

    // A mask with nothing stored behind it is refused, and the error does not echo the file.
    const refused = await call('/apps/shop/config', {
      method: 'PUT',
      json: {
        content: `${edited.body.data.content}extra:\n  password: ${CONFIG_SECRET_MASK}\n`,
      },
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error?.reason).toBe('CONFIG_SECRET_NOT_STORED');

    // Deploying again with the masked text keeps the stored secrets in the new deployment.
    const again = await call('/apps/shop/deploy', {
      method: 'POST',
      json: {
        releaseId: release.id,
        config: { mode: 'file', content: replaced.body.data.content },
      },
    });
    expect(again.status).toBe(202);
    await harness.services.releases.waitForDeployment(again.body.data.id);
    expect(runtimeConfig('shop')).toMatchObject({
      users: { initialAdmin: { password: 'Replaced-Admin-Pass-99' } },
      session: { secret: SECRETS.sessionSecret },
    });
  });
});

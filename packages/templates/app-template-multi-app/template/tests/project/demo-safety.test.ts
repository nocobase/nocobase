import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { readDemoPlan } from '../../scripts/demo-plan.mjs';
import { assertHostStopSource } from '../../scripts/check-host-stop.mjs';
import manifest from '../../package.json' with { type: 'json' };

const root = path.resolve(import.meta.dirname, '../..');

const supportedHost = `
stopDeployment(appId) { await this.registry.unregister(appId, { reason: 'explicit stop' }); }
removeDeployment() {}
if (spec.desiredState === 'stopped') { await this.registry.unregister(spec.appId, { reason: 'restored stop' }); }
`;

it('accepts the two explicit-stop unregister paths without requiring a legacy patch', () => {
  expect(() => assertHostStopSource(supportedHost)).not.toThrow();
});

it.each([
  supportedHost.replaceAll('unregister', 'evict'),
  supportedHost.replace('unregister(appId,', 'evict(appId,'),
  supportedHost.replace('unregister(spec.appId,', 'evict(spec.appId,'),
  '',
])(
  'rejects an unsupported or incomplete Host stop implementation',
  (source) => {
    expect(() => assertHostStopSource(source)).toThrow(
      'explicit-stop unregister semantics',
    );
  },
);

it('accepts a single explicit artifact and rejects duplicate versions, absent archives and invalid instance references', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'multi-app-plan-'));
  try {
    await writeFile(
      path.join(temporary, 'sub.tar.gz'),
      'isolated-plan-fixture',
    );
    const file = path.join(temporary, 'plan.json');
    const artifact = { version: '1.0.0', path: 'sub.tar.gz' };
    const instance = {
      id: 'teaching-reagents',
      name: 'Teaching',
      version: artifact.version,
    };
    await writeFile(
      file,
      JSON.stringify({ artifacts: [artifact], instances: [instance] }),
    );
    expect(await readDemoPlan(file)).toEqual({
      artifacts: [
        {
          ...artifact,
          path: await realpath(path.join(temporary, artifact.path)),
        },
      ],
      instances: [{ ...instance, stopped: false }],
    });
    for (const invalid of [
      { artifacts: [artifact, artifact], instances: [instance] },
      {
        artifacts: [{ ...artifact, path: 'absent.tar.gz' }],
        instances: [instance],
      },
      { artifacts: [artifact], instances: [{ ...instance, version: '2.0.0' }] },
      { artifacts: [artifact], instances: [instance, instance] },
    ]) {
      await writeFile(file, JSON.stringify(invalid));
      await expect(readDemoPlan(file)).rejects.toThrow();
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

it('never implicitly initializes from install, dev, start or ordinary demo', async () => {
  expect(manifest.scripts).not.toHaveProperty('postinstall');
  for (const command of ['dev', 'start'] as const) {
    expect(manifest.scripts[command]).not.toContain('prepare-demo');
    expect(manifest.scripts[command]).not.toContain('--initialize');
  }
  const help = spawnSync(
    process.execPath,
    ['--experimental-import-meta-resolve', 'scripts/demo.mjs', '--help'],
    { cwd: root, encoding: 'utf8' },
  );
  expect(help.status).toBe(0);
  expect(help.stdout).toContain('--initialize --plan');
  const invalid = spawnSync(
    process.execPath,
    ['--experimental-import-meta-resolve', 'scripts/demo.mjs', '--initialize'],
    { cwd: root, encoding: 'utf8' },
  );
  expect(invalid.status).not.toBe(0);
  expect(invalid.stderr).toContain('Use --initialize --plan');
  const registration = await readFile(
    path.join(root, 'cli/plugins.ts'),
    'utf8',
  );
  expect(registration).not.toContain('afterBuild');
});

it.each([
  { origin: 'http://127.0.0.1:14230', mode: 'local', secure: false },
  { origin: 'https://owned.example', mode: 'sso', secure: true },
])(
  'configures $mode without disabling HTTPS cookie security or changing instances',
  async ({ origin, mode, secure }) => {
    const temporary = await mkdtemp(path.join(tmpdir(), 'multi-app-config-'));
    try {
      await writeFile(
        path.join(temporary, 'config.yml'),
        'app: {}\nauth: {}\nreleases: {}\n',
      );
      const result = spawnSync(
        process.execPath,
        [path.join(root, 'scripts/configure-local.mjs')],
        {
          cwd: temporary,
          encoding: 'utf8',
          env: {
            ...process.env,
            EXAMPLE_PUBLIC_ORIGIN: origin,
            EXAMPLE_MODE: mode,
          },
        },
      );
      expect(result.status).toBe(0);
      const config = await readFile(path.join(temporary, 'config.yml'), 'utf8');
      expect(config).toContain('useSecureCookies: ' + String(secure));
      expect(config).toContain(origin);
      expect(result.stdout).toContain(
        'Existing instance URLs, versions and data have not been changed',
      );
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  },
);

it('refuses SSO setup over HTTP before creating configuration', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'multi-app-config-'));
  try {
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts/configure-local.mjs')],
      {
        cwd: temporary,
        encoding: 'utf8',
        env: {
          ...process.env,
          EXAMPLE_PUBLIC_ORIGIN: 'http://192.168.1.10:14230',
          EXAMPLE_MODE: 'sso',
        },
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('operator-provided trusted HTTPS');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

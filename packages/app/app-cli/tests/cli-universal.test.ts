// `nocobase cli build --universal`: the one tarball without a Node, which runs on the machine's Node.js 24 or newer,
// and the launcher that finds that Node, also under a user service whose PATH has none. The pack runs for real
// against a stand-in `@nocobase/app-cli-client` linked from outside node_modules, so it is vendored and nothing is
// fetched from a registry or nodejs.org.
import { execFile, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

import { readCliApplication } from '../src/lib/cli-brand.ts';
import {
  checkPackOptions,
  CLI_TARGETS,
  packCli,
  packTargets,
  universalLauncherScript,
  UNIVERSAL_TARGET,
} from '../src/lib/cli-pack.ts';

const execFileAsync = promisify(execFile);
const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
  );
});

async function tempDir(): Promise<string> {
  // Real, as the launcher resolves its own directory with `pwd -P` (macOS links /var to /private/var).
  const dir = await realpath(
    await mkdtemp(path.join(os.tmpdir(), 'nb3-cli-universal-')),
  );
  created.push(dir);
  return dir;
}

/** A PATH directory holding only what the launcher runs besides Node, so no `node` of this machine comes along. */
async function shellTools(root: string): Promise<string> {
  const dir = path.join(root, 'tools');
  await mkdir(dir, { recursive: true });
  for (const tool of ['sh', 'dirname', 'readlink']) {
    const found = execFileSync('sh', ['-c', `command -v ${tool}`], {
      encoding: 'utf8',
    }).trim();
    await symlink(found, path.join(dir, tool));
  }
  return dir;
}

/** A stand-in `node` named `label`: of Node.js 24 or newer when `supported`, printing the script it runs otherwise. */
async function fakeNode(
  file: string,
  label: string,
  supported: boolean,
): Promise<string> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    `#!/bin/sh\nif [ "$1" = -e ]; then exit ${supported ? 0 : 1}; fi\nprintf '%s\\n' ${label} "$@"\n`,
  );
  await chmod(file, 0o755);
  return file;
}

/** An installation as the install script leaves it: `<prefix>/versions/2.0.0` current, linked from `<bin>/demo`. */
async function universalInstallation(root: string): Promise<{
  prefix: string;
  command: string;
}> {
  const prefix = path.join(root, 'share', 'demo');
  const top = path.join(prefix, 'versions', '2.0.0');
  await mkdir(path.join(top, 'bin'), { recursive: true });
  await writeFile(path.join(top, 'bin', 'run.js'), '');
  await writeFile(
    path.join(top, 'bin', 'demo'),
    universalLauncherScript('demo'),
  );
  await chmod(path.join(top, 'bin', 'demo'), 0o755);
  await symlink('versions/2.0.0', path.join(prefix, 'current'));
  await mkdir(path.join(root, 'bin'));
  const command = path.join(root, 'bin', 'demo');
  await symlink(path.join(prefix, 'current', 'bin', 'demo'), command);
  return { prefix, command };
}

async function launch(
  command: string,
  env: Record<string, string>,
): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, ['status'], {
      env,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failed = error as { code: number; stdout: string; stderr: string };
    return { code: failed.code, stdout: failed.stdout, stderr: failed.stderr };
  }
}

describe('the universal launcher', () => {
  it("prefers NOCOBASE_NODE, then the installation's node, then node on PATH", async () => {
    const root = await tempDir();
    const tools = await shellTools(root);
    const { prefix, command } = await universalInstallation(root);
    const onPath = path.dirname(
      await fakeNode(path.join(root, 'path', 'node'), 'path', true),
    );
    const env = { PATH: `${onPath}:${tools}` };
    const script = path.join(prefix, 'versions', '2.0.0', 'bin', 'run.js');

    expect((await launch(command, env)).stdout.split('\n')).toEqual([
      'path',
      script,
      'status',
      '',
    ]);
    await fakeNode(path.join(prefix, 'node'), 'pinned', true);
    expect((await launch(command, env)).stdout).toMatch(/^pinned\n/u);
    const chosen = await fakeNode(path.join(root, 'chosen'), 'chosen', true);
    expect(
      (await launch(command, { ...env, NOCOBASE_NODE: chosen })).stdout,
    ).toMatch(/^chosen\n/u);
  });

  it('starts under a service without node on its PATH on the Node a previous standalone version carries', async () => {
    const root = await tempDir();
    const tools = await shellTools(root);
    const { prefix, command } = await universalInstallation(root);
    // What an older runner leaves when it updates itself to the universal version: the version it ran from.
    await fakeNode(
      path.join(prefix, 'versions', '1.0.0', 'bin', 'node'),
      'bundled',
      true,
    );
    // An older Node on PATH is passed over.
    const old = path.dirname(
      await fakeNode(path.join(root, 'old', 'node'), 'old', false),
    );
    const result = await launch(command, { PATH: `${old}:${tools}` });
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/^bundled\n/u);
  });

  it('says how to get Node.js when there is none it can run on', async () => {
    const root = await tempDir();
    const tools = await shellTools(root);
    const { command } = await universalInstallation(root);
    const result = await launch(command, { PATH: tools });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      'demo needs Node.js 24 or newer, and found none.',
    );
    expect(result.stderr).toContain('NOCOBASE_NODE');
  });
});

describe('nocobase cli build --universal', () => {
  it('asks for the universal tarball alone, or beside the platforms named', () => {
    expect(packTargets(undefined, false)).toEqual([...CLI_TARGETS]);
    expect(packTargets(undefined, true)).toEqual([UNIVERSAL_TARGET]);
    expect(packTargets('linux-x64, darwin-arm64', true)).toEqual([
      'linux-x64',
      'darwin-arm64',
      UNIVERSAL_TARGET,
    ]);
    expect(packTargets('linux-x64', false)).toEqual(['linux-x64']);
    expect(() =>
      checkPackOptions({
        channel: 'stable',
        targets: [UNIVERSAL_TARGET],
        nodeVersion: '24.1.0',
      }),
    ).not.toThrow();
  });

  it("packs one tarball without a Node that runs on this machine's Node.js", async () => {
    const root = await tempDir();
    // The client, linked from a source checkout as a workspace package is: vendored into the tarball.
    const client = path.join(root, 'client');
    await mkdir(client, { recursive: true });
    await writeFile(
      path.join(client, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-cli-client',
        version: '0.0.1',
        type: 'module',
        exports: './index.js',
      }),
    );
    await writeFile(
      path.join(client, 'index.js'),
      [
        'export async function runAppCliPackage(root, argv) {',
        '  process.stdout.write(JSON.stringify({ root, argv, node: process.execPath }));',
        '}',
        '',
      ].join('\n'),
    );
    const app = path.join(root, 'app');
    await mkdir(path.join(app, 'node_modules', '@nocobase'), {
      recursive: true,
    });
    await symlink(
      client,
      path.join(app, 'node_modules', '@nocobase', 'app-cli-client'),
    );
    await writeFile(
      path.join(app, 'package.json'),
      JSON.stringify({
        name: 'demo-app',
        version: '1.2.3',
        nocobase: { cli: { bin: 'demo', displayName: 'Demo' } },
      }),
    );

    const out = path.join(root, 'out');
    const result = await packCli({
      application: await readCliApplication(app),
      runner: false,
      out,
      channel: 'stable',
      targets: [UNIVERSAL_TARGET],
      nodeVersion: process.versions.node,
      hostNode: false,
      skipBuild: true,
      keepStaging: false,
      log: () => undefined,
    });
    const name = `demo-v1.2.3-${UNIVERSAL_TARGET}.tar.gz`;
    expect(result.node).toBe('system');
    expect(Object.keys(result.targets)).toEqual([UNIVERSAL_TARGET]);
    const manifest = JSON.parse(
      await readFile(path.join(out, 'stable', 'demo', 'manifest.json'), 'utf8'),
    );
    expect(manifest).toMatchObject({
      schema: 1,
      product: 'demo',
      bin: 'demo',
      versions: {
        '1.2.3': {
          node: 'system',
          targets: {
            [UNIVERSAL_TARGET]: {
              file: `1.2.3/${name}`,
              sha256: result.targets[UNIVERSAL_TARGET]?.sha256,
            },
          },
        },
      },
    });

    // Installed as the install script does it, and started with this machine's Node.js found on PATH.
    const version = path.join(root, 'share', 'demo', 'versions', '1.2.3');
    await mkdir(version, { recursive: true });
    execFileSync('tar', [
      '-xzf',
      path.join(out, 'stable', 'demo', '1.2.3', name),
      '-C',
      version,
      '--strip-components=1',
    ]);
    expect(existsSync(path.join(version, 'bin', 'node'))).toBe(false);
    expect(existsSync(path.join(version, 'vendor'))).toBe(false);
    const tools = await shellTools(root);
    const { stdout } = await execFileAsync(
      path.join(version, 'bin', 'demo'),
      ['--version'],
      { env: { PATH: `${path.dirname(process.execPath)}:${tools}` } },
    );
    expect(JSON.parse(stdout)).toEqual({
      root: version,
      argv: ['--version'],
      node: process.execPath,
    });
  }, 180_000);
});

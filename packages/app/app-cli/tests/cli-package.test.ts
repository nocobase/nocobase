// `nocobase cli build` and `cli link`: the application's CLI as package.json declares it (`nocobase.cli`), the entry and
// launcher a packaged CLI starts with, and the local link. Packing itself installs from a registry and downloads Node.js,
// so it is checked by hand (`pnpm nocobase cli build --targets <this platform> --host-node`), not here.
import { execFile } from 'node:child_process';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

import { CommandError } from '../src/command/errors.ts';
import {
  cliEntry,
  parseCliBrand,
  readCliApplication,
  requireCliBrand,
  runtimeBrand,
} from '../src/lib/cli-brand.ts';
import { linkCli } from '../src/lib/cli-link.ts';
import {
  checkPackOptions,
  copySkills,
  launcherScript,
} from '../src/lib/cli-pack.ts';

const execFileAsync = promisify(execFile);
const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
  );
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nb3-cli-'));
  created.push(dir);
  return dir;
}

async function writeSkill(dir: string, slug: string): Promise<void> {
  await mkdir(path.join(dir, slug), { recursive: true });
  await writeFile(
    path.join(dir, slug, 'SKILL.md'),
    `---\nname: ${slug}\ndescription: ${slug}\n---\n`,
  );
}

/** An application declaring `cli`, with a stand-in `@nocobase/app-cli-client` that prints what it was run with. */
async function createApp(cli: unknown): Promise<string> {
  const root = await tempDir();
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'demo', version: '1.2.3', nocobase: { cli } }),
  );
  const client = path.join(root, 'node_modules', '@nocobase', 'app-cli-client');
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
      "import { readFileSync } from 'node:fs';",
      "import path from 'node:path';",
      'export async function runAppCliPackage(root, argv) {',
      "  const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));",
      '  process.stdout.write(JSON.stringify({ root, argv, cli: manifest.nocobase.cli, version: manifest.version }));',
      '}',
      '',
    ].join('\n'),
  );
  return root;
}

describe('nocobase.cli', () => {
  it('takes what an application declares, and refuses what would break the CLI or the distribution', () => {
    const brand = parseCliBrand({
      bin: 'acme',
      displayName: 'Acme',
      envPrefix: 'ACME',
      auth: { clientId: 'acme' },
      skills: ['ai/skills/acme-cli'],
    });
    expect(runtimeBrand(brand)).toEqual({
      bin: 'acme',
      displayName: 'Acme',
      envPrefix: 'ACME',
      auth: { clientId: 'acme' },
    });
    for (const bad of [
      'acme',
      {},
      { bin: 'Acme' },
      { bin: 'nocobase-runner' },
      { bin: 'nocobase' },
      { bin: 'acme', stateDir: '../elsewhere' },
      { bin: 'acme', skills: ['/etc'] },
      { bin: 'acme', auth: { secret: 'x' } },
      { bin: 'acme', displayName: '' },
    ])
      expect(() => parseCliBrand(bad)).toThrow(CommandError);
  });

  it('is optional: an application without it is told how to declare one', async () => {
    const root = await tempDir();
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'plain', version: '0.1.0' }),
    );
    const application = await readCliApplication(root);
    expect(application.brand).toBeUndefined();
    expect(() => requireCliBrand(application)).toThrow(
      expect.objectContaining({ errorCode: 'CLI_NOT_DECLARED' }),
    );
  });
});

describe('a packaged CLI', () => {
  it('starts bin/run.js with the Node.js it carries, through any links to its command', async () => {
    const root = await tempDir();
    const top = path.join(root, 'versions', '1.0.0');
    await mkdir(path.join(top, 'bin'), { recursive: true });
    // A stand-in for the bundled Node.js: prints the script it runs and its arguments.
    await writeFile(
      path.join(top, 'bin', 'node'),
      '#!/bin/sh\nprintf "%s\\n" "$@"\n',
    );
    await chmod(path.join(top, 'bin', 'node'), 0o755);
    await writeFile(path.join(top, 'bin', 'demo'), launcherScript('demo'));
    await chmod(path.join(top, 'bin', 'demo'), 0o755);
    await symlink('versions/1.0.0', path.join(root, 'current'));
    await mkdir(path.join(root, 'bin'));
    await symlink(
      path.join(root, 'current', 'bin', 'demo'),
      path.join(root, 'bin', 'demo'),
    );
    const { stdout } = await execFileAsync(path.join(root, 'bin', 'demo'), [
      'login',
      '--server',
      'https://x',
    ]);
    const [script, ...args] = stdout.trim().split('\n');
    expect(await readlink(path.join(root, 'current'))).toBe('versions/1.0.0');
    expect(
      script?.endsWith(path.join('versions', '1.0.0', 'bin', 'run.js')),
    ).toBe(true);
    expect(args).toEqual(['login', '--server', 'https://x']);
  });

  it('runs the client with its own nocobase.cli', () => {
    const entry = cliEntry('demo', false);
    expect(entry.startsWith('#!/usr/bin/env node\n')).toBe(true);
    expect(entry).toContain("await import('@nocobase/app-cli-client')");
    expect(entry).toContain('runAppCliPackage(root, process.argv.slice(2))');
    expect(entry).not.toContain('registerHooks');
    expect(cliEntry('demo', true)).toContain('registerHooks');
  });

  it('ships each skill directory, or the skills inside a directory, once', async () => {
    const root = await tempDir();
    await writeSkill(path.join(root, 'ai', 'skills'), 'one');
    await writeSkill(path.join(root, 'cli', 'skills'), 'two');
    await writeSkill(path.join(root, 'cli', 'skills'), 'three');
    const out = path.join(root, 'out');
    await mkdir(out);
    expect(
      await copySkills(root, ['ai/skills/one', 'cli/skills'], out),
    ).toEqual(['one', 'three', 'two']);
    await expect(copySkills(root, ['ai/skills/one'], out)).resolves.toEqual([
      'one',
    ]);
    await expect(
      copySkills(
        root,
        ['ai/skills/one', 'ai/skills/one'],
        path.join(root, 'x'),
      ),
    ).rejects.toThrow('Two skills are named one.');
    await expect(copySkills(root, ['missing'], out)).rejects.toThrow(
      'not a directory',
    );
  });

  it('refuses targets, channels and versions it cannot pack', () => {
    const ok = {
      channel: 'stable',
      targets: ['darwin-arm64', 'linux-x64'],
      nodeVersion: '24.1.0',
    };
    expect(() => checkPackOptions(ok)).not.toThrow();
    for (const bad of [
      { ...ok, targets: ['win32-x64'] },
      { ...ok, targets: [] },
      { ...ok, channel: '../x' },
      { ...ok, version: '1.0.0; rm -rf ~' },
      { ...ok, nodeVersion: 'latest' },
    ])
      expect(() => checkPackOptions(bad)).toThrow(CommandError);
  });
});

describe('nocobase cli link', () => {
  it('makes the CLI a command that runs the client with its nocobase.cli and skills', async () => {
    const root = await createApp({
      bin: 'demo',
      displayName: 'Demo',
      skills: ['cli/skills'],
    });
    await writeSkill(path.join(root, 'cli', 'skills'), 'demo-cli');
    const application = await readCliApplication(root);
    const binDir = path.join(root, 'node_modules', '.bin');
    const linked = await linkCli(
      application,
      requireCliBrand(application),
      binDir,
    );
    expect(linked).toMatchObject({
      bin: 'demo',
      version: '1.2.3',
      command: path.join(binDir, 'demo'),
      skills: ['demo-cli'],
    });
    const { stdout } = await execFileAsync(linked.command, ['whoami']);
    expect(JSON.parse(stdout)).toEqual({
      root: await realpath(linked.packageDir),
      argv: ['whoami'],
      cli: { bin: 'demo', displayName: 'Demo' },
      version: '1.2.3',
    });
    expect(
      await readFile(
        path.join(linked.packageDir, 'skills', 'demo-cli', 'SKILL.md'),
        'utf8',
      ),
    ).toContain('name: demo-cli');

    // Linking again replaces its own link, but nothing else.
    await expect(
      linkCli(application, requireCliBrand(application), binDir),
    ).resolves.toMatchObject({ command: path.join(binDir, 'demo') });
    const other = path.join(root, 'other');
    await mkdir(other);
    await writeFile(path.join(other, 'demo'), '#!/bin/sh\n');
    await expect(
      linkCli(application, requireCliBrand(application), other),
    ).rejects.toMatchObject({ errorCode: 'CLI_LINK_EXISTS' });
  });
});

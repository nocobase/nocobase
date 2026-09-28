// @vitest-environment node
// A package the application depends on contributes commands through the real runner: they appear while the package is
// a direct dependency, its entry is imported only by the runs that need it, and a declared package nobody installed is
// named rather than reported as an unknown command.
import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, '..');
const bin = path.join(packageRoot, 'bin/run.js');
const LOADED = 'demo-cli entry imported';
let app: string;
let manifest: Record<string, unknown>;

beforeAll(async () => {
  app = await mkdtemp(path.join(os.tmpdir(), 'cli-packages-runner-'));
  manifest = {
    name: 'cli-packages-fixture',
    type: 'module',
    nocobase: { templateKind: 'default' },
    devDependencies: {
      '@nocobase/demo-cli': '1.0.0',
      '@nocobase/absent-cli': '1.0.0',
    },
  };
  await writeFile(path.join(app, 'package.json'), JSON.stringify(manifest));
  // The runner loads the application's TypeScript through tsx resolved from the application; the fixture borrows this
  // package's copy, beside the dependency it installs for real.
  await mkdir(path.join(app, 'node_modules', '@nocobase', 'demo-cli'), {
    recursive: true,
  });
  await symlink(
    path.join(packageRoot, 'node_modules', 'tsx'),
    path.join(app, 'node_modules', 'tsx'),
  );
  const index = JSON.stringify(
    pathToFileURL(path.join(packageRoot, 'src', 'index.ts')).href,
  );
  const demo = path.join(app, 'node_modules', '@nocobase', 'demo-cli');
  await writeFile(
    path.join(demo, 'package.json'),
    JSON.stringify({
      name: '@nocobase/demo-cli',
      type: 'module',
      nocobase: { cli: { entry: './cli' } },
      exports: { './cli': { import: './cli.js' } },
    }),
  );
  await writeFile(
    path.join(demo, 'cli.js'),
    `import { AppCommand, defineCliPlugin } from ${index};

process.stderr.write(${JSON.stringify(`${LOADED}\n`)});

class Greet extends AppCommand {
  static summary = 'Greets from a dependency.';
  static examples = ['<%= config.bin %> <%= command.id %>'];
  async run() {
    await this.parse(Greet);
    this.log('hello from demo');
    return { greeted: true };
  }
}

export default defineCliPlugin({
  packageName: '@nocobase/demo-cli',
  description: 'Commands from a dependency.',
  devCommands: { greet: Greet },
});
`,
  );
  await mkdir(path.join(app, 'cli', 'commands'), { recursive: true });
  await writeFile(
    path.join(app, 'cli', 'plugins.ts'),
    `import { defineCliPlugins } from ${index};\nexport default defineCliPlugins([]);\n`,
  );
  await writeFile(
    path.join(app, 'cli', 'commands', 'hello.ts'),
    `import { AppCommand } from ${index};

export default class Hello extends AppCommand {
  static override summary = 'Greets from the application.';
  public async run(): Promise<{ hello: boolean }> {
    await this.parse(Hello);
    return { hello: true };
  }
}
`,
  );
}, 60_000);

afterAll(async () => {
  await rm(app, { recursive: true, force: true });
});

async function nocobase(
  argv: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await run(process.execPath, [bin, ...argv], {
      cwd: app,
      env: { ...process.env, NOCOBASE_CONTENT_TYPE: '' },
    });
    return { stdout, stderr, code: 0 };
  } catch (error) {
    const failed = error as { stdout: string; stderr: string; code: number };
    return { stdout: failed.stdout, stderr: failed.stderr, code: failed.code };
  }
}

describe('commands from a CLI package the application depends on', () => {
  it('runs a command under the package topic', async () => {
    const result = await nocobase(['demo', 'greet', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'demo greet',
      result: { greeted: true },
    });
    expect(result.stderr).toContain(LOADED);
    expect(result.code).toBe(0);
  }, 60_000);

  it('runs a command under the package topic by its colon id, as oclif accepts one', async () => {
    const result = await nocobase(['demo:greet', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      result: { greeted: true },
    });
    expect(result.stderr).toContain(LOADED);
    expect(result.code).toBe(0);
  }, 60_000);

  it('does not import the package for another command', async () => {
    const result = await nocobase(['app', 'hello', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      result: { hello: true },
    });
    expect(result.stderr).not.toContain(LOADED);
  }, 60_000);

  it('lists the package commands with the package they came from', async () => {
    const result = await nocobase(['commands', '--json']);
    const { result: catalog } = JSON.parse(result.stdout) as {
      result: {
        commands: { id: string; source: string; package?: string }[];
      };
    };

    expect(catalog.commands).toContainEqual(
      expect.objectContaining({
        id: 'demo greet',
        source: 'plugin',
        package: '@nocobase/demo-cli',
      }),
    );
  }, 60_000);

  it('shows the package topic in help', async () => {
    const result = await nocobase(['--help']);

    expect(result.stdout).toMatch(/demo\s+Commands from a dependency\./);
  }, 60_000);

  it('names a declared package that is not installed', async () => {
    const result = await nocobase(['absent', 'go', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'PACKAGE_NOT_INSTALLED',
        message: expect.stringContaining('@nocobase/absent-cli'),
        suggestions: [
          expect.objectContaining({
            run: { command: 'pnpm', args: ['install'] },
          }),
        ],
      },
    });
    expect(result.code).toBe(1);
  }, 60_000);

  it('names a declared package that is not installed by its colon id too', async () => {
    const result = await nocobase(['absent:go', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      error: {
        code: 'PACKAGE_NOT_INSTALLED',
        message: expect.stringContaining('@nocobase/absent-cli'),
      },
    });
    expect(result.code).toBe(1);
  }, 60_000);

  it('drops the commands once the dependency is removed', async () => {
    const file = path.join(app, 'package.json');
    const original = await readFile(file, 'utf8');
    await writeFile(file, JSON.stringify({ ...manifest, devDependencies: {} }));
    try {
      const result = await nocobase(['demo', 'greet', '--json']);

      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_USAGE' },
      });
      expect(result.stderr).not.toContain(LOADED);
    } finally {
      await writeFile(file, original);
    }
  }, 60_000);
});

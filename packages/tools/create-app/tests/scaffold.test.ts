import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertTargetIsUsable,
  assertValidAppName,
  REQUIRED_PACKAGE_MANAGER,
  scaffoldFromTemplate,
} from '../src/lib/scaffold.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'create-app-test-'));
  created.push(directory);

  return directory;
}

async function createTemplate(
  files: Record<string, string> = {},
): Promise<string> {
  const directory = await createTempDirectory();

  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name: '@nocobase/app-template-default',
      displayName: 'Default Template',
      description: 'The default NocoBase application template.',
      version: '0.0.1-beta.2',
      dependencies: { knex: '^3.1.0' },
      publishConfig: { access: 'public' },
      repository: { type: 'git', url: 'git+https://example.com/repo.git' },
    }),
    'utf8',
  );

  for (const [name, contents] of Object.entries(files)) {
    const target = path.join(directory, name);

    // Fixtures name real template paths such as `client/runtime.ts`, so the directory has to exist first.
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
  }

  return directory;
}

describe('assertValidAppName', () => {
  it('accepts ordinary names', () => {
    expect(() => assertValidAppName('crm')).not.toThrow();
    expect(() => assertValidAppName('my-app')).not.toThrow();
    expect(() => assertValidAppName('app2')).not.toThrow();
  });

  /** The name is written into `package.json` and used as the directory, so both constraints apply. */
  it('rejects names npm would not accept', () => {
    expect(() => assertValidAppName('')).toThrow(/cannot be empty/u);
    expect(() => assertValidAppName('My-App')).toThrow(/not a valid app name/u);
    expect(() => assertValidAppName('-leading')).toThrow(
      /not a valid app name/u,
    );
  });

  it('rejects a path separator, which would escape the target directory', () => {
    expect(() => assertValidAppName('apps/crm')).toThrow(/path separator/u);
    expect(() => assertValidAppName('..\\crm')).toThrow(/path separator/u);
  });
});

describe('assertTargetIsUsable', () => {
  it('accepts a directory that does not exist yet', async () => {
    const parent = await createTempDirectory();

    await expect(
      assertTargetIsUsable(path.join(parent, 'new-app')),
    ).resolves.toBeUndefined();
  });

  it('accepts an existing empty directory', async () => {
    const directory = await createTempDirectory();

    await expect(assertTargetIsUsable(directory)).resolves.toBeUndefined();
  });

  it('refuses to overwrite a directory with contents', async () => {
    const directory = await createTempDirectory();
    await writeFile(path.join(directory, 'keep.txt'), 'x', 'utf8');

    await expect(assertTargetIsUsable(directory)).rejects.toThrow(
      /already exists and is not empty/u,
    );
  });
});

describe('scaffoldFromTemplate', () => {
  it('renames the manifest and strips the template identity', async () => {
    const templateDirectory = await createTemplate();
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const manifest = JSON.parse(
      await readFile(path.join(targetDirectory, 'package.json'), 'utf8'),
    );

    expect(manifest.name).toBe('crm');
    expect(manifest.publishConfig).toBeUndefined();
    expect(manifest.repository).toBeUndefined();

    // The server publishes displayName as `app.displayName`, and the shell renders it in the sidebar footer.
    // Dropping it made every generated app fall back to the shell's "Default Template" literal.
    expect(manifest.displayName).toBe('crm');
    expect(manifest.description).toBeUndefined();

    // The version records which template the app came from, so it is kept rather than reset.
    expect(manifest.version).toBe('0.0.1-beta.2');
    // Ranges were already resolved when the tarball was packed; rewriting them would undo that.
    expect(manifest.dependencies.knex).toBe('^3.1.0');
  });

  /**
   * A template upgrade diffs two releases of the template the application came from, so it has to know which one that
   * was. `name` has become the application's own by then, and `templateKind` is `app` for both Default and Examples,
   * which leaves nothing to resolve without this field.
   */
  it('records the template package the app was generated from', async () => {
    const templateDirectory = await createTemplate();
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const manifest = JSON.parse(
      await readFile(path.join(targetDirectory, 'package.json'), 'utf8'),
    );

    expect(manifest.nocobase.templatePackage).toBe(
      '@nocobase/app-template-default',
    );
  });

  /** The field is added beside what the template already declares rather than replacing the block. */
  it("keeps the template's own nocobase metadata", async () => {
    const templateDirectory = await createTemplate();

    await writeFile(
      path.join(templateDirectory, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-template-default',
        version: '1.0.0-beta.21',
        nocobase: {
          templateKind: 'app',
          defaultTemplateVersion: '1.0.0-beta.21',
        },
      }),
      'utf8',
    );

    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const manifest = JSON.parse(
      await readFile(path.join(targetDirectory, 'package.json'), 'utf8'),
    );

    expect(manifest.nocobase).toEqual({
      templateKind: 'app',
      defaultTemplateVersion: '1.0.0-beta.21',
      templatePackage: '@nocobase/app-template-default',
    });
  });

  /**
   * The client reads its i18n namespace from `client/runtime.ts` while the server reads the same namespace from
   * `package.json`, so a name left behind in the source splits `APP_NS` in half.
   */
  it('rewrites the template package name in the sources that embed it', async () => {
    const templateDirectory = await createTemplate({
      'client/runtime.ts':
        "const appRuntime = defineAppRuntime({\n  packageName: '@nocobase/app-template-default',\n});\n",
      'client/service-provider.ts':
        "  public readonly name: string = '@nocobase/app-template-default/client';\n",
      'server/providers/app-example.ts':
        "createServiceToken('@nocobase/app-template-default/example-service');\n",
    });
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const read = (relative: string) =>
      readFile(path.join(targetDirectory, relative), 'utf8');

    expect(await read('client/runtime.ts')).toContain("packageName: 'crm'");
    expect(await read('client/service-provider.ts')).toContain("'crm/client'");
    expect(await read('server/providers/app-example.ts')).toContain(
      "'crm/example-service'",
    );

    for (const relative of [
      'client/runtime.ts',
      'client/service-provider.ts',
      'server/providers/app-example.ts',
    ]) {
      expect(await read(relative)).not.toContain('app-template-default');
    }
  });

  /**
   * `MIGRATION.md` names the upstream template a derived application merges from. That reference is correct and
   * rewriting it to the app's own name would make the document describe something that does not exist.
   */
  it('leaves the template name in documentation alone', async () => {
    const templateDirectory = await createTemplate({
      'MIGRATION.md':
        'Merge source changes from `@nocobase/app-template-default`.\n',
    });
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    expect(
      await readFile(path.join(targetDirectory, 'MIGRATION.md'), 'utf8'),
    ).toContain('@nocobase/app-template-default');
  });

  /**
   * npm refuses to publish a `.gitignore`, so templates ship it under another name. Without restoring it the generated
   * project would commit `node_modules` and its `config.yml`.
   */
  it('restores .gitignore from the name npm allows', async () => {
    const templateDirectory = await createTemplate({
      '.npmignore': 'node_modules\nconfig.yml\n',
    });
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    expect(
      await readFile(path.join(targetDirectory, '.gitignore'), 'utf8'),
    ).toContain('node_modules');
  });

  // The templates configure the shadcn MCP server for each editor in dotfiles and dot-directories.
  it('copies dotfiles and dot-directories unchanged', async () => {
    const mcp = '{ "mcpServers": {} }\n';
    const templateDirectory = await createTemplate({
      '.mcp.json': mcp,
      '.cursor/mcp.json': mcp,
      '.vscode/mcp.json': '{ "servers": {} }\n',
    });
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    expect(
      await readFile(path.join(targetDirectory, '.mcp.json'), 'utf8'),
    ).toBe(mcp);
    expect(
      await readFile(path.join(targetDirectory, '.cursor/mcp.json'), 'utf8'),
    ).toBe(mcp);
    expect(
      await readFile(path.join(targetDirectory, '.vscode/mcp.json'), 'utf8'),
    ).toBe('{ "servers": {} }\n');
  });

  it('writes extra files, creating directories as needed', async () => {
    const templateDirectory = await createTemplate();
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
      extraFiles: {
        'config.yml': 'database:\n  default: main\n',
        'nested/file.txt': 'content',
      },
    });

    expect(
      await readFile(path.join(targetDirectory, 'config.yml'), 'utf8'),
    ).toBe('database:\n  default: main\n');
    expect(
      await readFile(path.join(targetDirectory, 'nested/file.txt'), 'utf8'),
    ).toBe('content');
  });

  it('creates the target when its parent does not exist', async () => {
    const templateDirectory = await createTemplate();
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'deep', 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    await expect(
      readFile(path.join(targetDirectory, 'package.json'), 'utf8'),
    ).resolves.toBeTruthy();
  });
});

describe('packageManager', () => {
  /**
   * `pnpm pack` strips this field from the tarball, so the template cannot pass it through and it has to be written
   * here. Without it the project runs on whatever pnpm the machine defaults to, and pnpm 10 ignores `allowBuilds`
   * entirely — the native driver installs without compiling and fails only at the first query.
   */
  it('pins the pnpm version in the generated app', async () => {
    const templateDirectory = await createTemplate();
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const manifest = JSON.parse(
      await readFile(path.join(targetDirectory, 'package.json'), 'utf8'),
    );

    expect(manifest.packageManager).toBe(REQUIRED_PACKAGE_MANAGER);
  });

  /**
   * `packageManager` accepts one exact version. A range is silently ignored rather than rejected, which would leave
   * the project on whatever pnpm the machine already had while looking pinned.
   */
  it('pins an exact version, since a range would be ignored', () => {
    expect(REQUIRED_PACKAGE_MANAGER).toMatch(/^pnpm@\d+\.\d+\.\d+$/u);
  });

  /** `allowBuilds` does not exist before pnpm 11, so an older version would not build the native driver. */
  it('requires pnpm 11 or newer', () => {
    const major = Number(
      /^pnpm@(\d+)/u.exec(REQUIRED_PACKAGE_MANAGER)?.[1] ?? '0',
    );

    expect(major).toBeGreaterThanOrEqual(11);
  });

  it('keeps a version the template already pinned', async () => {
    const templateDirectory = await createTemplate();
    await writeFile(
      path.join(templateDirectory, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-template-default',
        version: '0.0.1-beta.2',
        packageManager: 'pnpm@11.9.0',
      }),
      'utf8',
    );

    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const manifest = JSON.parse(
      await readFile(path.join(targetDirectory, 'package.json'), 'utf8'),
    );

    expect(manifest.packageManager).toBe('pnpm@11.9.0');
  });
});

describe('gitignore handling', () => {
  /**
   * The published `@nocobase/app-template-default` ships no ignore file of any name. Without a fallback the generated
   * project would put `node_modules` and the secret-bearing `config.yml` on its first commit.
   */
  it('writes a fallback when the template ships no ignore file', async () => {
    const templateDirectory = await createTemplate();
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const contents = await readFile(
      path.join(targetDirectory, '.gitignore'),
      'utf8',
    );

    expect(contents).toContain('node_modules');
    expect(contents).toContain('/config.yml');
    // `.nocobase/hub.json`, written by `hub remote add`, is meant to be committed.
    expect(contents).not.toContain('.nocobase');
    expect(contents).toContain('/.agents/');
    expect(contents).toContain('/.claude/skills/');
    // Generated by `collections generate` against whatever database the developer runs, for every connection.
    expect(contents).toContain('/database/*/collections/');
    // Written by this command for a hub, so a template has no particular reason to have ignored it.
    expect(contents).toContain('/.env');
  });

  it('prefers the template gitignore over the fallback', async () => {
    const templateDirectory = await createTemplate({
      gitignore: '# from template\ncustom-output/\n',
    });
    const parent = await createTempDirectory();
    const targetDirectory = path.join(parent, 'crm');

    await scaffoldFromTemplate({
      name: 'crm',
      targetDirectory,
      templateDirectory,
    });

    const contents = await readFile(
      path.join(targetDirectory, '.gitignore'),
      'utf8',
    );

    expect(contents).toContain('custom-output/');
    expect(contents).not.toContain('# Local application state.');
    expect(contents).toContain('/.agents/');
    // The skills sync writes this mirror, so an older template that never ignored it still gets the entry appended.
    expect(contents).toContain('/.claude/skills/');
    expect(contents).toContain('/.env');
  });
});

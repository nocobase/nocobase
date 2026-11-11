import { execFileSync } from 'node:child_process';
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
import { afterEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
  ensureWorkspaceApplications,
  readTemplateLayout,
} from '../src/lib/layout.ts';
import { scaffoldFromTemplate } from '../src/lib/scaffold.ts';

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixture(
  appDirectories: unknown = ['apps/admin', 'apps/lab'],
): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'create-workspace-'));
  temporary.push(root);
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: '@test/workspace',
      version: '1.0.0',
      nocobase: { templateKind: 'workspace', appDirectories },
      scripts: { 'dev:admin': 'pnpm --dir=apps/admin dev' },
    }),
  );
  await writeFile(
    path.join(root, 'pnpm-workspace.yaml'),
    'packages: [packages/*]\nallowBuilds:\n  esbuild: true\n',
  );
  for (const name of ['admin', 'lab']) {
    const dir = path.join(root, 'apps', name);
    await mkdir(path.join(dir, 'client'), { recursive: true });
    await writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: `@test/${name}`,
        version: '2.0.0',
        nocobase: {
          templateKind: 'app',
          templatePackage: '@nocobase/app-template-default',
        },
        dependencies: { '@nocobase/db-sqlite': '^1.0.0' },
      }),
    );
    await writeFile(
      path.join(dir, 'client/runtime.ts'),
      `export const packageName = '@test/${name}';\n`,
    );
    await writeFile(
      path.join(dir, 'gitignore'),
      '# template rule\ncustom-output/\n',
    );
    await writeFile(path.join(dir, '.mcp.json'), '{"mcpServers":{}}\n');
    await writeFile(
      path.join(dir, 'business.ts'),
      "export const templateId = 'reagents';\n",
    );
  }
  return root;
}

describe('workspace template layout', () => {
  it.each([
    undefined,
    [],
    'apps/admin',
    ['../outside'],
    ['/outside'],
    ['apps/../outside'],
    ['apps\\admin'],
    ['apps/admin', 'other/admin'],
    ['apps/admin', 'apps/admin/nested'],
    ['apps/admin', 'apps/admin'],
  ])(
    'rejects malformed or ambiguous runtime roots: %j',
    async (directories) => {
      const root = await fixture(
        directories === undefined ? null : directories,
      );
      await expect(readTemplateLayout(root)).rejects.toThrow();
    },
  );

  it('refuses linked runtime roots rather than reading outside the template', async () => {
    const root = await fixture(['apps/linked']);
    const external = await fixture();
    await symlink(
      path.join(external, 'apps/admin'),
      path.join(root, 'apps/linked'),
      'dir',
    );
    await expect(readTemplateLayout(root)).rejects.toThrow(/symbolic links/u);
  });

  it('enumerates declared Apps instead of hardcoding Main/Sub', async () => {
    const root = await fixture();
    expect(await readTemplateLayout(root)).toEqual({
      workspace: true,
      applications: [
        { directory: 'apps/admin', suffix: 'admin' },
        { directory: 'apps/lab', suffix: 'lab' },
      ],
    });
  });

  it('rewrites both package and translation identities but retains business and upstream identities', async () => {
    const source = await fixture();
    const target = path.join(
      source,
      '..',
      `${path.basename(source)}-generated`,
    );
    temporary.push(target);
    await scaffoldFromTemplate({
      templateDirectory: source,
      targetDirectory: target,
      name: 'research',
    });
    for (const name of ['admin', 'lab']) {
      const dir = path.join(target, 'apps', name);
      const manifest = JSON.parse(
        await readFile(path.join(dir, 'package.json'), 'utf8'),
      );
      expect(manifest).toMatchObject({
        name: `research-${name}`,
        private: true,
        nocobase: { templatePackage: '@nocobase/app-template-default' },
      });
      expect(
        await readFile(path.join(dir, 'client/runtime.ts'), 'utf8'),
      ).toContain(`'research-${name}'`);
      expect(await readFile(path.join(dir, 'business.ts'), 'utf8')).toContain(
        "'reagents'",
      );
      expect(await readFile(path.join(dir, '.mcp.json'), 'utf8')).toContain(
        'mcpServers',
      );
    }
    const workspace = parse(
      await readFile(path.join(target, 'pnpm-workspace.yaml'), 'utf8'),
    );
    expect(workspace).toMatchObject({
      packages: ['packages/*', 'apps/admin', 'apps/lab'],
      allowBuilds: { esbuild: true },
    });
    const manifest = JSON.parse(
      await readFile(path.join(target, 'package.json'), 'utf8'),
    );
    expect(manifest).toMatchObject({
      name: 'research',
      private: true,
      scripts: { 'dev:admin': 'pnpm --dir=apps/admin dev' },
    });
  });

  it('restores an inert workspace definition without losing catalogs, native policy or internal globs', async () => {
    const root = await fixture();
    await rm(path.join(root, 'pnpm-workspace.yaml'));
    await writeFile(
      path.join(root, 'pnpm-workspace.template.yaml'),
      'packages: [packages/*]\ncatalog:\n  typescript: ^5.9.0\nallowBuilds:\n  esbuild: false\nverifyDepsBeforeRun: false\n',
    );
    await ensureWorkspaceApplications(root, await readTemplateLayout(root));
    expect(
      parse(await readFile(path.join(root, 'pnpm-workspace.yaml'), 'utf8')),
    ).toEqual({
      packages: ['packages/*', 'apps/admin', 'apps/lab'],
      catalog: { typescript: '^5.9.0' },
      allowBuilds: { esbuild: false },
      verifyDepsBeforeRun: false,
    });
    await expect(
      readFile(path.join(root, 'pnpm-workspace.template.yaml')),
    ).rejects.toThrow(/ENOENT/u);
  });

  it('protects secrets, databases and generated Skills in every App while preserving source rules', async () => {
    const source = await fixture();
    const target = path.join(
      source,
      '..',
      `${path.basename(source)}-generated`,
    );
    temporary.push(target);
    await scaffoldFromTemplate({
      templateDirectory: source,
      targetDirectory: target,
      name: 'research',
    });
    execFileSync('git', ['init', '--quiet'], { cwd: target });
    for (const name of ['admin', 'lab']) {
      const prefix = `apps/${name}`;
      for (const relative of [
        'config.yml',
        'config.toml',
        '.env',
        '.env.local',
        'database.sqlite',
        'database.sqlite-wal',
        'storage/a.json',
        '.agents/skills/x/SKILL.md',
        '.agents/.skills-sync.json',
        '.claude/skills/x/SKILL.md',
      ]) {
        const file = `${prefix}/${relative}`;
        await mkdir(path.dirname(path.join(target, file)), { recursive: true });
        await writeFile(path.join(target, file), 'isolated fixture');
        expect(
          execFileSync('git', ['check-ignore', file], {
            cwd: target,
            encoding: 'utf8',
          }).trim(),
        ).toBe(file);
      }
      for (const relative of [
        '.agents/rules/guide.md',
        'database/main/migrations/initial.ts',
      ]) {
        const file = `${prefix}/${relative}`;
        await mkdir(path.dirname(path.join(target, file)), { recursive: true });
        await writeFile(path.join(target, file), 'source');
        expect(() =>
          execFileSync('git', ['check-ignore', '--quiet', file], {
            cwd: target,
          }),
        ).toThrow();
      }
    }
  });

  it('creates the root App and children without a second root identity rewrite', async () => {
    const source = await fixture();
    await mkdir(path.join(source, 'client'));
    await writeFile(
      path.join(source, 'client/runtime.ts'),
      "export const packageName = '@test/platform';\n",
    );
    await writeFile(
      path.join(source, 'package.json'),
      JSON.stringify({
        name: '@test/platform',
        version: '3.0.0',
        nocobase: { templateKind: 'app', appDirectories: ['.', 'apps/lab'] },
        scripts: {
          dev: 'nocobase dev',
          build: 'nocobase build',
          postinstall: 'nocobase skills sync',
        },
      }),
    );
    const target = path.join(source, '..', `${path.basename(source)}-root-app`);
    temporary.push(target);
    expect(
      await scaffoldFromTemplate({
        templateDirectory: source,
        targetDirectory: target,
        name: 'platform',
      }),
    ).toEqual({
      workspace: true,
      applications: [
        { directory: '.', suffix: '' },
        { directory: 'apps/lab', suffix: 'lab' },
      ],
    });
    const rootApp = JSON.parse(
      await readFile(path.join(target, 'package.json'), 'utf8'),
    );
    expect(rootApp).toMatchObject({
      name: 'platform',
      private: true,
      nocobase: {
        templateKind: 'app',
        templatePackage: '@test/platform',
        appDirectories: ['.', 'apps/lab'],
      },
      scripts: {
        dev: 'nocobase dev',
        build: 'nocobase build',
        postinstall: 'nocobase skills sync',
      },
    });
    expect(
      await readFile(path.join(target, 'client/runtime.ts'), 'utf8'),
    ).toContain("'platform'");
    expect(
      JSON.parse(
        await readFile(path.join(target, 'apps/lab/package.json'), 'utf8'),
      ).name,
    ).toBe('platform-lab');
    expect(
      parse(await readFile(path.join(target, 'pnpm-workspace.yaml'), 'utf8'))
        .packages,
    ).toEqual(['packages/*', 'apps/lab']);
    await expect(
      readFile(path.join(target, 'apps/lab/.gitignore')),
    ).resolves.toBeDefined();
  });

  it.each([
    ['apps/lab'],
    ['.', '.'],
    ['.', 'apps/lab', 'apps/lab/nested'],
    ['.', '../outside'],
    ['.', 'apps/lab', 'other/lab'],
  ])(
    'rejects unsafe or ambiguous child-App roots: %j',
    async (appDirectories) => {
      const source = await fixture();
      await writeFile(
        path.join(source, 'package.json'),
        JSON.stringify({
          name: '@test/platform',
          nocobase: { templateKind: 'app', appDirectories },
        }),
      );
      await expect(readTemplateLayout(source)).rejects.toThrow();
    },
  );

  it('keeps an ordinary root App unchanged and rejects root Apps in orchestration workspaces', async () => {
    const source = await fixture();
    await expect(readTemplateLayout(await fixture(['.']))).rejects.toThrow();
    await writeFile(
      path.join(source, 'package.json'),
      JSON.stringify({
        name: '@test/single',
        nocobase: { templateKind: 'app' },
      }),
    );
    expect(await readTemplateLayout(source)).toEqual({
      workspace: false,
      applications: [{ directory: '.', suffix: '' }],
    });
  });
});

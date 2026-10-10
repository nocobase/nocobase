import { createRequire } from 'node:module';
import { symlink } from 'node:fs/promises';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applySkillsSync,
  isOwnedSkillName,
  planSkillsSync,
  planPackageSkillRemovals,
  pluginSkillPrefix,
  removePackageSkills,
  resolveInstalledPlugins,
} from '../src/lib/skills-sync.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function createApp(
  registry: Record<string, { enabled: boolean }> = {},
): Promise<string> {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'nb3-skills-'));
  created.push(appRoot);
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({ name: 'demo-app' }),
  );
  await writeRegisteredPlugins(
    appRoot,
    Object.entries(registry)
      .filter(([, value]) => value.enabled)
      .map(([name]) => name),
  );
  return appRoot;
}

async function installPlugin(
  appRoot: string,
  packageName: string,
  skills: Record<string, string> = {},
): Promise<void> {
  const pluginRoot = path.join(appRoot, 'node_modules', packageName);
  await mkdir(pluginRoot, { recursive: true });
  await writeFile(
    path.join(pluginRoot, 'package.json'),
    JSON.stringify({ name: packageName, version: '1.0.0' }),
  );
  for (const [skillName, body] of Object.entries(skills)) {
    const skillRoot = path.join(pluginRoot, 'skills', skillName);
    await mkdir(skillRoot, { recursive: true });
    await writeFile(path.join(skillRoot, 'SKILL.md'), body);
  }
}

async function writeAppSkill(
  appRoot: string,
  skillName: string,
  body: string,
): Promise<void> {
  const skillRoot = path.join(appRoot, '.agents', 'skills', skillName);
  await mkdir(skillRoot, { recursive: true });
  await writeFile(path.join(skillRoot, 'SKILL.md'), body);
}

async function syncApp(appRoot: string, plugin?: string): Promise<void> {
  const { appPackageName, plugins } = await resolveInstalledPlugins({
    appRoot,
    plugin,
  });
  await applySkillsSync(
    await planSkillsSync({
      appPackageName,
      appRoot,
      plugins,
      pruneMissingPackages: plugin === undefined,
    }),
  );
}

describe('pluginSkillPrefix', () => {
  it('drops the scope and keeps the package name', () => {
    expect(pluginSkillPrefix('@nocobase/app-plugin-scheduler')).toBe(
      'nocobase-app-plugin-scheduler',
    );
  });

  it('rejects a package outside the scope', () => {
    expect(() => pluginSkillPrefix('scheduler')).toThrow('must start with');
  });

  it('claims its own name and its suffixed names only', () => {
    const prefix = 'nocobase-app-plugin-scheduler';
    expect(isOwnedSkillName(prefix, prefix)).toBe(true);
    expect(isOwnedSkillName(prefix, `${prefix}-trigger`)).toBe(true);
    expect(isOwnedSkillName(prefix, 'nocobase-app-plugin-other')).toBe(false);
  });
});

describe('skills synchronization', () => {
  it('copies every skill a registered plugin ships', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# main',
      'nocobase-app-plugin-demo-extra': '# extra',
    });

    await syncApp(appRoot);

    expect(
      (await readdir(path.join(appRoot, '.agents', 'skills'))).sort(),
    ).toEqual(['nocobase-app-plugin-demo', 'nocobase-app-plugin-demo-extra']);
  });

  it('replaces a locally modified skill, because upstream owns it', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# upstream',
    });
    await writeAppSkill(appRoot, 'nocobase-app-plugin-demo', '# edited');

    await syncApp(appRoot);

    const contents = await readFile(
      path.join(
        appRoot,
        '.agents',
        'skills',
        'nocobase-app-plugin-demo',
        'SKILL.md',
      ),
      'utf8',
    );
    expect(contents).toBe('# upstream');
  });

  it('removes a skill the plugin no longer ships', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# main',
    });
    await writeAppSkill(appRoot, 'nocobase-app-plugin-demo-gone', '# stale');

    await syncApp(appRoot);

    expect(await readdir(path.join(appRoot, '.agents', 'skills'))).toEqual([
      'nocobase-app-plugin-demo',
    ]);
  });

  it('never touches a directory the application owns', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# main',
    });
    await writeAppSkill(appRoot, 'my-own-skill', '# mine');

    await syncApp(appRoot);

    const contents = await readFile(
      path.join(appRoot, '.agents', 'skills', 'my-own-skill', 'SKILL.md'),
      'utf8',
    );
    expect(contents).toBe('# mine');
  });

  it('leaves another plugin’s skills alone when limited to one plugin', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-one': { enabled: true },
      '@nocobase/app-plugin-two': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-one', {
      'nocobase-app-plugin-one': '# one',
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-two', {
      'nocobase-app-plugin-two': '# two',
    });
    await writeAppSkill(appRoot, 'nocobase-app-plugin-two', '# existing two');

    await syncApp(appRoot, 'one');

    const contents = await readFile(
      path.join(
        appRoot,
        '.agents',
        'skills',
        'nocobase-app-plugin-two',
        'SKILL.md',
      ),
      'utf8',
    );
    expect(contents).toBe('# existing two');
  });

  it('rejects a skill directory outside the plugin prefix', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-something-else': '# wrong',
    });

    await expect(syncApp(appRoot)).rejects.toThrow('Invalid skill directory');
  });

  it('skips a plugin that ships no skills', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo');

    const { appPackageName, plugins } = await resolveInstalledPlugins({
      appRoot,
    });
    const plan = await planSkillsSync({ appPackageName, appRoot, plugins });

    expect(plan.copies).toEqual([]);
    expect(plan.removals).toEqual([]);
  });

  it('reports a plugin that is registered but not installed', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-missing': { enabled: true },
    });

    await expect(resolveInstalledPlugins({ appRoot })).rejects.toThrow(
      'is not installed',
    );
  });
});

async function writeRegisteredPlugins(
  appRoot: string,
  packages: string[],
): Promise<void> {
  await mkdir(path.join(appRoot, 'server'), { recursive: true });
  await mkdir(path.join(appRoot, 'node_modules'), { recursive: true });
  await symlink(
    path.dirname(
      createRequire(import.meta.url).resolve('typescript/package.json'),
    ),
    path.join(appRoot, 'node_modules/typescript'),
    'junction',
  );
  await writeFile(
    path.join(appRoot, 'server/plugins.ts'),
    packages
      .map((name, index) => `import p${index} from '${name}/server';`)
      .join('\n') +
      `\nexport default defineServerPlugins([${packages.map((_, index) => `p${index}`).join(', ')}]);`,
  );
}

describe('composition-based plugin discovery', () => {
  it('deduplicates both runtimes and ignores unused imports and legacy metadata', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-one': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-one');
    await installPlugin(appRoot, '@nocobase/app-plugin-two');
    await installPlugin(appRoot, '@nocobase/app-plugin-cli-only');
    await mkdir(path.join(appRoot, 'cli'), { recursive: true });
    await writeFile(
      path.join(appRoot, 'cli/plugins.ts'),
      `
      import cliOnly from '@nocobase/app-plugin-cli-only/cli';
      export default defineCliPlugins([cliOnly]);
    `,
    );
    await mkdir(path.join(appRoot, 'client'), { recursive: true });
    await writeFile(
      path.join(appRoot, 'client/plugins.ts'),
      `
      import one from '@nocobase/app-plugin-one/client';
      import two from '@nocobase/app-plugin-two/client/plugin';
      import unused from '@nocobase/app-plugin-unused/client';
      export default defineClientPlugins([one(), two({ example: true })]);
    `,
    );
    await writeFile(
      path.join(appRoot, 'package.json'),
      JSON.stringify({
        name: 'demo-app',
        nocobase: {
          plugins: { '@nocobase/app-plugin-unused': { enabled: true } },
        },
      }),
    );
    const result = await resolveInstalledPlugins({ appRoot });
    expect(result.plugins.map((plugin) => plugin.packageName)).toEqual([
      '@nocobase/app-plugin-cli-only',
      '@nocobase/app-plugin-one',
      '@nocobase/app-plugin-two',
    ]);
  });
});

async function declareDependencies(
  appRoot: string,
  sections: Record<string, Record<string, string>>,
): Promise<void> {
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({ name: 'demo-app', ...sections }),
  );
}

describe('NocoBase dependency skills', () => {
  it('discovers direct dependencies, dev dependencies and installed optional packages only', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await declareDependencies(appRoot, {
      dependencies: {
        '@nocobase/db': '1',
        '@nocobase/app-plugin-demo': '1',
        'another-package': '1',
      },
      devDependencies: { '@nocobase/app-skills': '1' },
      optionalDependencies: {
        '@nocobase/optional': '1',
        '@nocobase/missing-optional': '1',
      },
      peerDependencies: { '@nocobase/peer': '1' },
    });
    for (const name of [
      'db',
      'app-plugin-demo',
      'app-skills',
      'optional',
      'transitive',
      'peer',
    ]) {
      await installPlugin(appRoot, `@nocobase/${name}`);
    }
    const { plugins } = await resolveInstalledPlugins({ appRoot });
    expect(plugins.map(({ packageName }) => packageName)).toEqual([
      '@nocobase/app-plugin-demo',
      '@nocobase/app-skills',
      '@nocobase/db',
      '@nocobase/optional',
    ]);
  });

  it('copies general package skills without renaming the existing skill IDs', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      devDependencies: { '@nocobase/app-skills': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-development': '# develop',
      'nocobase-app-upgrade': '# upgrade',
    });
    await syncApp(appRoot);
    expect(
      await readFile(
        path.join(appRoot, '.agents/skills/nocobase-app-development/SKILL.md'),
        'utf8',
      ),
    ).toBe('# develop');
    expect(
      JSON.parse(
        await readFile(path.join(appRoot, '.agents/.skills-sync.json'), 'utf8'),
      ),
    ).toEqual({
      'nocobase-app-development': '@nocobase/app-skills',
      'nocobase-app-upgrade': '@nocobase/app-skills',
    });
  });

  it('removes tracked skills dropped upstream, without guessing ownership of local names', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-skills': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-development': '# develop',
    });
    await syncApp(appRoot);
    await writeAppSkill(appRoot, 'nocobase-app-skills-local', '# local');
    await rm(path.join(appRoot, 'node_modules/@nocobase/app-skills/skills'), {
      recursive: true,
    });
    await syncApp(appRoot);
    expect(await readdir(path.join(appRoot, '.agents/skills'))).toEqual([
      'nocobase-app-skills-local',
    ]);
  });

  it('cleans removed dependencies on a full sync, but preserves them on a targeted sync', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-skills': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-development': '# develop',
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# plugin',
    });
    await syncApp(appRoot);
    await declareDependencies(appRoot, {});
    await rm(path.join(appRoot, 'node_modules/@nocobase/app-skills'), {
      recursive: true,
    });
    await syncApp(appRoot, 'demo');
    expect(await readdir(path.join(appRoot, '.agents/skills'))).toContain(
      'nocobase-app-development',
    );
    await syncApp(appRoot);
    expect(await readdir(path.join(appRoot, '.agents/skills'))).toEqual([
      'nocobase-app-plugin-demo',
    ]);
  });

  it('rejects conflicting providers before modifying skills or ownership state', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/one': '1', '@nocobase/two': '1' },
    });
    await installPlugin(appRoot, '@nocobase/one', {
      'nocobase-shared': '# one',
    });
    await installPlugin(appRoot, '@nocobase/two', {
      'nocobase-shared': '# two',
    });
    await writeAppSkill(appRoot, 'nocobase-shared', '# before');
    await expect(syncApp(appRoot)).rejects.toThrow('Skill name collision');
    expect(
      await readFile(
        path.join(appRoot, '.agents/skills/nocobase-shared/SKILL.md'),
        'utf8',
      ),
    ).toBe('# before');
    await expect(
      readFile(path.join(appRoot, '.agents/.skills-sync.json')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects taking another package’s tracked skill during a targeted sync', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/one': '1' },
    });
    await installPlugin(appRoot, '@nocobase/one', {
      'nocobase-shared': '# one',
    });
    await syncApp(appRoot);
    await installPlugin(appRoot, '@nocobase/two', {
      'nocobase-shared': '# two',
    });
    const resolved = await resolveInstalledPlugins({
      appRoot,
      packageName: '@nocobase/two',
    });
    await expect(planSkillsSync(resolved)).rejects.toThrow(
      'Skill name collision',
    );
  });

  it('does not write or remove anything while planning a dry run', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-skills': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-development': '# develop',
    });
    await syncApp(appRoot);
    const before = await readFile(
      path.join(appRoot, '.agents/.skills-sync.json'),
      'utf8',
    );
    await declareDependencies(appRoot, {});
    const resolved = await resolveInstalledPlugins({ appRoot });
    const plan = await planSkillsSync({
      ...resolved,
      pruneMissingPackages: true,
    });
    expect(plan.removals.map(({ skillName }) => skillName)).toEqual([
      'nocobase-app-development',
    ]);
    expect(
      await readFile(path.join(appRoot, '.agents/.skills-sync.json'), 'utf8'),
    ).toBe(before);
    expect(await readdir(path.join(appRoot, '.agents/skills'))).toEqual([
      'nocobase-app-development',
    ]);
  });

  it('requires explicitly selected packages to be installed and in the NocoBase scope', async () => {
    const appRoot = await createApp();
    await expect(
      resolveInstalledPlugins({ appRoot, packageName: '@nocobase/missing' }),
    ).rejects.toThrow('is not installed');
    await expect(
      resolveInstalledPlugins({ appRoot, packageName: 'outside-scope' }),
    ).rejects.toThrow('must start with');
  });

  it('keeps local and plugin namespaces reserved when reading general package skills', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-skills': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'my-local-skill': '# invalid',
    });
    await expect(syncApp(appRoot)).rejects.toThrow('Invalid skill directory');
    await rm(path.join(appRoot, 'node_modules/@nocobase/app-skills/skills'), {
      recursive: true,
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-plugin-demo': '# invalid',
    });
    await expect(syncApp(appRoot)).rejects.toThrow('Invalid skill directory');
  });

  it('rejects unsafe ownership entries before touching the filesystem', async () => {
    const appRoot = await createApp();
    await mkdir(path.join(appRoot, '.agents'), { recursive: true });
    await writeFile(
      path.join(appRoot, '.agents/.skills-sync.json'),
      JSON.stringify({ '../../outside': '@nocobase/app-skills' }),
    );
    await expect(syncApp(appRoot)).rejects.toThrow('Invalid skills ownership');
  });
});

describe('Claude Code skill mirror', () => {
  it('links every synchronized skill so Claude Code discovers it', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# main',
      'nocobase-app-plugin-demo-extra': '# extra',
    });

    await syncApp(appRoot);

    expect(
      (await readdir(path.join(appRoot, '.claude', 'skills'))).sort(),
    ).toEqual(['nocobase-app-plugin-demo', 'nocobase-app-plugin-demo-extra']);
    const linkPath = path.join(
      appRoot,
      '.claude/skills/nocobase-app-plugin-demo',
    );
    expect((await lstat(linkPath)).isSymbolicLink()).toBe(true);
    expect(await readlink(linkPath)).toBe(
      path.join('..', '..', '.agents', 'skills', 'nocobase-app-plugin-demo'),
    );
    expect(await readFile(path.join(linkPath, 'SKILL.md'), 'utf8')).toBe(
      '# main',
    );
  });

  it('resolves through the link after a later sync replaces the skill', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# first',
    });
    await syncApp(appRoot);
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# second',
    });

    await syncApp(appRoot);

    expect(
      await readFile(
        path.join(appRoot, '.claude/skills/nocobase-app-plugin-demo/SKILL.md'),
        'utf8',
      ),
    ).toBe('# second');
  });

  it('drops the link when the skill is no longer synchronized', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# main',
      'nocobase-app-plugin-demo-extra': '# extra',
    });
    await syncApp(appRoot);
    await rm(
      path.join(
        appRoot,
        'node_modules/@nocobase/app-plugin-demo/skills/nocobase-app-plugin-demo-extra',
      ),
      { recursive: true },
    );

    await syncApp(appRoot);

    expect(await readdir(path.join(appRoot, '.claude', 'skills'))).toEqual([
      'nocobase-app-plugin-demo',
    ]);
  });

  it('leaves entries the application owns in place', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# main',
    });
    const ownSkill = path.join(appRoot, '.claude/skills/my-own-skill');
    await mkdir(ownSkill, { recursive: true });
    await writeFile(path.join(ownSkill, 'SKILL.md'), '# mine');

    await syncApp(appRoot);

    expect(
      (await readdir(path.join(appRoot, '.claude', 'skills'))).sort(),
    ).toEqual(['my-own-skill', 'nocobase-app-plugin-demo']);
    expect(await readFile(path.join(ownSkill, 'SKILL.md'), 'utf8')).toBe(
      '# mine',
    );
  });

  it('refuses to replace a real directory occupying a synchronized name', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo', {
      'nocobase-app-plugin-demo': '# main',
    });
    const occupied = path.join(
      appRoot,
      '.claude/skills/nocobase-app-plugin-demo',
    );
    await mkdir(occupied, { recursive: true });
    await writeFile(path.join(occupied, 'SKILL.md'), '# handwritten');

    await expect(syncApp(appRoot)).rejects.toThrow('is not a symbolic link');
    expect(await readFile(path.join(occupied, 'SKILL.md'), 'utf8')).toBe(
      '# handwritten',
    );
  });

  it('unlinks a removed package’s skills', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-skills': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-development': '# develop',
    });
    await syncApp(appRoot);

    await removePackageSkills(appRoot, '@nocobase/app-skills');

    expect(await readdir(path.join(appRoot, '.claude', 'skills'))).toEqual([]);
  });

  it('does not create the directory when there is nothing to link', async () => {
    const appRoot = await createApp({
      '@nocobase/app-plugin-demo': { enabled: true },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo');

    await syncApp(appRoot);

    await expect(readdir(path.join(appRoot, '.claude'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});

describe('package skill removal', () => {
  it('removes an uninstalled package’s copies and ownership while preserving other skills', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-skills': '1', '@nocobase/other': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-development': '# develop',
      'nocobase-app-upgrade': '# upgrade',
    });
    await installPlugin(appRoot, '@nocobase/other', {
      'nocobase-other': '# other',
    });
    await syncApp(appRoot);
    await writeAppSkill(appRoot, 'my-local-skill', '# local');
    await writeAppSkill(appRoot, 'nocobase-app-skills-custom', '# custom');
    await rm(path.join(appRoot, 'node_modules/@nocobase/app-skills'), {
      recursive: true,
    });

    const ownershipBefore = await readFile(
      path.join(appRoot, '.agents/.skills-sync.json'),
      'utf8',
    );
    expect(
      await planPackageSkillRemovals(appRoot, '@nocobase/app-skills'),
    ).toEqual(['nocobase-app-development', 'nocobase-app-upgrade']);
    expect(
      await readFile(path.join(appRoot, '.agents/.skills-sync.json'), 'utf8'),
    ).toBe(ownershipBefore);
    expect(
      await readFile(
        path.join(appRoot, '.agents/skills/nocobase-app-development/SKILL.md'),
        'utf8',
      ),
    ).toBe('# develop');

    expect(await removePackageSkills(appRoot, '@nocobase/app-skills')).toEqual([
      'nocobase-app-development',
      'nocobase-app-upgrade',
    ]);
    expect(
      (await readdir(path.join(appRoot, '.agents/skills'))).sort(),
    ).toEqual([
      'my-local-skill',
      'nocobase-app-skills-custom',
      'nocobase-other',
    ]);
    expect(
      JSON.parse(
        await readFile(path.join(appRoot, '.agents/.skills-sync.json'), 'utf8'),
      ),
    ).toEqual({ 'nocobase-other': '@nocobase/other' });
    expect(await removePackageSkills(appRoot, '@nocobase/app-skills')).toEqual(
      [],
    );
  });

  it('clears a stale ownership record even when its copied directory is already gone', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-skills': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-skills', {
      'nocobase-app-development': '# develop',
    });
    await syncApp(appRoot);
    await rm(path.join(appRoot, '.agents/skills/nocobase-app-development'), {
      recursive: true,
    });
    await removePackageSkills(appRoot, '@nocobase/app-skills');
    expect(
      JSON.parse(
        await readFile(path.join(appRoot, '.agents/.skills-sync.json'), 'utf8'),
      ),
    ).toEqual({});
  });

  it('uses legacy plugin prefixes without deleting a tracked sibling plugin’s skills', async () => {
    const appRoot = await createApp();
    await declareDependencies(appRoot, {
      dependencies: { '@nocobase/app-plugin-demo-provider': '1' },
    });
    await installPlugin(appRoot, '@nocobase/app-plugin-demo-provider', {
      'nocobase-app-plugin-demo-provider': '# provider',
    });
    await syncApp(appRoot);
    await writeAppSkill(appRoot, 'nocobase-app-plugin-demo', '# legacy');
    await writeAppSkill(
      appRoot,
      'nocobase-app-plugin-demo-extra',
      '# legacy extra',
    );
    expect(
      await removePackageSkills(appRoot, '@nocobase/app-plugin-demo'),
    ).toEqual(['nocobase-app-plugin-demo', 'nocobase-app-plugin-demo-extra']);
    expect(await readdir(path.join(appRoot, '.agents/skills'))).toEqual([
      'nocobase-app-plugin-demo-provider',
    ]);
    expect(
      JSON.parse(
        await readFile(path.join(appRoot, '.agents/.skills-sync.json'), 'utf8'),
      ),
    ).toEqual({
      'nocobase-app-plugin-demo-provider': '@nocobase/app-plugin-demo-provider',
    });
  });

  it('does not create generated directories when there is nothing to remove', async () => {
    const appRoot = await createApp();
    expect(await removePackageSkills(appRoot, '@nocobase/app-skills')).toEqual(
      [],
    );
    await expect(readdir(path.join(appRoot, '.agents'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});

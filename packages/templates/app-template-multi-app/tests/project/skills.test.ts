import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const payload = join(root, 'template');
const packageManifest = JSON.parse(
  await readFile(join(root, 'package.json'), 'utf8'),
);

const read = (path: string) => readFile(join(payload, path), 'utf8');

async function absent(path: string) {
  await expect(access(path)).rejects.toThrow();
}

describe('package-owned scenario guidance', () => {
  it('uses the standard dependency and synchronization mechanism in both Apps', async () => {
    expect(packageManifest.devDependencies['@nocobase/app-skills']).toBe(
      'workspace:*',
    );
    for (const prefix of ['', 'apps/sub/']) {
      const app = JSON.parse(await read(`${prefix}package.json`));
      expect(app.devDependencies['@nocobase/app-skills']).toBe('workspace:*');
      expect(app.scripts.postinstall).toBe('nocobase skills sync');
      const guide = await read(`${prefix}AGENTS.md`);
      expect(guide).toContain(
        '.agents/skills/nocobase-app-development/SKILL.md',
      );
      expect(guide).toContain('These Skills ship in `@nocobase/app-skills`');
      expect(guide).not.toMatch(
        /\.\.\/\.\.\/skills\/|workspace-owned|project-owned|Never synchronize from the workspace root/,
      );
      const ownership = await read(
        `${prefix}.agents/rules/multi-app-skills.md`,
      );
      expect(ownership).toContain('project root is Main');
      expect(ownership).toContain('compatible installed package Skills');
      expect(ownership).not.toContain('scenario Skill sources');
    }
  });

  it('does not ship or maintain a duplicate project-source Skills tree', async () => {
    await absent(join(root, 'skills'));
    await absent(join(payload, 'skills'));
    await absent(join(payload, 'apps/sub/skills'));
    await absent(join(payload, '.agents/skills'));
    const builder = await readFile(
      join(root, 'scripts/build-template.mjs'),
      'utf8',
    );
    expect(builder).toContain('await packAppManifest(');
    expect(builder).not.toContain('guidance.version');
    expect(builder).not.toContain("copy('skills'");
  });
  it('keeps generated guides consistent with root Main and protects both Docker installation stages', async () => {
    for (const prefix of ['', 'apps/sub/']) {
      for (const file of [
        'AGENTS.md',
        'README.MD',
        '.agents/rules/workspace.md',
        '.agents/rules/build-and-deploy.md',
        '.agents/rules/multi-app-skills.md',
      ]) {
        expect(await read(prefix + file)).not.toMatch(
          /apps\/main|setup:main|dev:main|build:main|skills\/README\.md|workspace-owned|project-owned/,
        );
      }
      const docker = await read(prefix + 'Dockerfile');
      expect(docker.match(/--mount=type=secret,id=npmrc/g)).toHaveLength(2);
      expect(await read(prefix + 'Dockerfile.dockerignore')).toContain(
        '**/.npmrc',
      );
    }
    expect(await read('README.MD')).toContain(
      'Root `pnpm dev` and `pnpm build` operate Main',
    );
  });
});

import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

const packageRoot = resolve(import.meta.dirname, '../..');

describe('@nocobase/app-plugin-mail Skill', () => {
  it('publishes the real App-facing Mail workflow', async () => {
    const [manifestSource, skillSource] = await Promise.all([
      readFile(resolve(packageRoot, 'package.json'), 'utf8'),
      readFile(
        resolve(packageRoot, 'skills/nocobase-app-plugin-mail/SKILL.md'),
        'utf8',
      ),
    ]);
    const manifest = JSON.parse(manifestSource) as {
      readonly exports?: Record<string, unknown>;
      readonly files?: readonly string[];
      readonly nocobase?: {
        readonly appConfig?: {
          readonly namespace?: string;
          readonly configFile?: string;
          readonly environmentVariables?: readonly string[];
        };
      };
    };

    expect(manifest.files).toContain('skills');
    expect(manifest.exports).not.toHaveProperty('./server/tokens');
    expect(manifest.exports).not.toHaveProperty('./server/types');
    expect(manifest.exports).toHaveProperty('./client/components');
    expect(manifest.exports).not.toHaveProperty('./client/plugin');
    expect(manifest.exports).not.toHaveProperty('./client/routes');
    expect(manifest.nocobase?.appConfig).toMatchObject({
      namespace: 'mail',
      configFile: 'server/config/mail.ts',
      environmentVariables: expect.arrayContaining(['MAIL_OAUTH_RETURN_URL']),
    });
    expect(skillSource).toMatch(/^---\nname: nocobase-app-plugin-mail\n/u);
  });

  it('keeps referenced guidance readable after copying the Skill into an App', async () => {
    const appRoot = await mkdtemp(join(tmpdir(), 'mail-skill-app-'));
    const skillRoot = resolve(
      appRoot,
      '.agents/skills/nocobase-app-plugin-mail',
    );
    try {
      await cp(
        resolve(packageRoot, 'skills/nocobase-app-plugin-mail'),
        skillRoot,
        { recursive: true },
      );
      const pending = [resolve(skillRoot, 'SKILL.md')];
      const visited = new Set<string>();
      while (pending.length > 0) {
        const file = pending.pop()!;
        if (visited.has(file)) continue;
        visited.add(file);
        const source = await readFile(file, 'utf8');
        expect(source.trim()).not.toBe('');
        expect(source).not.toMatch(/^\s*\[TODO:/mu);
        for (const match of source.matchAll(
          /\]\(([^)#]+\.md)(?:#[^)]*)?\)/gu,
        )) {
          const target = resolve(dirname(file), match[1]!);
          expect(target.startsWith(`${skillRoot}${sep}`)).toBe(true);
          pending.push(target);
        }
      }
      expect(visited.size).toBeGreaterThan(1);
    } finally {
      await rm(appRoot, { recursive: true, force: true });
    }
  });
});

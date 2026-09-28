import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import packageMetadata from '../package.json' with { type: 'json' };
import plugin from '../server/index.js';

describe('@nocobase/app-plugin-scheduler', () => {
  it('declares only its selected Server capabilities', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-scheduler',
      locales: expect.any(Function),
      serviceProviders: expect.any(Array),
      routes: expect.any(Array),
      database: {
        migrations: './database/migrations',
      },
    });
    // Scheduling runs on @nocobase/jobs; the plugin contributes no queue jobs.
    expect(plugin.queue).toBeUndefined();
  });

  it('publishes App Agent guidance for declaring and dispatching schedules', () => {
    const source = readFileSync(
      new URL(
        '../skills/nocobase-app-plugin-scheduler/SKILL.md',
        import.meta.url,
      ),
      'utf8',
    );
    expect(packageMetadata.files).toContain('skills');
    expect(source).toContain('name: nocobase-app-plugin-scheduler');
    const references = Array.from(
      source.matchAll(/\]\((references\/[^)]+)\)/g),
      (match) => match[1],
    );
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      const content = readFileSync(
        new URL(
          `../skills/nocobase-app-plugin-scheduler/${reference}`,
          import.meta.url,
        ),
        'utf8',
      );
      expect(content.trim().length).toBeGreaterThan(0);
    }
  });
});

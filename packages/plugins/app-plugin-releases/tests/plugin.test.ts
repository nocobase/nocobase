// @vitest-environment node
import { fileURLToPath } from 'node:url';

import { validateMigrations } from '@nocobase/db';
import { describe, expect, it } from 'vitest';

import plugin from '../server/index.js';

describe('@nocobase/app-plugin-releases', () => {
  it('declares its server capabilities', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-releases',
      locales: expect.any(Function),
      serviceProviders: expect.any(Array),
      routes: expect.any(Array),
      database: { migrations: './database/migrations' },
    });
  });

  it('ships valid migrations', async () => {
    const migrations = await validateMigrations(
      fileURLToPath(new URL('../database/migrations', import.meta.url)),
    );
    expect(migrations.map((migration) => migration.name)).toEqual([
      '202610020001_rel_create_tables',
      '202610100001_rel_variables_initial_admin',
      '202610170001_rel_drop_app_preview_values',
      '202610210001_rel_protected_requires_approval',
    ]);
  });
});

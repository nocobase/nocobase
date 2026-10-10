// @vitest-environment node
/**
 * A fresh installation started with `APP_SAMPLE_DATA=true` builds the demo once the whole application is ready, and
 * records it in the seed history; the deployment demo is built after it, and nothing of it reaches a code host.
 */
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createTestAppConfig } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { describe, expect, it, vi } from 'vitest';

import { createStandaloneServer } from '../../server/standalone.ts';
import { expectDeployDemo } from './deploy-demo-expectations.ts';

describe('the demo on a fresh installation', () => {
  it('is built with APP_SAMPLE_DATA=true and recorded once', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'studio-demo-install-'));
    const config = await createTestAppConfig({
      install: true,
      config: {
        auth: {
          secret: 'test-auth-secret-at-least-32-characters',
          trustedOrigins: ['http://localhost'],
        },
        secrets: {
          keys: [{ version: 1, key: randomBytes(32).toString('hex') }],
        },
        hub: { host: { enabled: false } },
        logging: { level: 'error', file: { enabled: false } },
      },
    });
    const sourceRoot = path.resolve(import.meta.dirname, '../..');
    const start = () =>
      createStandaloneServer({
        viteDevUrl: false,
        env: {
          APP_SAMPLE_DATA: 'true',
          APP_CONFIG_FILE: config.path,
          APP_STORAGE_DIR: path.join(directory, 'storage'),
        },
        paths: {
          rootDir: sourceRoot,
          serverDir: path.join(sourceRoot, 'server'),
          databaseDir: path.join(sourceRoot, 'database'),
          clientDir: path.join(sourceRoot, 'dist/client'),
          storageDir: path.join(directory, 'storage'),
        },
      });
    try {
      const server = await start();
      try {
        const query = server.application.container
          .resolve(databaseManagerToken)
          .connection().query;
        const projects = await query
          .selectFrom('pmProjects')
          .select('id')
          .execute();
        expect(projects.length).toBeGreaterThan(0);
        // The preset labels, in English without a configured locale, which the demo's own labels reuse.
        const labelNames = (
          await query.selectFrom('pmLabels').select('name').execute()
        ).map((row) => row.name);
        expect(labelNames).toEqual(
          expect.arrayContaining(['Bug', 'Feature', 'Backend', 'Frontend']),
        );
        expect(new Set(labelNames).size).toBe(labelNames.length);
        const recorded = await query
          .selectFrom('__nocobase_seeds')
          .select(['name', 'status'])
          .where('name', 'in', [
            'sample-data:studio/demo',
            'sample-data:studio/demo-deploy',
          ])
          .orderBy('name')
          .execute();
        expect(recorded).toEqual([
          { name: 'sample-data:studio/demo', status: 'executed' },
          { name: 'sample-data:studio/demo-deploy', status: 'executed' },
        ]);
        // No code host is ever asked for the demo connection's repositories.
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        try {
          await expectDeployDemo(server.application.container);
          const hosts = fetchSpy.mock.calls.map(([input]) =>
            String(input instanceof Request ? input.url : input),
          );
          expect(hosts.filter((url) => /github|\.invalid/u.test(url))).toEqual(
            [],
          );
        } finally {
          fetchSpy.mockRestore();
        }
      } finally {
        await server.close();
      }
    } finally {
      await config.dispose();
      rmSync(directory, { recursive: true, force: true });
    }
  }, 300_000);
});

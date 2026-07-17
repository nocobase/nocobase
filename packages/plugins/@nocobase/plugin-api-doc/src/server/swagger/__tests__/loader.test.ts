/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { loadSwagger } from '../loader';

describe('loadSwagger', () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const fixtureRoot of fixtureRoots.splice(0)) {
      rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  const createFixture = (files: Record<string, string>) => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'nocobase-swagger-loader-'));
    fixtureRoots.push(fixtureRoot);
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = join(fixtureRoot, relativePath);
      mkdirSync(join(filePath, '..'), { recursive: true });
      writeFileSync(filePath, content);
    }
    return fixtureRoot;
  };

  test('falls back to built JavaScript when no TypeScript require hook is registered', () => {
    const packageRoot = createFixture({
      'src/swagger/index.ts': `export default { paths: { '/source': {} } };`,
      'dist/swagger/index.js': `module.exports = { paths: { '/built': {} } };`,
    });

    expect(require.extensions['.ts']).toBeUndefined();
    expect(loadSwagger(packageRoot).paths).toHaveProperty('/built');
  });

  test('propagates errors from resolved Swagger modules', () => {
    const packageRoot = createFixture({
      'dist/swagger/index.js': `throw new Error('swagger module exploded');`,
    });

    expect(() => loadSwagger(packageRoot)).toThrow('swagger module exploded');
  });

  test('loads source TypeScript when a TypeScript require hook is registered', async () => {
    await import('tsx/cjs');
    const packageRoot = createFixture({
      'src/swagger/index.ts': `export default { paths: { '/source': {} } };`,
      'dist/swagger/index.js': `module.exports = { paths: { '/built': {} } };`,
    });

    expect(loadSwagger(packageRoot).paths).toHaveProperty('/source');
  });

  test.each([
    ['@nocobase/plugin-light-extension', '/lightExtensionFiles:saveSource'],
    ['@nocobase/plugin-vsc-file', '/runJSSources:save'],
  ])('loads an exported TypeScript Swagger entry from %s', (packageName, expectedPath) => {
    const swagger = loadSwagger(packageName);

    expect(swagger.paths).toHaveProperty(expectedPath);
  });
});

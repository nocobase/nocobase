/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { loadSwagger } from '../loader';

describe('loadSwagger', () => {
  beforeAll(async () => {
    await import('tsx/cjs');
    await import('tsconfig-paths/register');
  });

  test.each(['/jsTemplateFiles:saveSource', '/runJSSources:save', '/runJSSources:saveChanges'])(
    'loads %s from the JS Template source Swagger entry',
    (expectedPath) => {
      const swagger = loadSwagger('@nocobase/plugin-js-template');

      expect(swagger.paths).toHaveProperty(expectedPath);
    },
  );

  test('resolves the source and distribution Swagger directory exports', () => {
    expect(
      require
        .resolve('@nocobase/plugin-js-template/src/swagger')
        .endsWith(join('@nocobase', 'plugin-js-template', 'src', 'swagger', 'index.ts')),
    ).toBe(true);

    const packageJsonPath = require.resolve('@nocobase/plugin-js-template/package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    expect(packageJson.exports?.['./src/swagger']).toBe('./src/swagger/index.ts');
    expect(packageJson.exports?.['./dist/swagger']).toBe('./dist/swagger/index.js');
  });
});

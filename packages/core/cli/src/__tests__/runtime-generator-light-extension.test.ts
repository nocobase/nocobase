/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { OpenAPIV3 } from 'openapi-types';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import lightExtensionSwagger from '../../../../plugins/@nocobase/plugin-light-extension/src/swagger';
import { generateRuntime } from '../lib/runtime-generator.js';

test('generateRuntime exposes only the public top-level light-extension authoring commands', async () => {
  const runtime = await generateRuntime(
    lightExtensionSwagger as unknown as OpenAPIV3.Document,
    resolve('packages/core/cli/nocobase-ctl.config.json'),
  );

  expect(runtime.commands.map((command) => command.commandId)).toEqual([
    'light-extension-entries get',
    'light-extension-files get-file',
    'light-extension-files pull',
    'light-extension-files save-source',
    'light-extension-references read-references',
    'light-extension-repos get',
    'light-extension-repos list',
    'light-extensions compile-workspace-preview',
  ]);
});

test('generated light-extension save and preview commands expose body-file and precise source contract help', async () => {
  const runtime = await generateRuntime(
    lightExtensionSwagger as unknown as OpenAPIV3.Document,
    resolve('packages/core/cli/nocobase-ctl.config.json'),
  );
  const saveSource = runtime.commands.find((command) => command.commandId === 'light-extension-files save-source');
  const preview = runtime.commands.find(
    (command) => command.commandId === 'light-extensions compile-workspace-preview',
  );

  expect(saveSource).toMatchObject({
    pathTemplate: '/lightExtensionFiles:saveSource',
    hasBody: true,
    bodyRequired: true,
  });
  expect(saveSource?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'repoId', flagName: 'repo-id', in: 'body', required: true }),
      expect.objectContaining({
        name: 'expectedHeadCommitId',
        flagName: 'expected-head-commit-id',
        in: 'body',
        required: true,
      }),
      expect.objectContaining({ name: 'files', flagName: 'files', in: 'body', required: true, jsonEncoded: true }),
    ]),
  );
  expect(saveSource?.description).toContain('files is a delta');
  expect(saveSource?.description).toContain('`--body` / `--body-file`');
  expect(saveSource?.description).toContain('LIGHT_EXTENSION_SOURCE_OUTDATED');
  expect(saveSource?.examples.some((example) => example.includes('--body'))).toBe(true);

  expect(preview).toMatchObject({
    pathTemplate: '/lightExtensions:compileWorkspacePreview',
    hasBody: true,
    bodyRequired: true,
  });
  expect(preview?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'repoId', flagName: 'repo-id', required: true }),
      expect.objectContaining({ name: 'files', flagName: 'files', required: true, jsonEncoded: true }),
    ]),
  );
  expect(preview?.description).toContain('HTTP 200');
  expect(preview?.description).toContain('HTTP 207');
  expect(preview?.description).toContain('HTTP 422');
  expect(preview?.description).toContain('`--body` / `--body-file`');
});

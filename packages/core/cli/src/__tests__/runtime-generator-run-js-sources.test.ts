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
import runJSSourceSwagger from '../../../../plugins/@nocobase/plugin-vsc-file/src/swagger';
import { generateRuntime } from '../lib/runtime-generator.js';

test('generateRuntime exposes only public owner-aware RunJS source commands', async () => {
  const runtime = await generateRuntime(
    runJSSourceSwagger as unknown as OpenAPIV3.Document,
    resolve('packages/core/cli/nocobase-ctl.config.json'),
  );

  expect(runtime.commands.map((command) => command.commandId)).toEqual([
    'run-js-sources compile-preview',
    'run-js-sources open',
    'run-js-sources open-latest',
    'run-js-sources save',
  ]);
  expect(runtime.commands.map((command) => command.pathTemplate)).not.toEqual(
    expect.arrayContaining(['/runJSSources:restoreFromCode', '/runJSSources:importZip', '/vscFile:push']),
  );
});

test('generated preview and save commands expose body-file and the actual concurrency contract', async () => {
  const runtime = await generateRuntime(
    runJSSourceSwagger as unknown as OpenAPIV3.Document,
    resolve('packages/core/cli/nocobase-ctl.config.json'),
  );
  const preview = runtime.commands.find((command) => command.commandId === 'run-js-sources compile-preview');
  const save = runtime.commands.find((command) => command.commandId === 'run-js-sources save');

  expect(preview).toMatchObject({
    pathTemplate: '/runJSSources:compilePreview',
    hasBody: true,
    bodyRequired: true,
  });
  expect(preview?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'locator', flagName: 'locator', required: true, jsonEncoded: true }),
      expect.objectContaining({ name: 'baseCommitId', flagName: 'base-commit-id', required: false }),
      expect.objectContaining({ name: 'files', flagName: 'files', required: true, jsonEncoded: true }),
    ]),
  );

  expect(save).toMatchObject({
    pathTemplate: '/runJSSources:save',
    hasBody: true,
    bodyRequired: true,
  });
  expect(save?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'baseCommitId', flagName: 'base-commit-id', required: true }),
      expect.objectContaining({
        name: 'baseOwnerFingerprint',
        flagName: 'base-owner-fingerprint',
        required: true,
      }),
      expect.objectContaining({ name: 'files', flagName: 'files', required: true, jsonEncoded: true }),
    ]),
  );
  expect(save?.parameters).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ name: 'expectedHeadCommitId' })]),
  );
  expect(save?.description).toContain('complete snapshot');
  expect(save?.description).toContain('`--body` / `--body-file`');
});

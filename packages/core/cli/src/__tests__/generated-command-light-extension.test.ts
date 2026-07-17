/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { OpenAPIV3 } from 'openapi-types';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';
import lightExtensionSwagger from '../../../../plugins/@nocobase/plugin-light-extension/src/swagger';

const mocks = vi.hoisted(() => ({
  executeApiRequest: vi.fn(),
  applyPostProcessor: vi.fn(),
  ensureCrossEnvConfirmed: vi.fn(),
  readInstalledManagedSkillsVersion: vi.fn(),
  registerPostProcessors: vi.fn(),
}));

vi.mock('../lib/api-client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api-client.js')>();
  return {
    ...original,
    executeApiRequest: mocks.executeApiRequest,
  };
});

vi.mock('../lib/post-processors.js', () => ({
  applyPostProcessor: mocks.applyPostProcessor,
}));

vi.mock('../lib/env-guard.js', () => ({
  ensureCrossEnvConfirmed: mocks.ensureCrossEnvConfirmed,
}));

vi.mock('../lib/skills-manager.js', () => ({
  readInstalledManagedSkillsVersion: mocks.readInstalledManagedSkillsVersion,
}));

vi.mock('../post-processors/index.js', () => ({
  registerPostProcessors: mocks.registerPostProcessors,
}));

import { parseBody } from '../lib/api-client.js';
import { createGeneratedFlags, GeneratedApiCommand, type GeneratedOperation } from '../lib/generated-command.js';
import { generateRuntime } from '../lib/runtime-generator.js';

const saveSourceOperationPromise = generateRuntime(
  lightExtensionSwagger as unknown as OpenAPIV3.Document,
  resolve('packages/core/cli/nocobase-ctl.config.json'),
).then((runtime) => {
  const operation = runtime.commands.find((command) => command.commandId === 'light-extension-files save-source');
  if (!operation) {
    throw new Error('Generated light-extension save-source operation was not found.');
  }
  return operation;
});

function createSaveSourceCommand(operation: GeneratedOperation) {
  return class SaveSourceCommand extends GeneratedApiCommand {
    static override operation = operation;

    static override flags = createGeneratedFlags(operation);
  };
}

function createCommand(commandClass: ReturnType<typeof createSaveSourceCommand>, flags: Record<string, unknown>) {
  return Object.assign(Object.create(commandClass.prototype), {
    config: {
      pjson: {
        version: '2.2.0-beta.16',
      },
    },
    parse: vi.fn(async () => ({ flags })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ensureCrossEnvConfirmed.mockResolvedValue(true);
  mocks.readInstalledManagedSkillsVersion.mockResolvedValue('1.0.21');
  mocks.applyPostProcessor.mockImplementation(async (data: unknown) => data);
});

test('body-file preserves multi-file source text and an explicit null expected Head exactly', async () => {
  const saveSourceOperation = await saveSourceOperationPromise;
  const SaveSourceCommand = createSaveSourceCommand(saveSourceOperation);
  const flags = SaveSourceCommand.flags;
  expect(saveSourceOperation).toMatchObject({
    commandId: 'light-extension-files save-source',
    method: 'post',
    pathTemplate: '/lightExtensionFiles:saveSource',
    hasBody: true,
    bodyRequired: true,
    requestContentType: 'application/json',
  });
  expect(saveSourceOperation.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'expectedHeadCommitId',
        flagName: 'expected-head-commit-id',
        in: 'body',
        required: true,
        type: 'string',
      }),
      expect.objectContaining({
        name: 'files',
        flagName: 'files',
        in: 'body',
        required: true,
        type: 'array',
        jsonEncoded: true,
      }),
    ]),
  );
  expect(flags['expected-head-commit-id']).toBeTruthy();
  expect(flags['body-file']).toBeTruthy();

  const filePath = join(tmpdir(), `nocobase-light-extension-source-${Date.now()}.json`);
  const source = [
    'const greeting = "你好，NocoBase";',
    'const quoted = \'single and "double"\';',
    'const template = `line 1\\n${greeting}\\nline 3`;',
    'export default template;',
    '',
  ].join('\n');
  const payload = {
    repoId: 'repo-1',
    expectedHeadCommitId: null,
    message: '保存 Unicode 与模板字符串',
    files: [
      {
        path: 'src/client/runjs/example/index.ts',
        content: source,
      },
    ],
  };
  await fs.writeFile(filePath, JSON.stringify(payload), 'utf8');

  try {
    const body = await parseBody({ 'body-file': filePath }, saveSourceOperation);
    expect(body).toEqual(payload);
    expect(body).toMatchObject({
      expectedHeadCommitId: null,
      files: [{ content: source }],
    });
  } finally {
    await fs.unlink(filePath).catch(() => undefined);
  }
});

test('generated command exits with the complete 422 diagnostics response', async () => {
  const saveSourceOperation = await saveSourceOperationPromise;
  const SaveSourceCommand = createSaveSourceCommand(saveSourceOperation);
  mocks.executeApiRequest.mockResolvedValue({
    ok: false,
    status: 422,
    data: {
      errors: [
        {
          code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
          message: 'Light extension source cannot be compiled',
          status: 422,
          details: {
            diagnostics: [
              {
                code: 'typescript_error',
                severity: 'error',
                message: 'Unexpected token',
                path: 'src/client/js-blocks/orders/index.tsx',
                line: 7,
                column: 13,
              },
            ],
          },
        },
      ],
    },
  });
  const command = createCommand(SaveSourceCommand, { yes: true, 'json-output': true });

  await expect(SaveSourceCommand.prototype.run.call(command)).rejects.toThrow(
    /Request failed with status 422[\s\S]*LIGHT_EXTENSION_VALIDATION_FAILED[\s\S]*typescript_error[\s\S]*orders\/index\.tsx[\s\S]*"line": 7[\s\S]*"column": 13/,
  );
  expect(mocks.executeApiRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      operation: expect.objectContaining({
        method: 'post',
        pathTemplate: '/lightExtensionFiles:saveSource',
        parameters: saveSourceOperation.parameters,
        hasBody: true,
        bodyRequired: true,
        requestContentType: 'application/json',
      }),
    }),
  );
});

test('generated command exits with LIGHT_EXTENSION_SOURCE_OUTDATED and both Head values on 409', async () => {
  const saveSourceOperation = await saveSourceOperationPromise;
  const SaveSourceCommand = createSaveSourceCommand(saveSourceOperation);
  mocks.executeApiRequest.mockResolvedValue({
    ok: false,
    status: 409,
    data: {
      errors: [
        {
          code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
          message: 'Light extension source changed after the workspace was opened',
          status: 409,
          details: {
            repoId: 'repo-1',
            expectedHeadCommitId: 'head-opened',
            currentHeadCommitId: 'head-current',
          },
        },
      ],
    },
  });
  const command = createCommand(SaveSourceCommand, { yes: true, 'json-output': true });

  await expect(SaveSourceCommand.prototype.run.call(command)).rejects.toThrow(
    /Request failed with status 409[\s\S]*LIGHT_EXTENSION_SOURCE_OUTDATED[\s\S]*head-opened[\s\S]*head-current/,
  );
  expect(mocks.executeApiRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      operation: expect.objectContaining({
        pathTemplate: '/lightExtensionFiles:saveSource',
        parameters: saveSourceOperation.parameters,
      }),
    }),
  );
});

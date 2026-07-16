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
import runJSSourceSwagger from '../../../../plugins/@nocobase/plugin-vsc-file/src/swagger';

const mocks = vi.hoisted(() => ({
  executeApiRequest: vi.fn(),
  applyPostProcessor: vi.fn(),
  ensureCrossEnvConfirmed: vi.fn(),
  readInstalledManagedSkillsVersion: vi.fn(),
  registerPostProcessors: vi.fn(),
}));

vi.mock('../lib/api-client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api-client.js')>();
  return { ...original, executeApiRequest: mocks.executeApiRequest };
});
vi.mock('../lib/post-processors.js', () => ({ applyPostProcessor: mocks.applyPostProcessor }));
vi.mock('../lib/env-guard.js', () => ({ ensureCrossEnvConfirmed: mocks.ensureCrossEnvConfirmed }));
vi.mock('../lib/skills-manager.js', () => ({
  readInstalledManagedSkillsVersion: mocks.readInstalledManagedSkillsVersion,
}));
vi.mock('../post-processors/index.js', () => ({ registerPostProcessors: mocks.registerPostProcessors }));

import { parseBody } from '../lib/api-client.js';
import { createGeneratedFlags, GeneratedApiCommand, type GeneratedOperation } from '../lib/generated-command.js';
import { generateRuntime } from '../lib/runtime-generator.js';

const saveOperationPromise = generateRuntime(
  runJSSourceSwagger as unknown as OpenAPIV3.Document,
  resolve('packages/core/cli/nocobase-ctl.config.json'),
).then((runtime) => {
  const operation = runtime.commands.find((command) => command.commandId === 'run-js-sources save');
  if (!operation) {
    throw new Error('Generated run-js-sources save operation was not found.');
  }
  return operation;
});

function createSaveCommand(operation: GeneratedOperation) {
  return class SaveCommand extends GeneratedApiCommand {
    static override operation = operation;
    static override flags = createGeneratedFlags(operation);
  };
}

function createCommand(commandClass: ReturnType<typeof createSaveCommand>, flags: Record<string, unknown>) {
  return Object.assign(Object.create(commandClass.prototype), {
    config: { pjson: { version: '2.2.0-beta.16' } },
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

test('body-file preserves a guarded complete RunJS workspace snapshot exactly', async () => {
  const operation = await saveOperationPromise;
  const SaveCommand = createSaveCommand(operation);
  const source = [
    'const greeting = "你好，NocoBase";',
    'const template = `line 1\\n${greeting}`;',
    'ctx.render(template);',
    '',
  ].join('\n');
  const payload = {
    locator: {
      kind: 'flowModel.step',
      modelUid: 'fm_orders',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    },
    repoId: 'repo-1',
    baseCommitId: 'commit-1',
    baseOwnerFingerprint: 'owner:fm_orders:v1',
    message: '保存完整工作区',
    files: [
      { path: '.nocobase/runjs-source.json', content: '{"entry":"src/client/index.tsx"}\n' },
      { path: 'src/client/index.tsx', content: source },
    ],
    entryPath: 'src/client/index.tsx',
    version: 'v2',
  };
  const filePath = join(tmpdir(), `nocobase-run-js-source-${Date.now()}.json`);
  await fs.writeFile(filePath, JSON.stringify(payload), 'utf8');

  try {
    expect(SaveCommand.flags['body-file']).toBeTruthy();
    const body = await parseBody({ 'body-file': filePath }, operation);
    expect(body).toEqual(payload);
    expect(body).toMatchObject({
      baseCommitId: 'commit-1',
      baseOwnerFingerprint: 'owner:fm_orders:v1',
      files: [{ path: '.nocobase/runjs-source.json' }, { content: source }],
    });
  } finally {
    await fs.unlink(filePath).catch(() => undefined);
  }
});

test('generated command preserves stale Head diagnostics from HTTP 409', async () => {
  const operation = await saveOperationPromise;
  const SaveCommand = createSaveCommand(operation);
  mocks.executeApiRequest.mockResolvedValue({
    ok: false,
    status: 409,
    data: {
      errors: [
        {
          code: 'BASE_COMMIT_OUTDATED',
          message: 'RunJS workspace Head changed after it was opened',
          status: 409,
          details: { expected: 'commit-current', received: 'commit-opened' },
        },
      ],
    },
  });
  const command = createCommand(SaveCommand, { yes: true, 'json-output': true });

  await expect(SaveCommand.prototype.run.call(command)).rejects.toThrow(
    /Request failed with status 409[\s\S]*BASE_COMMIT_OUTDATED[\s\S]*commit-current[\s\S]*commit-opened/,
  );
});

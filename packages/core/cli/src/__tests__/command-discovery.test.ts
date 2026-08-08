/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { relative, resolve } from 'node:path';

import { expect, test } from 'vitest';

import { collectCommandModulePaths, commandRelativePathToRegistryKey } from '../lib/command-discovery.js';
import {
  JS_TEMPLATE_CLI_COMMAND_CONTRACT,
  JS_TEMPLATE_WORKSPACE_API_PATHS,
} from '../lib/js-template-command-contract.js';

test('commandRelativePathToRegistryKey maps index modules to parent commands', () => {
  expect(commandRelativePathToRegistryKey('api/resource/index.ts')).toBe('api:resource');
  expect(commandRelativePathToRegistryKey('api/resource/list.ts')).toBe('api:resource:list');
  expect(commandRelativePathToRegistryKey('license/index.ts')).toBe('license');
  expect(commandRelativePathToRegistryKey('license/id.ts')).toBe('license:id');
  expect(commandRelativePathToRegistryKey('license/generate-id.ts')).toBe('license:generate-id');
  expect(commandRelativePathToRegistryKey('license/plugins/index.ts')).toBe('license:plugins');
  expect(commandRelativePathToRegistryKey('license/plugins/clean.ts')).toBe('license:plugins:clean');
  expect(commandRelativePathToRegistryKey('license/plugins/sync.ts')).toBe('license:plugins:sync');
  expect(commandRelativePathToRegistryKey('revision/create.ts')).toBe('revision:create');
  expect(commandRelativePathToRegistryKey('js-template/pull.ts')).toBe('js-template:pull');
});

test('discovers the canonical JS Template commands', async () => {
  const commandsRoot = resolve('packages/core/cli/src/commands');
  const registryKeys = (await collectCommandModulePaths(commandsRoot, '.ts')).map((filePath) =>
    commandRelativePathToRegistryKey(relative(commandsRoot, filePath)),
  );

  expect(JS_TEMPLATE_CLI_COMMAND_CONTRACT).toEqual({
    workspaceTopic: 'js-template',
    workspaceCommands: ['pull', 'check', 'save'],
    apiModule: 'js-template',
  });
  for (const command of JS_TEMPLATE_CLI_COMMAND_CONTRACT.workspaceCommands) {
    expect(registryKeys).toContain(`js-template:${command}`);
  }
  expect(JS_TEMPLATE_WORKSPACE_API_PATHS).toEqual({
    templateGet: '/jsTemplates:get',
    filesPull: '/jsTemplateFiles:pull',
    compileWorkspacePreview: '/jsTemplates:compileWorkspacePreview',
    filesSaveSource: '/jsTemplateFiles:saveSource',
  });
});

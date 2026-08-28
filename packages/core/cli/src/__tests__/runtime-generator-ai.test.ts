/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import aiSwaggerDocument from '../../../../plugins/@nocobase/plugin-ai/src/swagger';
import { generateRuntime } from '../lib/runtime-generator.js';

const configFile = resolve('packages/core/cli/nocobase-ctl.config.json');

const getCommand = async (commandId: string) => {
  const runtime = await generateRuntime(aiSwaggerDocument, configFile);
  const command = runtime.commands.find((item) => item.commandId === commandId);
  expect(command, `Missing command: ${commandId}`).toBeTruthy();
  if (!command) {
    throw new Error(`Missing command: ${commandId}`);
  }
  return command;
};

describe('AI runtime generator', () => {
  it('generates the approved AI command tree only', async () => {
    const runtime = await generateRuntime(aiSwaggerDocument, configFile);

    expect(runtime.commands.map((command) => command.commandId)).toEqual([
      'ai employees create',
      'ai employees destroy',
      'ai employees get',
      'ai employees list',
      'ai employees update',
      'ai llm-providers list-llm-providers',
      'ai llm-providers list-llm-services',
      'ai llm-providers list-models',
      'ai llm-providers list-provider-models',
      'ai llm-providers test-flight',
      'ai llm-services create',
      'ai llm-services destroy',
      'ai llm-services get',
      'ai llm-services list',
      'ai llm-services update',
    ]);
    expect(new Set(runtime.commands.map((command) => command.commandId)).size).toBe(runtime.commands.length);
    expect(runtime.commands.some((command) => command.commandId === 'ai llm-services move')).toBe(false);
    expect(runtime.commands.some((command) => command.commandId === 'ai employees move')).toBe(false);
    expect(runtime.commands.some((command) => command.commandId === 'ai employees get-templates')).toBe(false);
    expect(runtime.commands.some((command) => command.commandId.startsWith('ai tools '))).toBe(false);
    expect(runtime.commands.some((command) => command.commandId.startsWith('ai skills '))).toBe(false);
    expect(runtime.commands.some((command) => command.commandId.startsWith('ai settings '))).toBe(false);
  });

  it('generates repeatable fields flags for AI collection lists', async () => {
    for (const commandId of ['ai llm-services list', 'ai employees list']) {
      const command = await getCommand(commandId);
      expect(command.parameters).toContainEqual(
        expect.objectContaining({ flagName: 'fields', in: 'query', type: 'array', isArray: true }),
      );
    }
  });

  it('generates JSON body flags for provider discovery and strict LLM service writes', async () => {
    const providerModels = await getCommand('ai llm-providers list-provider-models');
    expect(providerModels.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flagName: 'provider', in: 'body', required: true }),
        expect.objectContaining({ flagName: 'options', in: 'body', required: true, jsonEncoded: true }),
        expect.objectContaining({ flagName: 'model', in: 'body', required: false }),
      ]),
    );

    const create = await getCommand('ai llm-services create');
    const flags = create.parameters.map((parameter) => parameter.flagName);
    expect(flags).toEqual(['name', 'title', 'provider', 'options', 'enabled-models', 'enabled']);
    expect(create.parameters.find((parameter) => parameter.flagName === 'options')).toMatchObject({
      type: 'object',
      jsonEncoded: true,
    });
    expect(create.parameters.find((parameter) => parameter.flagName === 'enabled-models')).toMatchObject({
      type: 'object',
      jsonEncoded: true,
    });
    expect(flags).not.toContain('model-options');
  });

  it('does not generate server-managed AI employee write flags', async () => {
    for (const commandId of ['ai employees create', 'ai employees update']) {
      const command = await getCommand(commandId);
      const flags = command.parameters.map((parameter) => parameter.flagName);
      expect(flags).not.toEqual(
        expect.arrayContaining([
          'built-in',
          'category',
          'deprecated',
          'chat-settings',
          'data-source-settings',
          'skill-settings',
        ]),
      );
      expect(flags).toEqual(
        expect.arrayContaining([
          'username',
          'nickname',
          'avatar',
          'model-settings',
          'enable-knowledge-base',
          'knowledge-base',
          'enabled',
        ]),
      );
    }
  });
});

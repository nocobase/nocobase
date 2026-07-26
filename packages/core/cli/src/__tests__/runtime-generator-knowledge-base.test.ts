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
import knowledgeBaseSwaggerDocument from './fixtures/knowledge-base-openapi.js';
import { generateRuntime } from '../lib/runtime-generator.js';

const configFile = resolve('packages/core/cli/nocobase-ctl.config.json');

const getRuntime = () => generateRuntime(knowledgeBaseSwaggerDocument, configFile);

const getCommand = async (commandId: string) => {
  const runtime = await getRuntime();
  const command = runtime.commands.find((item) => item.commandId === commandId);
  expect(command, `Missing command: ${commandId}`).toBeTruthy();
  if (!command) {
    throw new Error(`Missing command: ${commandId}`);
  }
  return command;
};

describe('knowledge base runtime generator', () => {
  it('flattens knowledge base actions at kb root and keeps related resources nested', async () => {
    const runtime = await getRuntime();

    expect(runtime.commands.map((command) => command.commandId)).toEqual([
      'kb create',
      'kb destroy',
      'kb documents destroy',
      'kb documents get',
      'kb documents list',
      'kb documents upload',
      'kb documents vectorization',
      'kb get',
      'kb list',
      'kb list-external-vector-store-providers',
      'kb run-hit-test',
      'kb update',
      'kb vector-databases create',
      'kb vector-databases destroy',
      'kb vector-databases get',
      'kb vector-databases list',
      'kb vector-databases list-providers',
      'kb vector-databases test-connection',
      'kb vector-databases update',
    ]);
    expect(new Set(runtime.commands.map((command) => command.commandId)).size).toBe(runtime.commands.length);
    expect(runtime.commands.some((command) => command.commandId.startsWith('kb knowledge-bases '))).toBe(false);
    expect(runtime.commands.some((command) => command.commandId.startsWith('kb segments '))).toBe(false);
    expect(runtime.commands.some((command) => command.commandId.startsWith('kb tasks '))).toBe(false);
  });

  it('generates repeatable fields flags for knowledge base collection lists', async () => {
    for (const commandId of ['kb vector-databases list', 'kb list', 'kb documents list']) {
      const command = await getCommand(commandId);
      expect(command.parameters).toContainEqual(
        expect.objectContaining({ flagName: 'fields', in: 'query', type: 'array', isArray: true }),
      );
    }
  });

  it('generates JSON body flags for connection testing, knowledge base writes, and hit testing', async () => {
    const connection = await getCommand('kb vector-databases test-connection');
    expect(connection.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flagName: 'provider', in: 'body', required: true }),
        expect.objectContaining({ flagName: 'connect-props', in: 'body', required: true, jsonEncoded: true }),
      ]),
    );
    expect(connection.parameters.some((parameter) => parameter.in === 'query')).toBe(false);

    const create = await getCommand('kb create');
    expect(create.parameters.map((parameter) => parameter.flagName)).toEqual(
      expect.arrayContaining([
        'knowledge-base-type',
        'key',
        'name',
        'enabled',
        'storage-id',
        'vector-database-key',
        'llm-service',
        'embedding-model',
        'segment-options',
        'vector-store-provider',
        'vector-store-props',
      ]),
    );

    const hitTest = await getCommand('kb run-hit-test');
    expect(hitTest.parameters.map((parameter) => parameter.flagName)).toEqual([
      'knowledge-base-key',
      'query',
      'top-k',
      'score',
    ]);
    expect(hitTest.parameters.every((parameter) => parameter.in === 'body')).toBe(true);
  });

  it('generates multipart upload flags without JSON body modes', async () => {
    const upload = await getCommand('kb documents upload');

    expect(upload.requestContentType).toBe('multipart/form-data');
    expect(upload.hasBody).toBe(true);
    expect(upload.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flagName: 'knowledge-base-key', in: 'query', required: true }),
        expect.objectContaining({ flagName: 'file', in: 'body', required: true, isFile: true }),
        expect.objectContaining({ flagName: 'zip-filename-encoding', in: 'body', required: false, type: 'array' }),
      ]),
    );
    expect(upload.parameters.map((parameter) => parameter.flagName)).not.toEqual(
      expect.arrayContaining(['body', 'body-file']),
    );

    const vectorization = await getCommand('kb documents vectorization');
    expect(vectorization.hasBody).toBe(false);
    expect(vectorization.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flagName: 'knowledge-base-key', in: 'query', required: true }),
        expect.objectContaining({ flagName: 'id', in: 'query', isArray: true }),
      ]),
    );
  });
  it('keeps command IDs unique when AI and knowledge base Swagger are aggregated', async () => {
    const combinedDocument = {
      ...knowledgeBaseSwaggerDocument,
      info: {
        title: 'NocoBase AI and knowledge base API',
        version: '1.0.0',
      },
      tags: [...aiSwaggerDocument.tags, ...knowledgeBaseSwaggerDocument.tags],
      paths: {
        ...aiSwaggerDocument.paths,
        ...knowledgeBaseSwaggerDocument.paths,
      },
      components: {
        schemas: {
          ...aiSwaggerDocument.components.schemas,
          ...knowledgeBaseSwaggerDocument.components.schemas,
        },
      },
    };
    const runtime = await generateRuntime(combinedDocument, configFile);
    const commandIds = runtime.commands.map((command) => command.commandId);

    expect(commandIds).toHaveLength(34);
    expect(new Set(commandIds).size).toBe(commandIds.length);
  });
});

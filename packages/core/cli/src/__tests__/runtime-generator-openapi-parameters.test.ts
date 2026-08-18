/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createGeneratedFlags, type GeneratedOperation } from '../lib/generated-command.js';
import type { OpenApiDocument } from '../lib/openapi.js';
import { generateRuntime } from '../lib/runtime-generator.js';

const syntheticDocument = {
  openapi: '3.0.2',
  info: {
    title: 'Synthetic CLI parameter contracts',
    version: '1.0.0',
  },
  paths: {
    '/syntheticRecords:createOne': {
      post: {
        summary: 'Create one synthetic record',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'payload'],
                properties: {
                  title: { type: 'string' },
                  count: { type: 'number' },
                  enabled: { type: 'boolean' },
                  payload: {
                    oneOf: [
                      {
                        type: 'object',
                        required: ['label', 'nested'],
                        properties: {
                          label: { type: 'string' },
                          nested: {
                            type: 'object',
                            properties: {
                              message: { type: 'string' },
                            },
                          },
                        },
                        example: {
                          label: 'A value with "quotes" and spaces',
                          nested: { message: 'nested value' },
                        },
                      },
                      { type: 'null' },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/syntheticRecords:createBatch': {
      post: {
        summary: 'Create a batch of synthetic records',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['metadata', 'records'],
                properties: {
                  metadata: {
                    oneOf: [{ type: 'object', additionalProperties: true }, { type: 'null' }],
                  },
                  records: {
                    anyOf: [{ type: 'array', items: { type: 'object' } }, { type: 'null' }],
                  },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
  },
} as unknown as OpenApiDocument;

let configDirectory: string;
let commands: GeneratedOperation[];

function findCommand(commandId: string): GeneratedOperation {
  const command = commands.find((candidate) => candidate.commandId === commandId);
  if (!command) {
    throw new Error(`Generated command "${commandId}" was not found`);
  }
  return command;
}

beforeAll(async () => {
  configDirectory = await mkdtemp(join(tmpdir(), 'nocobase-cli-openapi-parameters-'));
  const configFile = join(configDirectory, 'config.json');
  await writeFile(
    configFile,
    JSON.stringify({
      modules: {
        synthetic: {
          name: 'synthetic',
          include: true,
          resources: {
            includes: ['syntheticRecords'],
            overrides: {
              syntheticRecords: {
                name: 'synthetic-records',
                topLevel: true,
              },
            },
          },
        },
      },
    }),
  );
  commands = (await generateRuntime(syntheticDocument, configFile)).commands;
});

afterAll(async () => {
  await rm(configDirectory, { recursive: true, force: true });
});

describe('runtime generator OpenAPI parameter contracts', () => {
  it('infers composite JSON body fields without degrading primitive fields', () => {
    const createOne = findCommand('synthetic-records create-one');
    const parameters = new Map(createOne.parameters.map((parameter) => [parameter.flagName, parameter]));

    expect(parameters.get('title')).toMatchObject({ type: 'string', jsonEncoded: false });
    expect(parameters.get('count')).toMatchObject({ type: 'number', jsonEncoded: false });
    expect(parameters.get('enabled')).toMatchObject({ type: 'boolean', jsonEncoded: false });
    expect(parameters.get('payload')).toMatchObject({
      type: 'object',
      isArray: false,
      jsonEncoded: true,
    });

    const createBatch = findCommand('synthetic-records create-batch');
    const batchParameters = new Map(createBatch.parameters.map((parameter) => [parameter.flagName, parameter]));
    expect(batchParameters.get('metadata')).toMatchObject({ type: 'object', isArray: false, jsonEncoded: true });
    expect(batchParameters.get('records')).toMatchObject({ type: 'array', isArray: true, jsonEncoded: true });
  });

  it('emits POSIX-shell JSON examples without escaping double quotes inside single quotes', () => {
    const createOne = findCommand('synthetic-records create-one');
    const payloadExample = createOne.examples.find((example) => example.includes('--payload'));
    const rawBodyExample = createOne.examples.find((example) => example.includes('--body '));

    expect(payloadExample).toContain(`--payload '{"key":"value"}'`);
    expect(rawBodyExample).toContain(`--body '{"title":"value","payload":{"key":"value"}}'`);
    expect(createOne.examples.join('\n')).not.toContain('\\\\"');
  });

  it('uses a body file example for multiple complex fields while retaining executable field flags', () => {
    const createBatch = findCommand('synthetic-records create-batch');

    expect(createBatch.examples).toEqual(['nb api synthetic-records create-batch --body-file <path>']);
    expect(createBatch.parameters.map((parameter) => parameter.flagName)).toEqual(['metadata', 'records', 'note']);

    const flags = createGeneratedFlags(createBatch);
    expect(flags.metadata.helpGroup).toBe('Body Field');
    expect(flags.records.helpGroup).toBe('Body Field');
    expect(flags.note.helpGroup).toBe('Body Field');
    expect(flags['body-file'].helpGroup).toBe('Raw JSON Body');
  });
});

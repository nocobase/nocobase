/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from 'vitest';
import { Command } from '@oclif/core';
import { parseBody, type RequestOperation } from '../lib/api-client.js';
import { createGeneratedFlags, type GeneratedOperation } from '../lib/generated-command.js';
import { buildExamples } from '../lib/runtime-generator.js';

const testApiOperation: GeneratedOperation = {
  commandId: 'test api',
  method: 'post',
  pathTemplate: '/test:api',
  parameters: [
    {
      name: 'primaryValue',
      flagName: 'primary-value',
      in: 'body',
      required: true,
      type: 'string',
    },
    {
      name: 'items',
      flagName: 'items',
      in: 'body',
      required: true,
      type: 'array',
      isArray: true,
      jsonEncoded: true,
    },
  ],
  hasBody: true,
  bodyRequired: true,
  examples: [],
};

class ParseOnlyTestApiCommand extends Command {
  static override flags = createGeneratedFlags(testApiOperation);

  async run() {
    return this.parse(ParseOnlyTestApiCommand);
  }
}

test('body JSON path should not require body field flags at parse time', async () => {
  const result = await ParseOnlyTestApiCommand.run(['--body', '{"primaryValue":"ok","items":[]}']);
  expect(result.flags).toEqual({
    body: '{"primaryValue":"ok","items":[]}',
    'json-output': true,
    verbose: false,
  });
});

test('body-file path should not require inline body or body field flags at parse time', async () => {
  const result = await ParseOnlyTestApiCommand.run(['--body-file', '/tmp/test-api.json']);
  expect(result.flags['body-file']).toBe('/tmp/test-api.json');
  expect(result.flags.body).toBe(undefined);
});

test('parseBody should still enforce required body fields when flag mode is used', async () => {
  const operation: RequestOperation = {
    method: 'post',
    pathTemplate: '/test:api',
    parameters: testApiOperation.parameters,
    hasBody: true,
    bodyRequired: true,
  };

  await expect((() => parseBody({ 'primary-value': 'ok' }, operation))()).rejects.toThrow(/Missing required body field --items/);
});

test('parseBody should accept raw body JSON without checking sibling flags', async () => {
  const operation: RequestOperation = {
    method: 'post',
    pathTemplate: '/test:api',
    parameters: testApiOperation.parameters,
    hasBody: true,
    bodyRequired: true,
  };

  const body = await parseBody({ body: '{"primaryValue":"ok","items":[]}' }, operation);
  expect(body).toEqual({ primaryValue: 'ok', items: [] });
});

test('parseBody should parse --body-file with UTF-8 BOM', async () => {
  const operation: RequestOperation = {
    method: 'post',
    pathTemplate: '/test:api',
    parameters: testApiOperation.parameters,
    hasBody: true,
    bodyRequired: true,
  };

  const filePath = join(tmpdir(), `nocobase-cli-body-${Date.now()}.json`);
  await fs.writeFile(filePath, '\ufeff{"primaryValue":"ok","items":[]}', 'utf8');

  try {
    const body = await parseBody({ 'body-file': filePath }, operation);
    expect(body).toEqual({ primaryValue: 'ok', items: [] });
  } finally {
    await fs.unlink(filePath).catch(() => undefined);
  }
});

test('parseBody should reject invalid JSON for json-encoded body fields', async () => {
  const operation: RequestOperation = {
    method: 'post',
    pathTemplate: '/test:api',
    parameters: testApiOperation.parameters,
    hasBody: true,
    bodyRequired: true,
  };

  await expect((() => parseBody({ 'primary-value': 'ok', items: '[{name:item}]' }, operation))()).rejects.toThrow(/Invalid JSON for --items/);
});

test('parseBody should describe conflicting raw body and body flags clearly', async () => {
  const operation: RequestOperation = {
    method: 'post',
    pathTemplate: '/test:api',
    parameters: testApiOperation.parameters,
    hasBody: true,
    bodyRequired: true,
  };

  await expect((() => parseBody({ body: '{"primaryValue":"ok","items":[]}', 'primary-value': 'ok' }, operation))()).rejects.toThrow(/Conflicting request body inputs: received --body together with body field flags \(--primary-value\)/);
});

test('buildExamples should not mix required body flags with --body examples', () => {
  const examples = buildExamples('test api', {
    parameters: testApiOperation.parameters,
    hasBody: true,
  });

  expect(examples).toEqual([
    "nb api test api --primary-value <value> --items '[]'",
    `nb api test api --body '{"primaryValue":"value","items":[]}'`,
  ]);
});

test('createGeneratedFlags should group body, raw JSON body, and global flags separately for help output', () => {
  const flags = createGeneratedFlags(testApiOperation);

  expect(flags['primary-value'].helpGroup).toBe('Body Field');
  expect(flags.items.helpGroup).toBe('Body Field');
  expect(flags.body.helpGroup).toBe('Raw JSON Body');
  expect(flags['body-file'].helpGroup).toBe('Raw JSON Body');
  expect(flags.env.helpGroup).toBe('Global');
  expect(flags['api-base-url'].helpGroup).toBe('Global');
});

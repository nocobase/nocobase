import assert from 'node:assert/strict';
import test from 'node:test';
import { Command } from '@oclif/core';
import { parseBody, type RequestOperation } from '../src/lib/api-client.js';
import { createGeneratedFlags, type GeneratedOperation } from '../src/lib/generated-command.js';
import { buildExamples } from '../src/lib/runtime-generator.js';

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
  assert.deepEqual(result.flags, {
    body: '{"primaryValue":"ok","items":[]}',
    'json-output': true,
    verbose: false,
  });
});

test('body-file path should not require inline body or body field flags at parse time', async () => {
  const result = await ParseOnlyTestApiCommand.run(['--body-file', '/tmp/test-api.json']);
  assert.equal(result.flags['body-file'], '/tmp/test-api.json');
  assert.equal(result.flags.body, undefined);
});

test('parseBody should still enforce required body fields when flag mode is used', async () => {
  const operation: RequestOperation = {
    method: 'post',
    pathTemplate: '/test:api',
    parameters: testApiOperation.parameters,
    hasBody: true,
    bodyRequired: true,
  };

  await assert.rejects(() => parseBody({ 'primary-value': 'ok' }, operation), /Missing required body field --items/);
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
  assert.deepEqual(body, { primaryValue: 'ok', items: [] });
});

test('parseBody should describe conflicting raw body and body flags clearly', async () => {
  const operation: RequestOperation = {
    method: 'post',
    pathTemplate: '/test:api',
    parameters: testApiOperation.parameters,
    hasBody: true,
    bodyRequired: true,
  };

  await assert.rejects(
    () => parseBody({ body: '{"primaryValue":"ok","items":[]}', 'primary-value': 'ok' }, operation),
    /Conflicting request body inputs: received --body together with body field flags \(--primary-value\)/,
  );
});

test('buildExamples should not mix required body flags with --body examples', () => {
  const examples = buildExamples('test api', {
    parameters: testApiOperation.parameters,
    hasBody: true,
  });

  assert.deepEqual(examples, [
    'nb api test api --primary-value <value> --items value1 --items value2',
    `nb api test api --body '{"primaryValue":"value","items":[]}'`,
  ]);
});

test('createGeneratedFlags should group body, raw JSON body, and global flags separately for help output', () => {
  const flags = createGeneratedFlags(testApiOperation);

  assert.equal(flags['primary-value'].helpGroup, 'Body Field');
  assert.equal(flags.items.helpGroup, 'Body Field');
  assert.equal(flags.body.helpGroup, 'Raw JSON Body');
  assert.equal(flags['body-file'].helpGroup, 'Raw JSON Body');
  assert.equal(flags.env.helpGroup, 'Global');
  assert.equal(flags['base-url'].helpGroup, 'Global');
});

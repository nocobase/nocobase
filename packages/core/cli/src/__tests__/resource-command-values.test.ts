/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  executeRawApiRequest: vi.fn(),
}));

vi.mock('../lib/api-client.js', () => ({
  executeRawApiRequest: mocks.executeRawApiRequest,
}));

import { executeResourceRequest } from '../lib/resource-request.js';
import { buildCreateArgs, buildUpdateArgs, createFlags } from '../lib/resource-command.js';

function createFlagsInput(values: string, extra: Record<string, any> = {}) {
  return {
    resource: 'users',
    values,
    ...extra,
  };
}

test('create accepts a JSON object and passes it through unchanged', () => {
  const args = buildCreateArgs(createFlagsInput('{"nickname":"Ada","age":36}'));

  expect(args.values).toEqual({ nickname: 'Ada', age: 36 });
  expect(Array.isArray(args.values)).toBe(false);
});

test('create keeps the rest of the object payload behavior untouched', () => {
  const args = buildCreateArgs(
    createFlagsInput('{"nickname":"Ada"}', {
      'data-source': 'external',
      'source-id': '1',
      whitelist: ['nickname'],
      blacklist: ['id'],
    }),
  );

  expect(args).toEqual({
    resource: 'users',
    dataSource: 'external',
    sourceId: '1',
    values: { nickname: 'Ada' },
    whitelist: ['nickname'],
    blacklist: ['id'],
  });
});

test('create accepts a JSON array so a single request can write multiple records', () => {
  const args = buildCreateArgs(createFlagsInput('[{"nickname":"Ada"},{"nickname":"Grace"}]'));

  expect(Array.isArray(args.values)).toBe(true);
  expect(args.values).toEqual([{ nickname: 'Ada' }, { nickname: 'Grace' }]);
});

test('create accepts an empty JSON array', () => {
  const args = buildCreateArgs(createFlagsInput('[]'));

  expect(args.values).toEqual([]);
});

test('create rejects a JSON array that contains non-object items', () => {
  expect(() => buildCreateArgs(createFlagsInput('[{"nickname":"Ada"},"Grace"]'))).toThrow(
    '--values array items must all be JSON objects, but item 1 is not',
  );
  expect(() => buildCreateArgs(createFlagsInput('[null]'))).toThrow(
    '--values array items must all be JSON objects, but item 0 is not',
  );
  expect(() => buildCreateArgs(createFlagsInput('[[{"nickname":"Ada"}]]'))).toThrow(
    '--values array items must all be JSON objects, but item 0 is not',
  );
});

test('create still rejects scalars and null with a clear message', () => {
  for (const input of ['"Ada"', '42', 'null', 'true']) {
    expect(() => buildCreateArgs(createFlagsInput(input))).toThrow(
      '--values must be a JSON object, or a JSON array of objects to create multiple records',
    );
  }
});

test('create still rejects malformed JSON', () => {
  expect(() => buildCreateArgs(createFlagsInput('{nickname:'))).toThrow(/^Invalid JSON for --values: /);
});

test('create documents array support on the --values flag', () => {
  expect(createFlags.values.description).toContain('JSON array');
});

test('update keeps rejecting arrays because its values are a single field patch', () => {
  expect(() =>
    buildUpdateArgs({
      resource: 'users',
      'filter-by-tk': '1',
      values: '[{"nickname":"Ada"}]',
    }),
  ).toThrow('--values must be a JSON object');
});

test('update still accepts a JSON object', () => {
  const args = buildUpdateArgs({
    resource: 'users',
    'filter-by-tk': '1',
    values: '{"nickname":"Grace"}',
  });

  expect(args.values).toEqual({ nickname: 'Grace' });
  expect(args.filterByTk).toBe('1');
});

test('an array reaches the request body as an array, which is what the server reads as multiple records', async () => {
  mocks.executeRawApiRequest.mockReset();
  mocks.executeRawApiRequest.mockResolvedValue({ ok: true, status: 200, data: [] });

  await executeResourceRequest({
    action: 'create',
    args: buildCreateArgs(createFlagsInput('[{"nickname":"Ada"},{"nickname":"Grace"}]')),
  });

  const request = mocks.executeRawApiRequest.mock.calls[0][0];
  expect(request.method).toBe('POST');
  expect(request.path).toBe('/users:create');
  expect(request.body).toEqual([{ nickname: 'Ada' }, { nickname: 'Grace' }]);
});

test('an object still reaches the request body as an object', async () => {
  mocks.executeRawApiRequest.mockReset();
  mocks.executeRawApiRequest.mockResolvedValue({ ok: true, status: 200, data: {} });

  await executeResourceRequest({
    action: 'create',
    args: buildCreateArgs(createFlagsInput('{"nickname":"Ada"}')),
  });

  const request = mocks.executeRawApiRequest.mock.calls[0][0];
  expect(request.body).toEqual({ nickname: 'Ada' });
  expect(Array.isArray(request.body)).toBe(false);
});

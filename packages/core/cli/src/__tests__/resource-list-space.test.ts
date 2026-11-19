/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Parser } from '@oclif/core';
import { expect, test, vi } from 'vitest';
import { executeRawApiRequest } from '../lib/api-client.js';
import {
  buildListArgs,
  createFlags,
  destroyFlags,
  getFlags,
  listFlags,
  queryFlags,
  updateFlags,
} from '../lib/resource-command.js';
import { executeResourceRequest } from '../lib/resource-request.js';

vi.mock('../lib/api-client.js', () => ({ executeRawApiRequest: vi.fn() }));

async function list(argv: string[]) {
  const { flags } = await Parser.parse(['--resource', 'orders', ...argv], { flags: listFlags });
  await executeResourceRequest({ action: 'list', args: buildListArgs(flags) });
}

test('list sends the selected space alongside the data source and filter', async () => {
  const filter = '{"status":"open"}';
  await list(['--space', 'sales', '--data-source', 'external', '--filter', filter]);
  expect(executeRawApiRequest).toHaveBeenLastCalledWith(
    expect.objectContaining({
      headers: { 'x-data-source': 'external', 'x-spaces': 'sales', 'x-spaces-view': 'sales' },
      query: { filter },
    }),
  );
});

test('only the list command exposes --space', () => {
  expect(listFlags).toHaveProperty('space');
  for (const flags of [getFlags, createFlags, updateFlags, destroyFlags, queryFlags]) {
    expect(flags).not.toHaveProperty('space');
  }
});

test('list without --space keeps its existing request', async () => {
  await list(['--page', '2']);
  expect(executeRawApiRequest).toHaveBeenLastCalledWith(
    expect.objectContaining({
      headers: {},
      query: { page: 2 },
    }),
  );
});

test.each(['', '   ', 'sales,ops'])('list rejects an invalid space %j before sending a request', async (space) => {
  vi.mocked(executeRawApiRequest).mockClear();
  await expect(list(['--space', space])).rejects.toThrow(/--space/);
  expect(executeRawApiRequest).not.toHaveBeenCalled();
});

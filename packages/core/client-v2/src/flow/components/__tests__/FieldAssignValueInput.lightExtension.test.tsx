/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFieldAssignLightExtensionMetaTree } from '../FieldAssignValueInput';
import { RunJSSourceResolverRegistry } from '../runjs-source';

describe('FieldAssignValueInput light extension menu', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('adds repository and entry levels that produce a light extension RunJS value', async () => {
    const listSourceMenuItems = vi.fn(async () => [
      {
        key: 'light-extension',
        label: 'Light extensions',
        disabled: true,
      },
      {
        key: 'repo:repo_orders',
        label: 'Orders',
        children: [
          {
            key: 'entry:entry_total',
            label: 'Order total',
            onSelect: ({ params, defaultParams }) => ({
              ...defaultParams,
              ...params,
              sourceMode: 'light-extension',
              sourceBinding: {
                type: 'light-extension-entry',
                repoId: 'repo_orders',
                entryId: 'entry_total',
                entryPath: 'src/client/runjs/order-total/index.ts',
                kind: 'runjs',
              },
              settings: { currency: 'USD' },
            }),
          },
        ],
      },
    ]);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({ code: 'return 1;', version: 'v2' }),
      listSourceMenuItems,
    });

    const tree = await createFieldAssignLightExtensionMetaTree(
      { code: 'return 0;', version: 'v2' },
      (key) => key,
      () => <div />,
    );

    expect(listSourceMenuItems).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'runjs',
        sourceMode: 'inline',
      }),
    );
    expect(tree).toMatchObject({
      name: 'light-extension',
      paths: ['light-extension'],
      children: [
        {
          name: 'repo:repo_orders',
          paths: ['light-extension', 'repo:repo_orders'],
          children: [
            {
              name: 'entry:entry_total',
              paths: ['light-extension', 'repo:repo_orders', 'entry:entry_total'],
              options: {
                runJSValue: {
                  code: 'return 0;',
                  version: 'v2',
                  sourceMode: 'light-extension',
                  sourceBinding: {
                    repoId: 'repo_orders',
                    entryId: 'entry_total',
                  },
                  settings: { currency: 'USD' },
                },
              },
            },
          ],
        },
      ],
    });
  });

  it('leaves the regular value menu usable when light extension entries fail to load', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({ code: 'return 1;', version: 'v2' }),
      listSourceMenuItems: async () => {
        throw new Error('request failed');
      },
    });

    await expect(
      createFieldAssignLightExtensionMetaTree(
        { code: '', version: 'v2' },
        (key) => key,
        () => <div />,
      ),
    ).resolves.toBeUndefined();
  });
});

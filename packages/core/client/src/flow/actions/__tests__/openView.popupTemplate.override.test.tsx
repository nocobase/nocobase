/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { openView } from '../openView';

describe('openView action - popup template resource overrides', () => {
  it('uses template resource keys and maps filterByTk to sourceId for relation-field trigger', async () => {
    let capturedOpts: any;
    const ctx: any = {
      inputArgs: {
        dataSourceKey: 'main',
        collectionName: 'users',
        associationName: 'users.roles',
        filterByTk: 'role-1',
        sourceId: 'user-1',
        navigation: false,
      },
      collectionField: {
        isAssociationField: () => true,
      },
      engine: {
        context: { themeToken: { colorBgLayout: '#fff' } },
      },
      model: {
        uid: 'popup-uid',
        flowEngine: { context: { themeToken: { colorBgLayout: '#fff' } } },
      },
      layoutContentElement: {},
      view: { inputArgs: {} },
      viewer: {
        open: vi.fn(async (opts: any) => {
          capturedOpts = opts;
          return undefined;
        }),
      },
    };

    await openView.handler(ctx, {
      uid: 'popup-uid',
      navigation: false,
      __resourceFromPopupTemplate: true,
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: undefined,
      filterByTk: 'tpl-filter',
    });

    expect(capturedOpts?.inputArgs?.dataSourceKey).toBe('main');
    expect(capturedOpts?.inputArgs?.collectionName).toBe('roles');
    expect(capturedOpts?.inputArgs?.associationName).toBeUndefined();
    expect(capturedOpts?.inputArgs?.filterByTk).toBe('user-1');
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  collectContextParamsForTemplate,
  createRecordMetaFactory,
  inferParentRecordRef,
  inferRecordRef,
} from '../variablesParams';

describe('variablesParams helpers', () => {
  it('inferRecordRef and inferParentRecordRef from FlowContext-like object', () => {
    const ctx: any = {
      resource: {
        getResourceName: () => 'posts.comments',
        getDataSourceKey: () => 'main',
        getFilterByTk: () => 1,
        getSourceId: () => 9,
      },
      collection: { name: 'posts', dataSourceKey: 'main' },
    };
    expect(inferRecordRef(ctx)).toEqual({ collection: 'posts', dataSourceKey: 'main', filterByTk: 1 });
    expect(inferParentRecordRef(ctx)).toEqual({ collection: 'posts', dataSourceKey: 'main', filterByTk: 9 });
  });

  it('collectContextParamsForTemplate builds input for used variables only', async () => {
    const ctx: any = {
      getPropertyOptions: (k: string) => ({
        meta:
          k === 'record'
            ? async () => ({
                type: 'object',
                title: 'Record',
                buildVariablesParams: () => ({ collection: 'posts', dataSourceKey: 'main', filterByTk: 1 }),
              })
            : undefined,
      }),
    };

    const tpl = { a: '{{ ctx.record.id }}', b: '{{ ctx.user.name }}' } as any;
    const res = await collectContextParamsForTemplate(ctx, tpl);
    expect(res).toHaveProperty('record');
    expect(res).not.toHaveProperty('user');
  });
});

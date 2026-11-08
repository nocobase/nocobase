/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../index';
import { createTypedFilterable } from '../../../../../collection-manager/filter-operators';
import { CascadeSelectInnerFieldModel } from '../CascadeSelectFieldModel';
import { RecordSelectFieldModel } from '../RecordSelectFieldModel';

function createContext(fieldOptions: Record<string, unknown>, searchText = ' 3 ') {
  const field = new CollectionField({ name: 'display_name', ...fieldOptions });
  const filterable = createTypedFilterable<{ dataType?: string }>(
    [
      { types: ['boolean'], operators: 'boolean' },
      { types: ['string'], operators: 'string' },
      { types: ['integer'], operators: 'number' },
    ],
    (meta) => meta.dataType || 'string',
  );
  vi.spyOn(field, 'getInterfaceOptions').mockReturnValue({ filterable });
  const records = [{ id: 3, display_name: '3 Jackson Hughes' }];
  const resource = {
    setPage: vi.fn(),
    addFilterGroup: vi.fn(),
    removeFilterGroup: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    getData: vi.fn(() => records),
  };
  return {
    field,
    inputArgs: { searchText },
    model: {
      collectionField: { targetCollection: { getField: vi.fn(() => field) } },
      props: { fieldNames: { label: 'display_name', value: 'id' } },
      resource,
      setDataSource: vi.fn(),
      setProps: vi.fn(),
    },
  };
}

describe.each([
  { name: 'RecordSelect', model: RecordSelectFieldModel, searchGroup: '__search__display_name' },
  { name: 'CascadeSelect', model: CascadeSelectInnerFieldModel, searchGroup: 'display_name' },
])('$name search', ({ model, searchGroup }) => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function search(ctx: ReturnType<typeof createContext>) {
    const handler = model.globalFlowRegistry.getFlow('searchSettings').getStep('step1').serialize().handler as (
      ctx: ReturnType<typeof createContext>,
      params: Record<string, unknown>,
    ) => unknown;
    handler(ctx, {});
    await vi.advanceTimersByTimeAsync(500);
  }

  it.each([{ type: 'formula', dataType: 'string' }, { type: 'string' }])(
    'uses partial text matching for $type labels',
    async (options) => {
      const ctx = createContext(options);

      await search(ctx);

      expect(ctx.model.resource.addFilterGroup).toHaveBeenCalledWith(searchGroup, { 'display_name.$includes': '3' });
      expect(ctx.model.resource.setPage).toHaveBeenCalledWith(1);
      expect(ctx.model.resource.refresh).toHaveBeenCalledOnce();
      expect(ctx.model.setDataSource).toHaveBeenCalledWith([
        expect.objectContaining({ display_name: '3 Jackson Hughes' }),
      ]);
      expect(ctx.model.setProps).toHaveBeenCalledWith({ searchText: '3' });
    },
  );

  it('preserves the interface operator for non-string labels', async () => {
    const ctx = createContext({ type: 'integer' });
    vi.spyOn(ctx.field, 'getInterfaceOptions').mockReturnValue({ filterable: { operators: [{ value: '$eq' }] } });

    await search(ctx);

    expect(ctx.model.resource.addFilterGroup).toHaveBeenCalledWith(searchGroup, { 'display_name.$eq': '3' });
  });

  it('falls back to partial text matching without an interface', async () => {
    const ctx = createContext({ type: 'string' });
    vi.spyOn(ctx.field, 'getInterfaceOptions').mockReturnValue(undefined);

    await search(ctx);

    expect(ctx.model.resource.addFilterGroup).toHaveBeenCalledWith(searchGroup, { 'display_name.$includes': '3' });
  });

  it('removes the search filter when the search is cleared', async () => {
    const ctx = createContext({ type: 'formula', dataType: 'string' }, '   ');

    await search(ctx);

    expect(ctx.model.resource.removeFilterGroup).toHaveBeenCalledWith(searchGroup);
    expect(ctx.model.resource.addFilterGroup).not.toHaveBeenCalled();
    expect(ctx.model.resource.refresh).toHaveBeenCalledOnce();
  });
});

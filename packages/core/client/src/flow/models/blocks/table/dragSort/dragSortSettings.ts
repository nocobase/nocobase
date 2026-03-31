/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import type { TableBlockModel } from '../TableBlockModel';
import { convertFieldsToOptions, getSortFields } from './dragSortUtils';

export const dragSortSettings = {
  title: tExpr('Enable drag and drop sorting'),
  uiMode: { type: 'switch' as const, key: 'dragSort' },
  defaultParams: {
    dragSort: false,
  },
  async handler(ctx, params) {
    const model = ctx.model as TableBlockModel;
    model.setProps('dragSort', params.dragSort);

    // Note: automatic configuration of the drag sort field has been removed;
    // users now configure `dragSortBy` explicitly via `dragSortBySettings`.
  },
};

export const dragSortBySettings = {
  title: tExpr('Drag and drop sorting field'),
  hideInSettings(ctx) {
    const dragSort = ctx.model.getStepParams('tableSettings', 'dragSort')?.dragSort;
    if (!dragSort) {
      return true;
    }
  },
  uiMode: (ctx) => {
    const model = ctx.model as TableBlockModel;
    const collection = model.collection;
    const sortFields = getSortFields(collection);
    const options = convertFieldsToOptions(sortFields);

    return {
      type: 'select' as const,
      key: 'dragSortBy',
      props: {
        options,
        placeholder: ctx.t('Select field'),
      },
    };
  },
  defaultParams: {
    dragSortBy: null,
  },
  handler(ctx, params) {
    const model = ctx.model as TableBlockModel;
    model.setProps('dragSortBy', params.dragSortBy);
    if (params.dragSortBy) {
      model.resource.setSort([params.dragSortBy]);
    }
  },
};

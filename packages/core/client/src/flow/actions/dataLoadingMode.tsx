/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, MultiRecordResource, tExpr } from '@nocobase/flow-engine';
import { CollectionBlockModel } from '../models/base/CollectionBlockModel';

export const dataLoadingMode = defineAction({
  name: 'dataLoadingMode',
  title: tExpr('Data loading mode'),
  uiMode: {
    type: 'select',
    key: 'mode',
    props: {
      options: [
        { value: 'auto', label: tExpr('Load all data when filter is empty') },
        { value: 'manual', label: tExpr('Do not load data when filter is empty') },
      ],
    },
  },
  defaultParams: {
    mode: 'auto',
  },
  hideInSettings: (ctx) => {
    // 只有支持筛选的区块才显示此配置
    const blockModel = ctx.blockModel as CollectionBlockModel;
    if (!blockModel?.resource) {
      return true;
    }
    return !blockModel.resource.supportsFilter;
  },
  handler(ctx, params) {
    const blockModel = ctx.blockModel as CollectionBlockModel;
    if (!blockModel) {
      return;
    }

    // 保存配置到 stepParams
    blockModel.setStepParams('dataLoadingModeSettings', { mode: params.mode });

    // 如果切换到 manual 模式且当前没有活跃的筛选条件，清空数据
    if (params.mode === 'manual' && !blockModel.hasActiveFilters()) {
      const resource = blockModel.resource as MultiRecordResource;
      if (resource) {
        resource.setData([]);
        resource.setMeta({ count: 0, hasNext: false });
        if (typeof resource.setPage === 'function') {
          resource.setPage(1);
        }
        resource.loading = false;
      }
    } else if (params.mode === 'auto') {
      // 切换到 auto 模式时立即刷新数据
      blockModel.resource?.refresh();
    }
  },
});

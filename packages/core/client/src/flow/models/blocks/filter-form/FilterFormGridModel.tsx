/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowSettingsButton, observable } from '@nocobase/flow-engine';
import React from 'react';
import { CollectionBlockModel } from '../../base/BlockModel';
import { GridModel } from '../../base/GridModel';
import { getAllDataModels } from '../filter-manager/utils';
import { FilterFormItemModel } from './FilterFormItemModel';

export class FilterFormGridModel extends GridModel {
  itemFlowSettings = {
    showBackground: true,
    style: {
      top: -6,
      left: -6,
      right: -6,
      bottom: -6,
    },
  };

  private hiddenRows: any = {};
  readonly loading = observable.ref(false);

  toggleFormFieldsCollapse(collapse: boolean, visibleRows: number) {
    const gridRows = this.props.rows || {};

    if (!collapse) {
      // 展开：恢复所有隐藏的行
      const restoredRows = { ...gridRows, ...this.hiddenRows };
      this.setProps('rows', restoredRows);
      this.hiddenRows = {};
    } else {
      // 折叠：只保留指定数量的行，其余行保存到 hiddenRows 中
      const rowKeys = Object.keys(gridRows);

      if (rowKeys.length > visibleRows) {
        const visibleRowKeys = rowKeys.slice(0, visibleRows);
        const hiddenRowKeys = rowKeys.slice(visibleRows);

        // 保存要隐藏的行
        this.hiddenRows = {};
        hiddenRowKeys.forEach((key) => {
          this.hiddenRows[key] = gridRows[key];
        });

        // 只保留可见的行
        const visibleRowsData = {};
        visibleRowKeys.forEach((key) => {
          visibleRowsData[key] = gridRows[key];
        });

        this.setProps('rows', visibleRowsData);
      }
    }
  }

  async onModelCreated(subModel: FilterFormItemModel) {
    if (!(subModel instanceof FilterFormItemModel)) {
      return;
    }

    const { dataSourceKey, collectionName, fieldPath } = subModel.getFieldSettingsInitParams();
    const allDataModels = getAllDataModels(subModel.context.blockGridModel);

    // 1. 通过 dataSourceKey 和 collectionName 找到对应的区块 Model
    const matchingModels = allDataModels.filter((model: CollectionBlockModel) => {
      if (!model.resource?.supportsFilter) {
        return false;
      }

      if (!dataSourceKey || !collectionName) {
        return model.uid === subModel.defaultTargetUid;
      }

      const collection = model.collection;
      return collection && collection.dataSourceKey === dataSourceKey && collection.name === collectionName;
    });

    // 2. 将找到的 Model 的 uid 添加到 subModel 的 targets 中，包括 fieldPath
    if (matchingModels.length > 0) {
      const targets = matchingModels.map((model: CollectionBlockModel) => {
        if (model.collection) {
          const field = model.collection.getField(fieldPath);

          // 如果是关系字段，需要把 targetKey 拼上，不然筛选时会报错
          if (field.target) {
            return {
              targetId: model.uid,
              filterPaths: [`${fieldPath}.${field.targetKey}`],
            };
          }
        }

        return {
          targetId: model.uid,
          filterPaths: [fieldPath],
        };
      });

      // 存到数据库中
      await this.context.filterManager.saveConnectFieldsConfig(subModel.uid, {
        targets,
      });
    }
  }

  renderAddSubModelButton() {
    if (this.loading.value) {
      return null;
    }

    // 向筛选表单区块添加字段 model
    return (
      <AddSubModelButton
        subModelKey="items"
        model={this}
        afterSubModelInit={this.onModelCreated.bind(this)}
        keepDropdownOpen
        subModelBaseClasses={['FilterFormItemModel', 'FormCustomItemModel']}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}

FilterFormGridModel.registerFlow({
  key: 'filterFormGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddFieldButton, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { CreateFormModel } from '../..';
import { FilterBlockModel } from '../../base/BlockModel';
import { GridModel } from '../../base/GridModel';
import { getAllDataModels } from '../utils';
import { buildFieldMenuItems } from './buildFieldMenuItems';
import { FilterFormEditableFieldModel } from './fields';

export class FilterFormFieldGridModel extends GridModel {
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

  getFieldMenuItems(): any[] {
    // 1. 找到当前页面的 GridModel 实例
    const gridModelInstance = this.context.blockGridModel;
    if (!gridModelInstance) {
      return [];
    }

    // 2. 获取所有的数据区块的实例
    const allModelInstances = getAllDataModels(gridModelInstance);

    // 3. 获取每个区块对应的数据表对象，并去重
    const collections = allModelInstances
      .map((model: FlowModel) => {
        // @ts-ignore
        return model.collection;
      })
      .filter((collection, index, self) => collection && self.indexOf(collection) === index);

    // 4. 根据数据表中字段的信息构建菜单项
    const menuItems = buildFieldMenuItems(
      collections,
      this,
      'FilterFormEditableFieldModel',
      'items',
      ({ defaultOptions, fieldPath, collection }) => ({
        use: defaultOptions.use,
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: collection.dataSourceKey,
              collectionName: collection.name,
              fieldPath,
            },
          },
        },
      }),
    );

    return menuItems;
  }

  async onModelCreated(subModel: FilterFormEditableFieldModel) {
    const { dataSourceKey, collectionName, fieldPath } = subModel.getFieldSettingsInitParams();
    const allDataModels = getAllDataModels(subModel.context.blockGridModel);

    // 1. 通过 dataSourceKey 和 collectionName 找到对应的区块 Model
    const matchingModels = allDataModels.filter((model) => {
      if (model instanceof FilterBlockModel || model instanceof CreateFormModel) {
        return false;
      }

      // @ts-ignore
      const collection = model.collection;
      return collection && collection.dataSourceKey === dataSourceKey && collection.name === collectionName;
    });

    // 2. 将找到的 Model 的 uid 添加到 subModel 的 targets 中，包括 fieldPath
    if (matchingModels.length > 0) {
      const targets = matchingModels.map((model) => ({
        targetModelUid: model.uid,
        targetFieldPaths: [fieldPath],
      }));

      // 存到数据库中
      this.context.filterManager.saveConnectFieldsConfig(subModel.uid, {
        targets,
      });
    }
  }

  renderAddSubModelButton() {
    // 向筛选表单区块添加字段 model
    return (
      <AddFieldButton
        items={this.getFieldMenuItems()}
        subModelKey="items"
        model={this}
        onModelCreated={this.onModelCreated.bind(this)}
      />
    );
  }
}

FilterFormFieldGridModel.registerFlow({
  key: 'filterFormFieldGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});

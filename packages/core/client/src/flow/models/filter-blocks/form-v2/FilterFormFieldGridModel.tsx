/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddFieldButton, FlowModel } from '@nocobase/flow-engine';
import { GridModel } from '../../base/GridModel';
import React from 'react';
import { buildFieldMenuItems } from './buildFieldMenuItems';
import { getAllDataModels } from '../utils';
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

      const operatorOptions = subModel.context.collectionField.filterable?.operators || [];
      // 存到数据库中
      this.context.filterManager.saveConnectFieldsConfig(subModel.uid, {
        operator: operatorOptions[0].value || '$eq',
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

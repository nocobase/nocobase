/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, observable } from '@nocobase/flow-engine';
import { castArray } from 'lodash';
import { BlockSceneEnum } from '../../base';
import { TableBlockModel } from './TableBlockModel';

export class TableSelectModel extends TableBlockModel {
  static scene = BlockSceneEnum.select;
  rowSelectionProps: any = observable.deep({});
  onInit(options: any) {
    super.onInit(options);
    const collectionField = this.context.view.inputArgs.collectionField || {};
    const isOToAny = ['oho', 'o2m'].includes(collectionField?.interface);
    const sourceId = this.context.view.inputArgs.sourceId;
    if (isOToAny) {
      const foreignKey = collectionField.foreignKey;
      const filterGroupKey = `${this.uid}-${collectionField.name}`;
      if (foreignKey) {
        if (sourceId != null) {
          this.resource.addFilterGroup(filterGroupKey, {
            $or: [{ [foreignKey]: { $is: null } }, { [foreignKey]: { $eq: sourceId } }],
          });
        } else {
          this.resource.addFilterGroup(filterGroupKey, {
            [foreignKey]: {
              $is: null,
            },
          });
        }
      }
    }

    Object.assign(this.rowSelectionProps, this.context.view.inputArgs.rowSelectionProps || {});

    const getSelectedRows = this.rowSelectionProps?.defaultSelectedRows;
    const selectData = typeof getSelectedRows === 'function' ? getSelectedRows() : getSelectedRows;
    const data = (selectData && castArray(selectData)) || [];
    const filterKeys = data
      .map((v) => {
        return v[this.collection.filterTargetKey];
      })
      .filter(Boolean);
    this.resource.addFilterGroup(`${this.uid}-select`, {
      [`${this.collection.filterTargetKey}.$ne`]: filterKeys,
    });
  }
}

TableSelectModel.define({
  label: tExpr('Table'),
  children: false,
  useModel: 'TableSelectModel',
  createModelOptions: async (ctx) => {
    const { dataSourceKey, collectionName } = ctx.view.inputArgs;
    return {
      use: 'TableSelectModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey,
            collectionName,
          },
        },
      },
    };
  },
});

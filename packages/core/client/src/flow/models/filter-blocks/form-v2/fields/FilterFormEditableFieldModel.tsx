/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionBlockModel } from '../../../base/BlockModel';
import { EditableFieldModel } from '../../../fields/EditableField/EditableFieldModel';

export class FilterFormEditableFieldModel extends EditableFieldModel {
  enableOperator = true;

  addFilterGroupToTargetModels() {
    const operator = this.props.operator || '$eq';
    const targets = this.props.targets || [];

    if (!operator || !targets.length) {
      return;
    }

    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        const value = this.getFilterValue();
        if (value != null && value !== '') {
          model.resource.addFilterGroup(this.uid, {
            [target.fieldPath]: {
              [operator]: value,
            },
          });
        } else {
          model.resource.removeFilterGroup(this.uid);
        }
      }
    });
  }

  removeFilterGroupFromTargetModels() {
    const operator = this.props.operator;
    const targets = this.props.targets || [];

    if (!operator || !targets.length) {
      return;
    }

    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        model.resource.removeFilterGroup(this.uid);
      }
    });
  }

  doFilter() {
    const targets = this.props.targets || [];

    if (!targets.length) {
      return;
    }

    this.addFilterGroupToTargetModels();
    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        model.resource.refresh();
      }
    });
  }

  doReset() {
    const targets = this.props.targets || [];

    if (!targets.length) {
      return;
    }

    this.removeFilterGroupFromTargetModels();
    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        model.resource.refresh();
      }
    });
  }

  /**
   * 获取用于显示在筛选条件中的字段值
   * @returns
   */
  getFilterValue() {
    return this.field.value;
  }
}

FilterFormEditableFieldModel.registerFlow({
  key: 'filterFormItemSettings',
  auto: true,
  title: 'Filter form item settings',
  steps: {
    connectFields: {
      use: 'connectFields',
    },
    defaultOperator: {
      use: 'defaultOperator',
    },
  },
});

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
  addFilterGroupToTargetModels() {
    const operator = this.props.operator;
    const targets = this.props.targets || [];

    if (!operator || !targets.length) {
      return;
    }

    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        if (this.field.value != null) {
          model.resource.addFilterGroup(this.uid, {
            [target.fieldPath]: {
              [operator]: this.field.value,
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
}

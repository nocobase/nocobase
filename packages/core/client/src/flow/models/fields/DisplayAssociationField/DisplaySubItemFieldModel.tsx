/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import React from 'react';
import { FormItemModel } from '../../blocks/form/FormItemModel';
import { ObjectNester } from '../AssociationFieldModel/SubFormFieldModel';
import { FieldModel } from '../../base';
import { DetailsItemModel } from '../../blocks/details/DetailsItemModel';

export class DisplaySubItemFieldModel extends FieldModel {
  disableTitleField = true;
  subModelBaseClasses = {
    action: 'RecordActionGroupModel' as any,
    field: ['DetailsItemModel'] as any,
  };

  getAddSubModelButtonProps(type: 'action' | 'field') {
    const subClass = this.subModelBaseClasses[type];
    if (Array.isArray(subClass)) {
      return {
        subModelBaseClasses: subClass,
      };
    }
    return {
      subModelBaseClass: subClass,
    };
  }
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField.targetCollection,
    });
    this.context.defineProperty('prefixFieldPath', {
      get: () => {
        return (this.parent as FormItemModel).fieldPath;
      },
    });
  }
  public render() {
    return <ObjectNester {...this.props} />;
  }
}

DisplaySubItemFieldModel.define({
  label: tExpr('Sub-detail'),
  createModelOptions: {
    use: 'DisplaySubItemFieldModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
});

DetailsItemModel.bindModelToInterface('DisplaySubItemFieldModel', [
  'm2o',
  'o2o',
  'oho',
  'obo',
  'updatedBy',
  'createdBy',
]);

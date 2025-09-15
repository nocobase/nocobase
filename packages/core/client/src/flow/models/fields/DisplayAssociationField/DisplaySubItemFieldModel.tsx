/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { FormItemModel } from '../../blocks/form/FormItemModel';
import { ObjectNester } from '../AssociationFieldModel/SubFormFieldModel';
import { FieldModel } from '../../base';

export class DisplaySubItemFieldModel extends FieldModel {
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
  label: escapeT('Sub-detail'),
  createModelOptions: {
    use: 'DisplaySubItemFieldModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
});

DisplayItemModel.bindModelToInterface('DisplaySubItemFieldModel', [
  'm2o',
  'o2o',
  'oho',
  'obo',
  'updatedBy',
  'createdBy',
]);

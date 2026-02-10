/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterableItemModel, tExpr } from '@nocobase/flow-engine';
import { RecordSelectFieldModel } from '../../../fields/AssociationFieldModel';

export class FilterFormRecordSelectFieldModel extends RecordSelectFieldModel {
  onInit(options) {
    super.onInit(options);
    const stepAllowMultiple = this.getStepParams('selectSettings', 'allowMultiple')?.allowMultiple;
    const allowMultiple =
      typeof stepAllowMultiple === 'boolean'
        ? stepAllowMultiple
        : typeof this.props.allowMultiple === 'boolean'
          ? this.props.allowMultiple
          : true;
    this.setProps({
      allowMultiple,
      multiple: allowMultiple,
      quickCreate: 'none',
    });
  }
}

FilterFormRecordSelectFieldModel.registerFlow({
  key: 'selectSettings',
  title: tExpr('Association select settings'),
  sort: 800,
  steps: {
    fieldNames: {
      use: 'titleField',
    },
    dataScope: {
      use: 'dataScope',
    },
    sortingRule: {
      use: 'sortingRule',
    },
    allowMultiple: {
      title: tExpr('Multiple'),
      uiMode: { type: 'switch', key: 'allowMultiple' },
      defaultParams: {
        allowMultiple: true,
      },
      handler(ctx, params) {
        const stepAllowMultiple = ctx.model.getStepParams('selectSettings', 'allowMultiple')?.allowMultiple;
        const allowMultiple =
          typeof params?.allowMultiple === 'boolean'
            ? params.allowMultiple
            : typeof stepAllowMultiple === 'boolean'
              ? stepAllowMultiple
              : typeof ctx.model.props.allowMultiple === 'boolean'
                ? ctx.model.props.allowMultiple
                : true;
        ctx.model.setProps({
          allowMultiple,
          multiple: allowMultiple,
        });
      },
    },
  },
});

FilterFormRecordSelectFieldModel.define({
  label: tExpr('Dropdown select'),
});

FilterableItemModel.bindModelToInterface(
  'FilterFormRecordSelectFieldModel',
  ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
  {
    isDefault: true,
    defaultProps: {
      allowMultiple: true,
      multiple: true,
      quickCreate: 'none',
    },
  },
);

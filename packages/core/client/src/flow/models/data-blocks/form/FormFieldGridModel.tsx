/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddFieldButton, buildFieldItems } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { GridModel } from '../../base/GridModel';
import { FormFieldModel } from '../../fields';
import { FormCustomFormItemModel } from './FormCustomFormItemModel';
import { FormModel } from './FormModel';

export class FormFieldGridModel extends GridModel<{
  parent: FormModel;
  subModels: { items: FieldModel[] };
}> {
  itemFlowSettings = {
    showBackground: true,
    style: {
      top: -6,
      left: -6,
      right: -6,
      bottom: -6,
    },
  };
  renderAddSubModelButton() {
    const formModelInstance = this.context.blockModel as FormModel;
    const collection = this.context.currentCollection || formModelInstance.collection;
    const fieldItems = buildFieldItems(
      collection.getFields(),
      formModelInstance,
      'FormFieldModel',
      'items',
      ({ defaultOptions, fieldPath }) => {
        return {
          ...defaultOptions,
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
        };
      },
    );

    return (
      <>
        <AddFieldButton
          items={fieldItems}
          subModelKey="items"
          subModelBaseClass={FormCustomFormItemModel}
          model={this}
          onSubModelAdded={async (field: FormFieldModel) => {
            this.context.blockModel.addAppends(field.fieldPath, true);
          }}
        />
        {/* <FlowSettingsButton
          onClick={() => {
            this.openStepSettingsDialog(GRID_FLOW_KEY, GRID_STEP);
          }}
        >
          {t('Configure rows')}
        </FlowSettingsButton> */}
      </>
    );
  }
}

FormFieldGridModel.registerFlow({
  key: 'formFieldGridSettings',
  auto: true,
  steps: {
    init: {
      async handler(ctx, params) {
        await ctx.model.applySubModelsAutoFlows('items');
      },
    },
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});

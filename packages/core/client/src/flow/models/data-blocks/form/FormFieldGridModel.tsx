/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddFieldButton, buildFieldItems, FlowSettingsButton } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { GRID_FLOW_KEY, GRID_STEP, GridModel } from '../../base/GridModel';
import { EditableFieldModel } from '../../fields';
import { FormCustomFormItemModel } from './FormCustomFormItemModel';
import { FormModel } from './FormModel';

export class FormFieldGridModel extends GridModel<{
  parent: FormModel;
  subModels: { items: FieldModel[] };
}> {
  renderAddSubModelButton() {
    const t = this.translate;
    const formModelInstance = this.parent as FormModel;
    const fieldItems = buildFieldItems(
      formModelInstance.collection.getFields(),
      formModelInstance,
      'EditableFieldModel',
      'items',
      ({ defaultOptions, fieldPath }) => ({
        use: defaultOptions.use,
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: formModelInstance.collection.dataSourceKey,
              collectionName: formModelInstance.collection.name,
              fieldPath,
            },
          },
        },
      }),
    );

    return (
      <>
        <AddFieldButton
          items={fieldItems}
          subModelKey="items"
          subModelBaseClass={FormCustomFormItemModel}
          model={this}
          onSubModelAdded={async (field: EditableFieldModel) => {
            const fieldPath = field.getStepParams('fieldSettings', 'init').fieldPath;
            this.ctx.shared.currentBlockModel.addAppends(fieldPath, true);
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

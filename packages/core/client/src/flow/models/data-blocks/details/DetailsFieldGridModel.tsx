/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddFieldButton, buildFieldItems, FlowSettingsButton } from '@nocobase/flow-engine';
import { GRID_FLOW_KEY, GRID_STEP, GridModel } from '../../base/GridModel';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { DetailItemModel } from './DetailItemModel';
import { DetailsModel } from './DetailsModel';

const AddDetailField = ({ model }) => {
  const detailsModelInstance = model.parent as DetailsModel;

  const items = buildFieldItems(
    detailsModelInstance.collection.getFields(),
    detailsModelInstance,
    'ReadPrettyFieldModel',
    'items',
    ({ defaultOptions, fieldPath }) => ({
      use: 'DetailItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: detailsModelInstance.collection.dataSourceKey,
            collectionName: detailsModelInstance.collection.name,
            fieldPath,
          },
        },
      },
      subModels: {
        field: {
          use: defaultOptions.use,
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: detailsModelInstance.collection.dataSourceKey,
                collectionName: detailsModelInstance.collection.name,
                fieldPath,
              },
            },
          },
        },
      },
    }),
  );
  return (
    <AddFieldButton
      model={model}
      subModelKey={'items'}
      subModelBaseClass="DetailFormItemModel"
      items={items}
      onModelCreated={async (item: DetailItemModel) => {
        const field: any = item.subModels.field;
        await field.applyAutoFlows();
      }}
      onSubModelAdded={async (item: DetailItemModel) => {
        const field: any = item.subModels.field;
        detailsModelInstance.addAppends(field.fieldPath, true);
      }}
    />
  );
};

export class DetailsFieldGridModel extends GridModel<{
  parent: DetailsModel;
  subModels: { items: FieldModel[] };
}> {
  renderAddSubModelButton() {
    const t = this.translate;

    return (
      <>
        <AddDetailField model={this} />
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

DetailsFieldGridModel.registerFlow({
  key: 'detailFieldGridSettings',
  auto: true,
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, DisplayItemModel, FlowModel, FlowModelContext } from '@nocobase/flow-engine';

export class AssociationFieldGroupModel extends FlowModel {
  static itemModelName = 'DetailsItemModel';
  static defineChildren(ctx: FlowModelContext) {
    const itemModel = this.itemModelName;

    const displayAssociationFields = (targetCollection: Collection, fieldPath = '') => {
      return targetCollection.getToOneAssociationFields().map((field) => {
        const fPath = fieldPath ? `${fieldPath}.${field.name}` : field.name;
        return {
          key: `${fPath}-assocationField`,
          label: field.title,
          children: () => {
            return [
              {
                key: `${fPath}-children-collectionField`,
                label: 'Display collection fields',
                type: 'group',
                children: field.targetCollection
                  .getFields()
                  .map((f) => {
                    const fp = `${fPath}.${f.name}`;
                    const binding = DisplayItemModel.getDefaultBindingByField(ctx, f);
                    if (!binding) {
                      return;
                    }
                    const use = binding.modelName;
                    return {
                      key: `c-${fPath}.${f.name}`,
                      label: f.title,
                      useModel: itemModel,
                      toggleable: (subModel) => {
                        const fieldPath = subModel.getStepParams('fieldSettings', 'init')?.fieldPath;
                        return fieldPath === fp;
                      },
                      createModelOptions: {
                        stepParams: {
                          fieldSettings: {
                            init: {
                              dataSourceKey: ctx.collection.dataSourceKey,
                              collectionName: ctx.collection.name,
                              fieldPath: fp,
                              associationPathName: fPath,
                            },
                          },
                        },
                        subModels: {
                          field: {
                            use: use,
                          },
                        },
                      },
                    };
                  })
                  .filter(Boolean),
              },
              {
                key: `${fPath}-children-associationField`,
                label: 'Display association fields',
                type: 'group',
                children: displayAssociationFields(field.targetCollection, fPath),
              },
            ];
          },
        };
      });
    };

    return displayAssociationFields(ctx.collection);
  }
}

AssociationFieldGroupModel.define({
  label: '{{t("Display association fields")}}',
  //   hide: true,
});

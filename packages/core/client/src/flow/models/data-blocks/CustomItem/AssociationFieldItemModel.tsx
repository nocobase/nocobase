/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, FlowModel, FlowModelContext, buildWrapperFieldChildren } from '@nocobase/flow-engine';
import { TableModel } from '../table/TableModel';

export class AssociationFieldItemModel extends FlowModel {
  static defineChildren(ctx: FlowModelContext) {
    const itemModel = ctx.model.context.blockModel instanceof TableModel ? 'TableColumnModel' : 'DetailItemModel';

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
                children: field.targetCollection.getFields().map((f) => {
                  const fp = `${fPath}.${f.name}`;
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
                          use: f.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel',
                        },
                      },
                    },
                  };
                }),
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

AssociationFieldItemModel.define({
  label: '{{t("Display association fields")}}',
  //   hide: true,
});

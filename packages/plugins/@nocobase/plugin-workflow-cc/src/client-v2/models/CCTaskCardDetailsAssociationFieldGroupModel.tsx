/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsAssociationFieldGroupModel } from '@nocobase/client-v2';
import { DisplayItemModel, type Collection, type FlowModelContext } from '@nocobase/flow-engine';

import { NAMESPACE, tExpr } from '../locale';

const BLACKLIST = ['job', 'execution', 'user', 'node.*', 'job.*', 'workflow.*', 'execution.*'];
const WHITELIST = ['workflow.title', 'node.title'];

const isExcluded = (fieldPath: string, { blacklist = [], whitelist = [] } = {}) => {
  const match = (patterns: string[]) => {
    if (patterns.includes(fieldPath)) {
      return true;
    }
    return patterns.some((pattern) => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return fieldPath.startsWith(prefix);
      }
      return false;
    });
  };

  if (match([...WHITELIST, ...whitelist])) {
    return false;
  }
  if (match([...BLACKLIST, ...blacklist])) {
    return true;
  }
  return false;
};

export class CCTaskCardDetailsAssociationFieldGroupModel extends DetailsAssociationFieldGroupModel {
  static itemModelName = 'CCTaskCardDetailsItemModel';

  static defineChildren(ctx: FlowModelContext) {
    const itemModel = this.itemModelName;

    const displayAssociationFields = (targetCollection: Collection, fieldPath = '') => {
      return targetCollection
        .getToOneAssociationFields()
        .map((field) => {
          const fPath = fieldPath ? `${fieldPath}.${field.name}` : field.name;
          if (isExcluded(fPath)) {
            return null;
          }

          if (!field.targetCollection) {
            return null;
          }

          return {
            key: `${fPath}-assocationField`,
            label: field.title,
            children: () =>
              [
                {
                  key: `${fPath}-children-collectionField`,
                  label: 'Display fields',
                  type: 'group',
                  children: field.targetCollection
                    .getFields()
                    .map((targetField) => {
                      const fp = `${fPath}.${targetField.name}`;
                      const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetField, {
                        fallbackToTargetTitleField: true,
                      });
                      if (!binding || targetField.target || isExcluded(fp)) {
                        return null;
                      }
                      return {
                        key: `c-${fPath}.${targetField.name}`,
                        label: targetField.title,
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
                              use: binding.modelName,
                            },
                          },
                        },
                      };
                    })
                    .filter(Boolean),
                },
              ].filter((item) => item.children.length > 0),
          };
        })
        .filter(Boolean);
    };

    return displayAssociationFields(ctx.collection);
  }
}

CCTaskCardDetailsAssociationFieldGroupModel.define({
  label: tExpr('Other information', { ns: NAMESPACE }),
});

export default CCTaskCardDetailsAssociationFieldGroupModel;

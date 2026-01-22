/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsAssociationFieldGroupModel } from '@nocobase/client';
import { Collection, DisplayItemModel, FlowModelContext } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../common/constants';

// 禁止显示的字段（黑名单）
const BLACKLIST = ['job', 'execution', 'user', 'node.*', 'job.*', 'workflow.*', 'execution.*'];

// 允许显示的字段（白名单）
const WHITELIST = ['workflow.title', 'node.title'];

const isExcluded = (fieldPath: string, { whitelist = [], blacklist = [] } = {}) => {
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

    const displayAssociationFields = (targetCollection: Collection, fieldPath = '', depth = 0) => {
      return targetCollection
        .getToOneAssociationFields()
        .map((field) => {
          const fPath = fieldPath ? `${fieldPath}.${field.name}` : field.name;
          if (!field.targetCollection) {
            console.error(
              `AssociationFieldGroupModel: target collection ${field.target} not found for field ${field.name}`,
            );
            return;
          }

          if (isExcluded(fPath)) {
            return;
          }

          return {
            key: `${fPath}-assocationField`,
            label: field.title,
            children: () => {
              return [
                {
                  key: `${fPath}-children-collectionField`,
                  label: 'Display fields',
                  type: 'group',
                  children: field.targetCollection
                    .getFields()
                    .map((f) => {
                      const fp = `${fPath}.${f.name}`;
                      const binding = DisplayItemModel.getDefaultBindingByField(ctx, f, {
                        fallbackToTargetTitleField: true,
                      });

                      if (!binding) {
                        return;
                      }

                      if (f.target) {
                        return;
                      }

                      if (isExcluded(fp)) {
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
              ].filter((item) => item.children.length > 0);
            },
          };
        })
        .filter(Boolean);
    };

    return displayAssociationFields(ctx.collection);
  }
}

CCTaskCardDetailsAssociationFieldGroupModel.define({
  label: `{{t("Other information", { ns: "${NAMESPACE}" })}}`,
});

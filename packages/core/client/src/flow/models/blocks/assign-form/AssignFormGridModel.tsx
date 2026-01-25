/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { AddSubModelButton, FlowSettingsButton, tExpr, EditableItemModel } from '@nocobase/flow-engine';
import { SettingOutlined } from '@ant-design/icons';
import { FormGridModel } from '../form/FormGridModel';

// 使用范型准确标注 subModels.items 的类型
export class AssignFormGridModel extends FormGridModel {
  renderAddSubModelButton() {
    const collection = (this.context as any)?.collection;
    const fields = collection?.getFields?.() || [];
    // 过滤主键/过滤键字段，避免产生“更新主键”的无效配置
    const pk = typeof collection?.getPrimaryKey === 'function' ? collection.getPrimaryKey() : undefined;
    const filterKey = collection?.filterTargetKey;
    const isForbidden = (name: string) => {
      if (!name) return false;
      if (pk && name === pk) return true;
      if (typeof filterKey === 'string' && name === filterKey) return true;
      if (Array.isArray(filterKey) && filterKey.includes(name)) return true;
      return false;
    };
    const items = fields
      .filter((field: any) => !isForbidden(field?.name))
      .map((field: any) => {
        const fullName = field.name as string;
        const label = field.title || field.name;
        const binding = EditableItemModel.getDefaultBindingByField(this.context, field);
        if (!binding) {
          return;
        }
        const fieldModel = binding.modelName;
        return {
          key: fullName,
          label,
          // 防止同一字段被重复添加：根据已存在子模型的 fieldPath 判定可切换性
          toggleable: (subModel) => {
            const init = subModel.getStepParams('fieldSettings', 'init') || {};
            return init?.fieldPath === fullName;
          },
          useModel: 'AssignFormItemModel',
          createModelOptions: () => ({
            use: 'AssignFormItemModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection?.dataSourceKey,
                  collectionName: collection?.name,
                  fieldPath: fullName,
                },
              },
            },
            subModels: {
              field: {
                use: fieldModel,
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: collection?.dataSourceKey,
                      collectionName: collection?.name,
                      fieldPath: fullName,
                    },
                  },
                },
              },
            },
          }),
        };
      })
      .filter(Boolean);
    return (
      <AddSubModelButton subModelKey="items" model={this} items={items} keepDropdownOpen>
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  addOrEnsureItem(fieldName: string, value?: any) {
    const collection = (this.context as any)?.collection;
    const items = this.subModels?.items || [];
    // AssignFormItemModel 并非 CollectionFieldModel，不存在 context.fieldPath，
    // 需要依据步骤参数中声明的 fieldSettings.init.fieldPath 来判断是否已存在同名条目
    const existing = items.find((m) => {
      try {
        const init =
          typeof (m as any)?.getStepParams === 'function' ? (m as any).getStepParams('fieldSettings', 'init') : null;
        return init?.fieldPath === fieldName;
      } catch (_e) {
        return false;
      }
    });
    if (existing) {
      // 更新已有项的当前值，便于重新打开时回填
      if (typeof (existing as any)?.setStepParams === 'function') {
        (existing as any).setStepParams('fieldSettings', 'assignValue', { value });
      }
      (existing as any).assignValue = value;
      return;
    }
    const field = (collection?.getFields?.() || []).find((f: any) => f.name === fieldName);

    const binding = EditableItemModel.getDefaultBindingByField(this.context, field);
    if (!binding) {
      return;
    }
    const fieldModel = binding.modelName;
    const created = this.flowEngine.createModel({
      use: 'AssignFormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: collection?.dataSourceKey,
            collectionName: collection?.name,
            fieldPath: fieldName,
          },
          assignValue: { value },
        },
      },
      subModels: {
        field: {
          use: fieldModel,
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: collection?.dataSourceKey,
                collectionName: collection?.name,
                fieldPath: fieldName,
              },
            },
          },
        },
      },
      parentId: this.uid,
      subKey: 'items',
    });
    created['assignValue'] = value;
  }

  getAssignedValues(): Record<string, any> {
    const items = this.subModels?.items || [];
    const result: Record<string, any> = {};
    for (const it of items) {
      const pair = typeof (it as any).getAssignedEntry === 'function' ? (it as any).getAssignedEntry() : null;
      if (pair && Array.isArray(pair)) {
        result[pair[0]] = pair[1];
      }
    }
    return result;
  }
}

AssignFormGridModel.define({
  label: tExpr('Assign grid'),
});

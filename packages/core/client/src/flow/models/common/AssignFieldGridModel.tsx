/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { AddSubModelButton, FlowSettingsButton, escapeT } from '@nocobase/flow-engine';
import { GridModel } from '../base/GridModel';
import { SettingOutlined } from '@ant-design/icons';
import { AssignFormItemModel } from './AssignFormItemModel';

// 使用范型准确标注 subModels.items 的类型
export class AssignFieldGridModel extends GridModel<{ subModels: { items: AssignFormItemModel[] } }> {
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
        const fieldModel = field?.getFirstSubclassNameOf?.('FormFieldModel') || 'FormFieldModel';
        return {
          key: fullName,
          label,
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
      });
    return (
      <AddSubModelButton subModelKey="items" model={this} items={items} keepDropdownOpen>
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  addOrEnsureItem(fieldName: string, value?: any) {
    const collection = (this.context as any)?.collection;
    const items = (this.subModels?.items || []) as AssignFormItemModel[];
    const existing = items.find((m) => m?.fieldPath === fieldName);
    if (existing) {
      // 更新已有项的当前值，便于重新打开时回填
      if (typeof (existing as any)?.setStepParams === 'function') {
        (existing as any).setStepParams('fieldSettings', 'assignValue', { value });
      }
      (existing as any).assignValue = value;
      return;
    }
    const fieldModel =
      (collection?.getFields?.() || [])
        .find((f: any) => f.name === fieldName)
        ?.getFirstSubclassNameOf?.('FormFieldModel') || 'FormFieldModel';
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
    created.assignValue = value;
  }

  getAssignedValues(): Record<string, any> {
    const items = (this.subModels?.items || []) as AssignFormItemModel[];
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

AssignFieldGridModel.define({
  label: escapeT('Assign grid'),
});

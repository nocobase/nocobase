/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 */

import React from 'react';
import { AddSubModelButton, FlowSettingsButton, escapeT } from '@nocobase/flow-engine';
import { GridModel } from '../base/GridModel';
import { SettingOutlined } from '@ant-design/icons';

export class AssignFieldGridModel extends GridModel<{ subModels: { items: any[] } }> {
  renderAddSubModelButton() {
    const collection = (this.context as any)?.collection;
    const fields = collection?.getFields?.() || [];
    const items = fields.map((field: any) => {
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
    const items = ((this.subModels as any)?.items || []) as any[];
    const existing = items.find((m) => m?.fieldPath === fieldName);
    if (existing) {
      try {
        // 更新已有项的当前值，便于重新打开时回填
        if (typeof existing.setStepParams === 'function') {
          existing.setStepParams('fieldSettings', 'assignValue', { value });
        }
        existing.assignValue = value;
      } catch (e) {
        // 忽略更新失败
        void e;
      }
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
        },
        assignValue: { value },
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
    try {
      created.assignValue = value;
    } catch (e) {
      // 忽略赋值失败
      void e;
    }
  }

  getAssignedValues(): Record<string, any> {
    const items = ((this.subModels as any)?.items || []) as any[];
    const result: Record<string, any> = {};
    for (const it of items) {
      const pair = typeof it.getAssignedEntry === 'function' ? it.getAssignedEntry() : null;
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

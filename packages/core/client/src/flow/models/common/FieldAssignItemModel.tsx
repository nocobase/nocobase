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
import { define, observable } from '@formily/reactive';
import {
  FlowModel,
  FlowModelRenderer,
  VariableInput,
  escapeT,
  isVariableExpression,
  parseValueToPath,
} from '@nocobase/flow-engine';

/**
 * 单个字段赋值项：使用临时字段模型（Temp FieldModel）作为常量编辑器，VariableInput 作为变量编辑器
 */
export class FieldAssignItemModel extends FlowModel {
  assignValue: any = undefined;

  constructor(options: any) {
    super(options);
    define(this, {
      assignValue: observable,
    });
  }

  onInit(options: any) {
    // 读取初始值（若通过 setInitialAssignedValues 注入）
    const initial = this.getStepParams('fieldSettings', 'assignValue')?.value;
    if (typeof initial !== 'undefined') {
      this.assignValue = initial;
    }
  }

  get fieldInit() {
    return this.getStepParams('fieldSettings', 'init') || {};
  }

  get fieldPath(): string | undefined {
    return this.fieldInit?.fieldPath as string | undefined;
  }

  get fieldLabel(): string {
    try {
      const collection = (this.context as any)?.collection;
      const f = collection?.getField?.(this.fieldPath);
      return f?.title || this.fieldPath || '';
    } catch {
      return this.fieldPath || '';
    }
  }

  getAssignedEntry(): [string, any] | null {
    const name = this.fieldPath;
    if (!name) return null;
    return [name, this.assignValue];
  }

  render() {
    const ctx: any = this.context;
    const init = this.fieldInit;
    const metaTreeProvider = () => ctx.getPropertyMetaTree?.();
    const fieldName = this.fieldPath;
    const collection = ctx.collection;
    const dataSourceKey = collection?.dataSourceKey;
    const fieldPath = this.fieldPath;

    const FieldRow: React.FC = () => {
      const [tempRoot, setTempRoot] = React.useState<any>(null);
      React.useEffect(() => {
        if (!fieldPath) return;
        try {
          const collectionFields = collection?.getFields?.() || [];
          const cf = collectionFields.find((f: any) => f.name === fieldPath);
          const fieldModel = cf?.getFirstSubclassNameOf?.('FormFieldModel') || 'FormFieldModel';
          const created = ctx.engine.createModel({
            use: 'VariableFieldFormModel',
            subModels: {
              fields: [
                {
                  use: fieldModel,
                  stepParams: {
                    fieldSettings: {
                      init: init,
                    },
                  },
                },
              ],
            },
          });
          // 提供运行所需的上下文（集合/数据源）
          created.context?.defineProperty?.('collection', { value: collection });
          setTempRoot(created);
          return () => {
            try {
              created?.subModels?.fields?.forEach?.((m: any) => m?.remove?.());
              created?.remove?.();
            } catch (e) {
              // 忽略临时模型清理失败
              void e;
            }
          };
        } catch (e) {
          // 忽略临时模型创建失败
          void e;
        }
      }, [fieldPath]);

      // 常量编辑器（使用临时字段模型）
      const ConstantValueEditor: React.FC<any> = (inputProps) => {
        React.useEffect(() => {
          if (tempRoot) tempRoot.setProps({ ...inputProps });
        }, [tempRoot, inputProps]);
        return tempRoot ? <FlowModelRenderer model={tempRoot} showFlowSettings={false} /> : null;
      };

      // VariableInput 转换器（复用 DefaultValue 思路）
      const converters = {
        renderInputComponent: (meta: any) => {
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return ConstantValueEditor as any;
          return undefined;
        },
        resolveValueFromPath: (item: any) => {
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') return '';
          return undefined;
        },
        resolvePathFromValue: (currentValue: any) => {
          if (currentValue === null) return ['null'];
          return isVariableExpression(currentValue) ? parseValueToPath(currentValue) : ['constant'];
        },
      } as any;

      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 220, textAlign: 'right' }}>{this.fieldLabel}</div>
          <div style={{ flex: 1 }}>
            <VariableInput
              value={this.assignValue}
              onChange={(v: any) => (this.assignValue = v)}
              metaTree={metaTreeProvider}
              converters={converters}
            />
          </div>
        </div>
      );
    };
    return <FieldRow />;
  }
}

FieldAssignItemModel.define({
  label: escapeT('Assign field'),
});

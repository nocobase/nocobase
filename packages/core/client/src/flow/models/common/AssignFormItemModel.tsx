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
import { Input } from 'antd';
import { define, observable } from '@formily/reactive';
import {
  FlowModelRenderer,
  FormItem,
  VariableInput,
  escapeT,
  isVariableExpression,
  parseValueToPath,
} from '@nocobase/flow-engine';
import { FormItemModel } from '../data-blocks/form/FormItem/FormItemModel';

/**
 * 使用 FormItemModel 的“表单项”包装，内部渲染 VariableInput，并将“常量”映射到临时字段模型（VariableFieldFormModel + 字段 FieldModel）。
 */
export class AssignFormItemModel extends FormItemModel {
  assignValue: any = undefined;

  constructor(options: any) {
    super(options);
    define(this, {
      assignValue: observable,
    });
  }

  onInit(options: any) {
    // 不调用父类 onInit，避免触发基类对资源/集合的依赖（配置态无需 addAppends 等数据交互）
    const initAssign = this.getStepParams('fieldSettings', 'assignValue')?.value;
    if (typeof initAssign !== 'undefined') this.assignValue = initAssign;
    this.context.defineProperty('collectionField', {
      get: () => {
        const params = this.getStepParams('fieldSettings', 'init') || {};
        const key = `${params?.dataSourceKey}.${params?.collectionName}.${params?.fieldPath}`;
        const dsm = (this.context as any)?.dataSourceManager;
        return dsm?.getCollectionField?.(key);
      },
    });

    // 确保存在 subModels.field，便于沿用 FormItemModel 的组件切换/设置步骤（fieldComponent 等）
    try {
      const ctx: any = this.context;
      const collection = ctx.collection;
      const init = this.fieldInit;
      if (!(this.subModels as any)?.field) {
        const fields = collection?.getFields?.() || [];
        const f = fields.find((x: any) => x.name === init?.fieldPath);
        const fieldModel = f?.getFirstSubclassNameOf?.('FormFieldModel') || 'FormFieldModel';
        ctx.engine.createModel({
          use: fieldModel,
          stepParams: { fieldSettings: { init } },
          parentId: this.uid,
          subKey: 'field',
        });
      }
    } catch (e) {
      // 忽略字段子模型创建失败
      void e;
    }

    // 设置表单项的 label 与 name，保证渲染时显示标题，而不是仅冒号
    try {
      const collection = (this.context as any)?.collection;
      const fp = this.fieldPath;
      if (fp) {
        const cf = collection?.getField?.(fp);
        const label = cf?.title || fp;
        const namePath = fp.includes('.') ? fp.split('.') : [fp];
        this.setProps({ label, name: namePath });
      }
    } catch (e) {
      // 忽略表单项属性设置失败
      void e;
    }
  }

  get fieldInit() {
    return this.getStepParams('fieldSettings', 'init') || {};
  }

  get fieldPath(): string | undefined {
    return this.fieldInit?.fieldPath as string | undefined;
  }

  getAssignedEntry(): [string, any] | null {
    const name = this.fieldPath;
    if (!name) return null;
    return [name, this.assignValue];
  }

  render(): React.ReactNode {
    // 与 FormItemModel.render 结构保持一致，仅替换内部渲染为 VariableInput + 常量编辑器
    const ctx: any = this.context;
    const collection = ctx.collection;
    const init = this.fieldInit;
    const namePath = this.props?.name || (this.fieldPath ? [this.fieldPath] : undefined);
    const metaTreeProvider = () => ctx.getPropertyMetaTree?.();
    const fieldPath = this.fieldPath;

    const FieldRow: React.FC = () => {
      const [tempRoot, setTempRoot] = React.useState<any>(null);
      React.useEffect(() => {
        if (!fieldPath) return;
        try {
          const fields = collection?.getFields?.() || [];
          const f = fields.find((x: any) => x.name === fieldPath);
          const cfObj = collection?.getField?.(fieldPath);
          const relationType = cfObj?.type;
          const relationInterface = cfObj?.interface;
          const isToMany =
            relationType === 'belongsToMany' ||
            relationType === 'hasMany' ||
            relationType === 'belongsToArray' ||
            relationInterface === 'm2m' ||
            relationInterface === 'o2m' ||
            relationInterface === 'mbm';
          const fieldModel = isToMany
            ? 'RemoteSelectFieldModel'
            : f?.getFirstSubclassNameOf?.('FormFieldModel') || 'FormFieldModel';
          const created = ctx.engine.createModel({
            use: 'VariableFieldFormModel',
            subModels: {
              fields: [
                {
                  use: fieldModel,
                  stepParams: { fieldSettings: { init } },
                },
              ],
            },
          });
          // 将集合/数据源/字段/区块/资源注入临时根，保证字段组件行为一致
          created.context?.defineProperty?.('collection', { value: collection });
          try {
            const ds = ctx.dataSource;
            if (ds) created.context?.defineProperty?.('dataSource', { value: ds });
          } catch (e) {
            // 忽略数据源注入失败
            void e;
          }
          try {
            const cf2 = collection?.getField?.(init?.fieldPath);
            if (cf2) created.context?.defineProperty?.('collectionField', { value: cf2 });
          } catch (e) {
            // 忽略字段注入失败
            void e;
          }
          try {
            const block = ctx.blockModel;
            if (block) created.context?.defineProperty?.('blockModel', { value: block });
            Object.defineProperty(created.context, 'resource', {
              configurable: true,
              enumerable: true,
              get: () => block?.resource,
            });
          } catch (e) {
            // 忽略区块/资源注入失败
            void e;
          }
          // 强制可编辑，忽略原始字段的 disabled/readOnly 设置
          try {
            const fm = created?.subModels?.fields?.[0];
            const cf2 = collection?.getField?.(init?.fieldPath);
            const relationType = cf2?.type;
            const relationInterface = cf2?.interface;
            const isToMany =
              relationType === 'belongsToMany' ||
              relationType === 'hasMany' ||
              relationType === 'belongsToArray' ||
              relationInterface === 'm2m' ||
              relationInterface === 'o2m' ||
              relationInterface === 'mbm';
            fm?.setProps?.({
              disabled: false,
              readPretty: false,
              pattern: 'editable',
              updateAssociation: false,
              multiple: isToMany,
            });
            fm?.applyAutoFlows?.();
            try {
              if (!fm?.props?.fieldNames && cf2?.targetCollection) {
                const targetCol = cf2.targetCollection;
                fm.setProps({ fieldNames: { label: targetCol.titleField, value: targetCol.getPrimaryKey() } });
              }
            } catch (e) {
              void e;
            }
          } catch (e) {
            // 忽略字段模型属性设置失败
            void e;
          }
          setTempRoot(created);
          return () => {
            try {
              created?.subModels?.fields?.forEach?.((m: any) => m?.remove?.());
              created?.remove?.();
            } catch (e) {
              // 忽略临时字段模型清理失败
              void e;
            }
          };
        } catch (e) {
          // 忽略临时字段模型创建失败
          void e;
        }
      }, [fieldPath]);

      const ConstantValueEditor: React.FC<any> = (inputProps: any) => {
        React.useEffect(() => {
          if (tempRoot) {
            // 同步根 props（变量输入的受控 value/onChange）
            tempRoot.setProps({ ...inputProps });
            // 同步到具体字段模型，确保字段组件能触发 onChange
            try {
              const fm = tempRoot?.subModels?.fields?.[0];
              if (fm) {
                fm.setProps({
                  value: inputProps?.value,
                  onChange: (...args: any[]) => {
                    const next = args && args.length ? args[0] : undefined;
                    inputProps?.onChange?.(next);
                  },
                });
              }
            } catch (e) {
              // 忽略字段 props 同步失败
              void e;
            }
          }
        }, [tempRoot, inputProps]);
        // 占满可用宽度
        return tempRoot ? (
          <div style={{ width: '100%' }}>
            <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
          </div>
        ) : null;
      };

      const NullComponent: React.FC = () => <Input placeholder={'<Null>'} readOnly style={{ width: '100%' }} />;

      const converters = {
        renderInputComponent: (meta: any) => {
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return ConstantValueEditor as any;
          if (firstPath === 'null') return NullComponent as any;
          return undefined;
        },
        resolveValueFromPath: (item: any) => {
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') return '';
          if (firstPath === 'null') return null;
          return undefined;
        },
        resolvePathFromValue: (currentValue: any) => {
          if (currentValue === null) return ['null'];
          return isVariableExpression(currentValue) ? parseValueToPath(currentValue) : ['constant'];
        },
      } as any;

      // 合并变量树：在最前面追加“常量/空值”两个选项
      const mergedMetaTree = async () => {
        let base: any[] = [];
        try {
          const getTree = (this.context as any)?.getPropertyMetaTree;
          base = typeof getTree === 'function' ? await getTree() : [];
        } catch (e) {
          // 忽略变量树合并失败
          void e;
        }
        return [
          { title: '常量', name: 'constant', type: 'string', paths: ['constant'], render: ConstantValueEditor },
          { title: '空值', name: 'null', type: 'object', paths: ['null'], render: NullComponent },
          ...base,
        ];
      };

      // 计算 label：优先集合字段标题，回退为字段路径
      let labelText = this.fieldPath || '';
      try {
        const cf = collection?.getField?.(this.fieldPath);
        labelText = cf?.title || labelText;
      } catch (e) {
        // 忽略标题读取失败
        void e;
      }

      return (
        <FormItem label={labelText} name={namePath} valuePropName="__assign_value__" trigger="__assign_trigger__">
          <VariableInput
            value={this.assignValue}
            onChange={(v: any) => {
              this.assignValue = v;
            }}
            metaTree={mergedMetaTree}
            converters={converters}
          />
        </FormItem>
      );
    };

    return <FieldRow />;
  }
}

AssignFormItemModel.define({
  label: escapeT('Assign field'),
});

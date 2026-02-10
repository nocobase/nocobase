/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input } from 'antd';
import { define, observable } from '@formily/reactive';
import {
  FlowModelRenderer,
  FormItem,
  VariableInput,
  tExpr,
  isVariableExpression,
  parseValueToPath,
  isRunJSValue,
  EditableItemModel,
  jioToJoiSchema,
} from '@nocobase/flow-engine';
// 无需类型导入（避免未使用的类型）
import { FormItemModel } from '../form/FormItemModel';
import { EditFormModel } from '../form/EditFormModel';
import { FieldValidation } from '../../../../collection-manager';
import { customAlphabet as Alphabet } from 'nanoid';
import { ensureOptionsFromUiSchemaEnumIfAbsent } from '../../../internal/utils/enumOptionsUtils';
import { RunJSValueEditor } from '../../../components/RunJSValueEditor';

/**
 * 使用 FormItemModel 的“表单项”包装，内部渲染 VariableInput，并将“常量”映射到临时字段模型。
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
    const ctx: any = this.context;
    const collection = ctx?.collection;
    const init = this.fieldInit;
    if (!this.subModels?.field && collection?.getFields) {
      const fields = collection.getFields() || [];
      const f = fields.find((x) => x?.name === init?.fieldPath);
      const cfObj = collection?.getField?.(init?.fieldPath);
      const binding = EditableItemModel.getDefaultBindingByField(ctx, f);
      if (!binding) {
        return;
      }
      const fieldModel = binding.modelName;
      ctx?.engine?.createModel?.({
        use: fieldModel,
        stepParams: { fieldSettings: { init } },
        parentId: this.uid,
        subKey: 'field',
      });
    }

    // 设置表单项的 label 与 name，保证渲染时显示标题，而不是仅冒号
    const coll = (this.context as any)?.collection;
    const fp = this.fieldPath;
    if (fp) {
      const cf = coll?.getField?.(fp);
      const label = cf?.title || fp;
      const namePath = fp.includes('.') ? fp.split('.') : [fp];
      this.setProps({ label, name: namePath });
    }

    // 取消实例流覆盖：不再在实例级别改写 editItemSettings（改为类级静态流）
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

  render() {
    // 与 FormItemModel.render 结构保持一致，仅替换内部渲染为 VariableInput + 常量编辑器
    const ctx: any = this.context;
    const collection = ctx.collection;
    const init = this.fieldInit;
    const namePath = this.props?.name || (this.fieldPath ? [this.fieldPath] : undefined);
    const fieldPath = this.fieldPath;

    const FieldRow: React.FC = () => {
      const [tempRoot, setTempRoot] = React.useState<any>(null);
      React.useEffect(() => {
        if (!fieldPath) return;
        const fields = collection?.getFields?.() || [];
        const f = fields.find((x: any) => x?.name === fieldPath);
        const cfObj = collection.getField(fieldPath);
        const binding = EditableItemModel.getDefaultBindingByField(ctx, f);
        if (!binding) {
          return;
        }
        const fieldModel = binding.modelName;
        const created = ctx?.engine?.createModel?.({
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
        if (!created) return;

        // 将集合/数据源/字段/区块/资源/表单注入临时根，保证字段组件行为一致
        created.context?.defineProperty?.('collection', { value: collection });
        const ds = ctx?.dataSource;
        if (ds) created.context?.defineProperty?.('dataSource', { value: ds });
        const cf2 = collection?.getField?.(init?.fieldPath);
        if (cf2) created.context?.defineProperty?.('collectionField', { value: cf2 });
        const block = ctx?.blockModel;
        if (block) created.context?.defineProperty?.('blockModel', { value: block });
        const parentForm = ctx.form;
        if (parentForm) {
          created.context?.defineProperty?.('form', { value: parentForm });
        }
        if (created.context) {
          Object.defineProperty(created.context, 'resource', {
            configurable: true,
            enumerable: true,
            get: () => block?.resource,
          });
        }

        // 强制可编辑，忽略原始字段的 disabled/readOnly 设置
        const fm = created?.subModels?.fields?.[0];
        const cfForMultiple = collection?.getField?.(init?.fieldPath);
        const relType = cfForMultiple?.type;
        const relInterface = cfForMultiple?.interface;
        const multi =
          relType === 'belongsToMany' ||
          relType === 'hasMany' ||
          relType === 'belongsToArray' ||
          relInterface === 'm2m' ||
          relInterface === 'o2m' ||
          relInterface === 'mbm';
        fm?.setProps?.({
          disabled: false,
          readPretty: false,
          pattern: 'editable',
          updateAssociation: false,
          multiple: multi,
        });
        fm?.dispatchEvent?.('beforeRender', undefined, { sequential: true, useCache: true });
        // 为本地枚举型字段补全可选项（仅在未显式传入 options 时处理）
        ensureOptionsFromUiSchemaEnumIfAbsent(fm as any, cfForMultiple as any);
        if (!fm?.props?.fieldNames && cfForMultiple?.targetCollection) {
          const targetCol = cfForMultiple.targetCollection;
          const valueKey = cfForMultiple?.targetKey || targetCol?.filterTargetKey || 'id';
          fm?.setProps?.({ fieldNames: { label: (targetCol as any)?.titleField, value: valueKey } });
        }

        setTempRoot(created);
        return () => {
          created?.subModels?.fields?.forEach?.((m: any) => m?.remove?.());
          created?.remove?.();
        };
      }, []);

      const ConstantValueEditor: React.FC<any> = (inputProps: any) => {
        React.useEffect(() => {
          if (!tempRoot) return;
          // 同步根 props（变量输入的受控 value/onChange）
          tempRoot.setProps?.({ ...inputProps });
          // 同步到具体字段模型，确保字段组件能触发 onChange
          const fm = tempRoot?.subModels?.fields?.[0];
          if (fm) {
            fm.setProps?.({
              value: inputProps?.value,
              onChange: (...args: any[]) => {
                const next = args && args.length ? args[0] : undefined;
                inputProps?.onChange?.(next);
              },
            });
          }
        }, [inputProps]);
        // 占满可用宽度
        return tempRoot ? (
          <div style={{ width: '100%' }}>
            <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
          </div>
        ) : null;
      };

      const NullComponent: React.FC = () => <Input placeholder={'<Null>'} readOnly style={{ width: '100%' }} />;

      const RunJSComponent: React.FC<any> = (inputProps: any) => {
        return (
          <RunJSValueEditor
            t={this.context.t}
            value={inputProps?.value}
            onChange={inputProps?.onChange}
            containerStyle={{ width: '100%' }}
          />
        );
      };

      const converters = {
        renderInputComponent: (meta: any) => {
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return ConstantValueEditor as any;
          if (firstPath === 'null') return NullComponent as any;
          if (firstPath === 'runjs') return RunJSComponent as any;
          return undefined;
        },
        resolveValueFromPath: (item: any) => {
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') return '';
          if (firstPath === 'null') return null;
          if (firstPath === 'runjs') return { code: '', version: 'v1' };
          return undefined;
        },
        resolvePathFromValue: (currentValue: any) => {
          if (currentValue === null) return ['null'];
          if (isRunJSValue(currentValue)) return ['runjs'];
          return isVariableExpression(currentValue) ? parseValueToPath(currentValue) : ['constant'];
        },
      } as any;

      // 合并变量树：在最前面追加“常量/空值”两个选项
      const mergedMetaTree = async () => {
        const getTree = (this.context as any)?.getPropertyMetaTree;
        const base: any[] = typeof getTree === 'function' ? await getTree() : [];
        return [
          {
            title: tExpr('Constant'),
            name: 'constant',
            type: 'string',
            paths: ['constant'],
            render: ConstantValueEditor,
          },
          { title: tExpr('Null'), name: 'null', type: 'object', paths: ['null'], render: NullComponent },
          { title: tExpr('RunJS'), name: 'runjs', type: 'object', paths: ['runjs'], render: RunJSComponent },
          ...base,
        ];
      };

      // 计算 label：优先使用配置中的 label，其次集合字段标题，最后回退字段路径
      let labelText = this.props?.label ?? this.fieldPath ?? '';
      const cf = collection?.getField?.(this.fieldPath);
      labelText = this.props?.label ?? cf?.title ?? labelText;

      return (
        <FormItem
          {...this.props}
          label={labelText}
          name={namePath}
          valuePropName="__assign_value__"
          trigger="__assign_trigger__"
        >
          <VariableInput
            value={this.assignValue}
            onChange={(v: any) => {
              this.assignValue = v;
            }}
            metaTree={mergedMetaTree}
            converters={converters}
            clearValue={''}
          />
        </FormItem>
      );
    };

    return <FieldRow />;
  }
}

AssignFormItemModel.define({
  label: tExpr('Assign field'),
});

// 类级静态流：直接注册一个通用的 editItemSettings 流（去掉“字段组件切换（fieldComponent）”步骤）
AssignFormItemModel.registerFlow({
  key: 'editItemSettings',
  sort: 300,
  title: tExpr('Form item settings'),
  steps: {
    showLabel: {
      title: tExpr('Show label'),
      uiMode: { type: 'switch', key: 'showLabel' },
      defaultParams: {
        showLabel: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({ showLabel: params.showLabel });
      },
    },
    label: {
      title: tExpr('Label'),
      uiSchema: (ctx) => {
        return {
          label: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const model = ctx.model as any;
              const originTitle = model.collectionField?.title;
              field.decoratorProps = {
                ...field.decoratorProps,
                extra: model.context.t('Original field title: ') + originTitle,
              };
            },
          },
        } as any;
      },
      defaultParams: (ctx) => {
        return {
          label: (ctx.model as any).collectionField.title,
        };
      },
      handler(ctx, params) {
        if (params.label && params.label === ctx.model.collectionField?.title) {
          ctx.model.setProps({ label: params.label });
        } else {
          ctx.model.setProps({ label: ctx.t(params.label, { ns: 'lm-flow-engine' }) });
        }
      },
    },
    init: {
      async handler(ctx) {
        const collectionField = (ctx.model as any).collectionField;
        if (collectionField) {
          ctx.model.setProps(collectionField.getComponentProps());
        }
        const fieldPath = (ctx.model as any).fieldPath as string;
        const fullName = fieldPath.includes('.') ? fieldPath.split('.') : fieldPath;
        ctx.model.setProps({
          name: fullName,
        });
      },
    },

    tooltip: {
      title: tExpr('Tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ tooltip: ctx.t(params.tooltip, { ns: 'lm-flow-engine' }) });
      },
    },
    description: {
      title: tExpr('Description'),
      uiSchema: {
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({
          extra: ctx.t(params.description, { ns: 'lm-flow-engine' }),
        });
      },
    },
    validation: {
      title: tExpr('Validation'),
      use: 'validation',
    },
    required: {
      title: tExpr('Required'),
      use: 'required',
    },
  },
});

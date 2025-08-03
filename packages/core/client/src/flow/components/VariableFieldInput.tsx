/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, FieldContext } from '@formily/react';
import { uid } from '@formily/shared';
import { FlowModelRenderer, MetaTreeNode, useFlowSettingsContext, VariableSelector } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import { EditableFieldModel } from '../models/fields/EditableField/EditableFieldModel';
import { VariableFieldFormModel } from '../models/fields/EditableField/VariableFieldFormModel';
import { Space } from 'antd';
import { ReactiveField } from '../formily/ReactiveField';
import { VariableTag } from './VariableTag';

interface VariableFieldInputProps {
  value: any; // 任意类型，表示当前值
  onChange: (value: any) => void; // 表示值改变的回调
  metaTree: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>); // 表示元数据树，可能是异步函数
  model: EditableFieldModel; // EditableFieldModel 及其子类的实例
}

/**
 * 创建变量字段模型类的工厂函数
 */
function createVariableFieldModelClass(ModelClass: any) {
  class TempVariableModel extends ModelClass {
    // 继承原有功能，可以在这里添加特定的变量字段行为
    get component() {
      return null; // 不设置默认组件
    }

    // 创建稳定的 onChange 处理方法，避免每次渲染都创建新函数
    handleVariableChange = (newValue: any) => {
      console.log('🎯 VariableSelector onChange:', { newValue, oldValue: this.props.value });

      // 如果传入的是数组，按照 handleChange 逻辑处理
      if (Array.isArray(newValue)) {
        console.log('🔧 处理数组输入:', newValue);
        if (!newValue || newValue.length === 0) {
          newValue = null;
        } else {
          const firstValue = newValue[0];
          if (firstValue === 'null') {
            newValue = null;
          } else if (firstValue === 'constant') {
            newValue = '';
          } else {
            const variablePath = newValue.join('.');
            newValue = `{{ ctx.${variablePath} }}`;
          }
        }
        console.log('🔧 数组处理结果:', newValue);
      }

      this.props.onChange?.(newValue);
      // 当选择"Null"或"Constant"时，除了清空value，还要切换至普通的model对应的组件
      if (newValue === null || newValue === '') {
        // 重新渲染整个VariableFieldModel
        this.setProps({ value: newValue });
      } else if (newValue && typeof newValue === 'string' && /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/.test(newValue)) {
        // 当选择变量时，也要更新 props
        this.setProps({ value: newValue });
      }
    };

    // 创建稳定的清除方法
    handleClear = () => {
      // 点击清除按钮时，切换到常量模式
      this.props.onChange?.('');
      this.setProps({ value: '' });
    };

    // 创建稳定的原始组件 onChange 方法
    handleOriginalChange = (eventOrValue: any) => {
      // 关键修复：检查是否是事件对象，如果是则提取 target.value
      let actualValue = eventOrValue;
      if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
        actualValue = eventOrValue.target.value;
      }
      console.log('🖊️ User input in OriginalComponent:', { oldValue: this.props.value, eventOrValue, actualValue });
      // 同时更新field值和调用外部onChange，确保数据同步
      this.field.setValue(actualValue);
      this.props.onChange?.(actualValue);
    };

    render() {
      return (
        <FieldContext.Provider value={this.field}>
          <ReactiveField key={this.uid} field={this.field}>
            {this.renderVariableContent()}
          </ReactiveField>
        </FieldContext.Provider>
      );
    }

    renderVariableContent() {
      // 从props中获取参数，优先使用props的值确保数据同步
      const value = this.props.value ?? this.field.value;
      const metaTree = this.props.metaTree;
      const originalModel = this.props.originalModel;

      console.log('🎨 VariableFieldModel.renderVariableContent called:', {
        value,
        uid: this.uid,
        allProps: this.props,
        hasOriginalModel: !!originalModel,
      });

      // value 有两种可能，一种是 /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/, 一种是普通字符串
      const variablePattern = /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/;
      const isVariable = typeof value === 'string' && variablePattern.test(value);

      console.log('🔍 Variable detection:', { value, isVariable, pattern: variablePattern.toString() });

      // return <span>222</span>;

      if (isVariable) {
        // 一个变量渲染的组件，这个组件外观也是一个输入框，但是它会把变量用一整个antd tag的方式渲染
        // 即类似于 [ctx/aaa/bbb][变量选择组件], 这两个组件应该用antd 里的Compact包一下
        return (
          <Space.Compact style={{ width: '100%' }}>
            <VariableTag value={value} metaTree={metaTree} onClear={this.handleClear} />
            <VariableSelector metaTree={metaTree} value={value} onChange={this.handleVariableChange} />
          </Space.Compact>
        );
      } else {
        // model 对应的原始组件，可以手动输入: [可以通过 model.component获得][变量选择组件], 这两个组件应该用antd 里的Compact包一下
        const [OriginalComponent, originalProps] = originalModel?.component || [() => <input />, {}];

        return (
          <Space.Compact style={{ width: '100%' }}>
            <div style={{ flex: 1 }}>
              <OriginalComponent {...originalProps} value={value} onChange={this.handleOriginalChange} />
            </div>
            <VariableSelector metaTree={metaTree} value={value} onChange={this.handleVariableChange} />
          </Space.Compact>
        );
      }
    }
  }

  EditableFieldModel.registerFlow({
    key: 'variableFieldSettings',
    sort: 1000,
    steps: {
      valueChangeEvent: {
        handler(ctx) {
          ctx.model.field.setComponentProps({ onChange: ctx.model.props.onChange });
        },
      },
    },
  });

  return TempVariableModel;
}

export const VariableFieldInput = connect((props: VariableFieldInputProps) => {
  const { value, onChange, model, metaTree } = props;
  const ctx = useFlowSettingsContext<EditableFieldModel>();

  console.log('🔍 VariableFieldInput render:', { value, fieldPath: ctx.model.fieldPath });

  // // 包装 onChange 增加日志
  // const onChange = React.useCallback(
  //   (newValue: any) => {
  //     console.log('🚀 VariableFieldInput外部onChange被调用:', {
  //       oldValue: value,
  //       newValue,
  //       fieldPath: ctx.model.fieldPath,
  //       hasOriginalOnChange: !!originalOnChange,
  //     });
  //     originalOnChange?.(newValue);
  //   },
  //   [value, originalOnChange, ctx.model.fieldPath],
  // );

  const newModel = useMemo(() => {
    // 首先获得model实例的类
    const ModelClass = model.constructor as any;

    // 使用工厂函数创建变量字段模型类
    const TempVariableModel = createVariableFieldModelClass(ModelClass);
    const tempClassName = `Var${model.uid}`;

    // 将上面的临时的类注册进 flowEngine, name可以为`Var${model.uid}`
    const engine = model.context.engine;
    engine.registerModels({ [tempClassName]: TempVariableModel });

    const fieldPath = ctx.model.fieldPath;
    const options = {
      use: 'VariableFieldFormModel',
      subModels: {
        fields: [
          {
            ...model.serialize(),
            use: tempClassName, // 相当于继承自 model.use
            // use: model.use,
            uid: uid(),
            parentId: null,
            subKey: null,
            subType: null,
          },
        ],
      },
    };
    const newModel = model.context.engine.createModel(options as any);

    return newModel;
  }, [model.uid, ctx.model.fieldPath]); // 只依赖稳定的值，移除 onChange 依赖

  // 单独更新 form 值和 VariableFieldModel props，避免重新创建 model
  React.useEffect(() => {
    const fieldPath = ctx.model.fieldPath;
    console.log('🔄 useEffect triggered:', { value, fieldPath, currentFormValues: newModel.form.values });

    const variableFieldModel = newModel.subModels.fields[0];

    if (variableFieldModel) {
      console.log('🔧 Setting VariableFieldModel props:', { value, fieldPath, oldProps: variableFieldModel.props });
      variableFieldModel.setProps({
        value: value,
        onChange: (newValue: any) => {
          console.log('⚡ VariableFieldModel.onChange called:', { newValue, fieldPath });
          onChange(newValue);
        },
        metaTree: metaTree,
        originalModel: model,
      });
    }
  }, [value, metaTree, newModel, ctx.model.fieldPath, model, onChange]);

  return (
    <div>
      <FlowModelRenderer model={newModel} showFlowSettings={false} />
    </div>
  );
});

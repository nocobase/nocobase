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
import { FlowModelRenderer, MetaTreeNode } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import { EditableFieldModel } from '../models/fields/EditableField/EditableFieldModel';
import { VariableFieldFormModel } from '../models/fields/EditableField/VariableFieldFormModel';
import { Space } from 'antd';
import { ReactiveField } from '../formily/ReactiveField';
import { VariableTag } from './VariableTag';
import { VariableSelector } from './VariableSelector';

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
    get component() {
      return null; // 不设置默认组件
    }

    handleVariableChange = (newValue: any) => {
      // 如果传入的是数组，按照 handleChange 逻辑处理
      if (Array.isArray(newValue)) {
        if (!newValue || newValue.length === 0) {
          newValue = null;
        } else {
          const firstValue = newValue[0];
          if (firstValue === 'null') {
            newValue = '';
          } else if (firstValue === 'constant') {
            newValue = '';
          } else {
            const variablePath = newValue.join('.');
            newValue = `{{ ctx.${variablePath} }}`;
          }
        }
      }

      this.props.onChange?.(newValue);
      this.setProps({ value: newValue });
    };

    handleOriginalChange = (eventOrValue: any) => {
      let actualValue = eventOrValue;
      if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
        actualValue = eventOrValue.target.value;
      }
      this.field.setValue(actualValue);
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

      // value 有两种可能，一种是 /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/, 一种是普通字符串
      const variablePattern = /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/;
      const isVariable = typeof value === 'string' && variablePattern.test(value);

      if (isVariable) {
        return (
          <Space.Compact style={{ width: '100%' }}>
            <VariableTag value={value} metaTree={metaTree} onClear={() => this.setProps({ value: '' })} />
            <VariableSelector metaTree={metaTree} value={value} onChange={this.handleVariableChange} />
          </Space.Compact>
        );
      } else {
        // model 对应的原始组件，可以手动输入: [可以通过 model.component获得][变量选择组件], 这两个组件应该用antd 里的Compact包一下
        const [OriginalComponent, originalProps] = originalModel?.component || [() => <input />, {}];

        return (
          <Space.Compact style={{ width: '100%' }}>
            <div style={{ flex: 1 }}>
              <OriginalComponent
                {...originalProps}
                {...this.field?.componentProps}
                value={value}
                onChange={this.handleOriginalChange}
              />
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
          if (ctx.model.props.onChange && !ctx.model.field.componentProps?.onChange) {
            ctx.model.field.setComponentProps({ onChange: ctx.model.props.onChange });
          }
        },
      },
    },
  });

  return TempVariableModel;
}

export const VariableFieldInput = connect((props: VariableFieldInputProps) => {
  const { value, onChange, model, metaTree } = props;

  const newModel = useMemo(() => {
    // 首先获得model实例的类
    const ModelClass = model.constructor as any;
    const TempVariableModel = createVariableFieldModelClass(ModelClass);
    const tempClassName = `Var${model.uid}`;

    // 将上面的临时的类注册进 flowEngine, name可以为`Var${model.uid}`
    const engine = model.context.engine;
    engine.registerModels({ [tempClassName]: TempVariableModel });

    const options = {
      use: 'VariableFieldFormModel',
      subModels: {
        fields: [
          {
            ...model.serialize(),
            use: tempClassName, // 相当于继承自 model.use
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
  }, [model]);

  // 单独更新 form 值和 VariableFieldModel props，避免重新创建 model
  React.useEffect(() => {
    const variableFieldModel = newModel.subModels.fields[0];

    if (variableFieldModel) {
      variableFieldModel.setProps({
        value: value,
        onChange,
        metaTree: metaTree,
        originalModel: model,
      });
    }
  }, [value, metaTree, newModel, model, onChange]);

  return (
    <div>
      <FlowModelRenderer model={newModel} showFlowSettings={false} />
    </div>
  );
});

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
import { FlowModelRenderer, MetaTreeNode, useFlowContext, VariableInput } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import { ReactiveField } from '../formily/ReactiveField';
import { EditableFieldModel } from '../models';
import { Input } from 'antd';

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
    async afterApplyAutoFlows() {
      this.showTitle?.(null);
      this.setDescription?.(null);
      this.setPattern?.('editable');
      if (this.props.onChange && !this.field.componentProps?.onChange) {
        this.field.setComponentProps({ onChange: this.props.onChange });
      }
      const initialValueParams = this.getStepParams('formItemSettings', 'initialValue');
      this.field.setValue(initialValueParams?.defaultValue);
    }

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
            {/* {this.renderVariableContent()} */}
          </ReactiveField>
        </FieldContext.Provider>
      );
    }

    renderVariableContent() {
      // 从props中获取参数，优先使用props的值确保数据同步
      const value = this.props.value ?? this.field.value;
      const originalModel = this.props.originalModel;
      // model 对应的原始组件，可以手动输入: [可以通过 model.component获得][变量选择组件], 这两个组件应该用antd 里的Compact包一下
      const [OriginalComponent, originalProps] = originalModel?.component || [() => <input />, {}];

      return (
        <OriginalComponent
          {...originalProps}
          {...this.props}
          {...this.field?.componentProps}
          value={value}
          onChange={this.handleOriginalChange}
        />
      );
    }
  }

  return TempVariableModel;
}

export const DefaultValue = connect((props: VariableFieldInputProps) => {
  const { value, onChange } = props;
  const ctx = useFlowContext();
  const model = ctx.model;
  const newModel = useMemo(() => {
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

  const metaTree = useMemo<MetaTreeNode[]>(() => {
    const ctxMetaTree = ctx.getPropertyMetaTree();
    return [
      {
        title: 'Constant',
        name: 'constant',
        type: 'string',
      },
      {
        title: 'Null',
        name: 'null',
        type: 'object',
      },
      ...ctxMetaTree,
    ];
  }, [model]);
  React.useEffect(() => {
    const variableFieldModel = newModel.subModels.fields[0];
    if (variableFieldModel) {
      variableFieldModel.setProps({
        onChange: (eventOrValue) => {
          let actualValue = eventOrValue;
          if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
            actualValue = eventOrValue.target.value;
          }
          onChange?.(actualValue);
          variableFieldModel.field?.setValue(actualValue);
        },
        metaTree: metaTree,
        originalModel: model,
      });
    }
  }, [metaTree, newModel, model, onChange]);

  const InputComponent = useMemo(
    () => (props) => {
      newModel.setProps({ ...props });
      return (
        <div style={{ flexGrow: 1 }}>
          <FlowModelRenderer model={newModel} showFlowSettings={false} />
        </div>
      );
    },
    [],
  );
  const NullComponent = useMemo(() => () => <Input placeholder="<Null>" readOnly />, []);

  return (
    <VariableInput
      metaTree={metaTree}
      {...props}
      converters={{
        renderInputComponent: (item) => {
          if (item?.fullPath?.[0] === 'constant' || !item) {
            return InputComponent;
          }
          if (item?.fullPath?.[0] === 'null') {
            return NullComponent;
          }
        },
        resolveValueFromPath: (item) => {
          if (item?.fullPath[0] === 'Constant') return null;
        },
      }}
    />
  );
});

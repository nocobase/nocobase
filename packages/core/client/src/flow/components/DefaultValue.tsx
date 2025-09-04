/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect } from '@formily/react';
import { uid } from '@formily/shared';
import { FlowModelRenderer, MetaTreeNode, useFlowContext, VariableInput } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
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
    async onBeforeAutoFlows(): Promise<void> {
      try {
        const params = this.getStepParams?.('fieldSettings', 'init') || {};
        let cf: any = undefined;
        if (params?.dataSourceKey && params?.collectionName && params?.fieldPath) {
          const key = `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`;
          cf = this.context?.dataSourceManager?.getCollectionField?.(key);
        }
        // fallback kept for compatibility if upstream passes originalModel in props
        if (!cf && this.props?.originalModel?.collectionField) {
          cf = this.props.originalModel.collectionField;
        }
        if (cf) {
          this.context.defineProperty('collectionField', { get: () => cf });
        }
      } catch (err) {
        // silent fallback; default value editor should not break on context
      }
    }

    async onAfterAutoFlows() {
      this.showTitle?.(null);
      this.setDescription?.(null);
      this.setPattern?.('editable');
      if (this.props.onChange) {
        this.setProps({ onChange: this.props.onChange });
      }
      const initialValueParams = this.getStepParams('formItemSettings', 'initialValue');
      const initVal = initialValueParams?.defaultValue;
      if (typeof initVal !== 'undefined') {
        this.setProps({ value: initVal });
      }
    }

    // 使用原字段模型的默认渲染（不覆写 render），以便遵循 FieldModel + FormItem 的正常渲染链路
  }

  return TempVariableModel;
}

export const DefaultValue = connect((props: VariableFieldInputProps) => {
  const { value, onChange } = props;
  const ctx = useFlowContext();
  const model = ctx.model;
  const newModel = useMemo(() => {
    const hostModel: any = model as any;
    const originalFieldModel: any = hostModel?.subModels?.field;
    const TargetFieldClass: any = originalFieldModel?.constructor || (model.constructor as any);
    const TempVariableModel = createVariableFieldModelClass(TargetFieldClass);
    const tempClassName = `Var${model.uid}`;

    // 将上面的临时的类注册进 flowEngine, name可以为`Var${model.uid}`
    const engine = model.context.engine;
    engine.registerModels({ [tempClassName]: TempVariableModel });

    const initParams =
      (hostModel as any)?.getStepParams?.('fieldSettings', 'init') ||
      originalFieldModel?.getStepParams?.('fieldSettings', 'init');

    // 方案A：直接渲染临时 FieldModel（不再包 FormItemModel）
    const fieldSubModel = {
      use: tempClassName, // 按原字段模型渲染，但与外部完全隔离
      uid: uid(),
      parentId: null,
      subKey: null,
      subType: null,
      stepParams: initParams
        ? {
            fieldSettings: {
              init: initParams,
            },
          }
        : undefined,
      props: {
        disabled: false,
      },
    } as any;

    const options = {
      use: 'VariableFieldFormModel',
      subModels: {
        fields: [fieldSubModel],
      },
    };

    const created = model.context.engine.createModel(options as any);
    return created;
  }, [model]);

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
  const metaTree = useMemo<MetaTreeNode[]>(() => {
    const ctxMetaTree = ctx.getPropertyMetaTree();
    return [
      {
        title: 'Constant',
        name: 'constant',
        type: 'string',
        paths: ['constant'],
        render: InputComponent,
      },
      {
        title: 'Null',
        name: 'null',
        type: 'object',
        paths: ['null'],
        render: NullComponent,
      },
      ...ctxMetaTree,
    ];
  }, [model]);
  React.useEffect(() => {
    const fieldModel = newModel.subModels.fields?.[0] as any;
    if (fieldModel) {
      // 仅传递值与事件（完全隔离）
      fieldModel.setProps({
        disabled: false,
        value: props.value,
        onChange: (eventOrValue) => {
          let actualValue = eventOrValue;
          if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
            actualValue = eventOrValue.target.value;
          }
          onChange?.(actualValue);
        },
      });
    }
  }, [newModel, onChange, props.value]);

  return (
    <VariableInput
      metaTree={metaTree}
      {...props}
      converters={{
        // 选择 Constant 时，输入框显示空字符串而不是 CTX.constant
        resolveValueFromPath: (item) => (item?.paths?.[0] === 'constant' ? '' : undefined),
      }}
    />
  );
});

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
import { FlowModelRenderer, MetaTreeNode, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import { EditableFieldModel } from '../models/fields/EditableField/EditableFieldModel';
import { VariableFieldFormModel } from '../models/fields/EditableField/VariableFieldFormModel';

interface VariableFieldInputProps {
  value: any; // 任意类型，表示当前值
  onChange: (value: any) => void; // 表示值改变的回调
  metaTree: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>); // 表示元数据树，可能是异步函数
  model: EditableFieldModel; // EditableFieldModel 及其子类的实例
}

export const VariableFieldInput = connect((props: VariableFieldInputProps) => {
  const { value, onChange, model, metaTree } = props;
  const ctx = useFlowSettingsContext<EditableFieldModel>();

  console.log('🔍 VariableFieldInput render:', { value, fieldPath: ctx.model.fieldPath });

  // 该组件实际要渲染的是一个 formily 里的 form, form可以直接用 VariableFieldFormModel
  // 这个表单里面会有一自己的model， 可以叫做newModel, 这个newModel 就是利用该组件的 model 参数的 serialize() 方法获得的参数，来创建的新model
  const newModel = useMemo(() => {
    const fieldPath = ctx.model.fieldPath;
    const options = {
      use: 'VariableFieldFormModel',
      subModels: {
        fields: [
          {
            ...model.serialize(),
            use: 'VariableFieldModel', // 使用VariableFieldModel而不是原始model
            uid: uid(),
            parentId: null,
            subKey: null,
            subType: null,
          },
        ],
      },
    };
    // 新model可以取名为 VariableFieldModel, 创建model实例时应该用 flowEngine.createModel，不要直接new
    const newModel = model.context.engine.createModel(options as any) as VariableFieldFormModel;

    return newModel;
  }, [model.uid, ctx.model.fieldPath]); // 只依赖稳定的值，移除 onChange 依赖

  // 单独更新 form 值和 VariableFieldModel props，避免重新创建 model
  React.useEffect(() => {
    const fieldPath = ctx.model.fieldPath;
    console.log('🔄 useEffect triggered:', { value, fieldPath, currentFormValues: newModel.form.values });

    // 设置VariableFieldModel的props，让它直接与外部同步，不通过表单
    const variableFieldModel = newModel.subModels.fields[0];
    if (variableFieldModel) {
      console.log('🔧 Setting VariableFieldModel props:', { value, fieldPath, oldProps: variableFieldModel.props });
      variableFieldModel.setProps({
        value: value,
        // 直接调用外部 onChange，绕过表单机制
        onChange: (newValue: any) => {
          console.log('⚡ VariableFieldModel.onChange called:', { newValue, fieldPath });
          // 直接调用外部 onChange，而不是通过表单
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

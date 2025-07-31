/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect } from '@formily/react';
import { FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { useMemo, useEffect, useRef } from 'react';
import { FieldModel } from '../models/base/FieldModel';
import { VariableValueFormModel } from '../models/fields/EditableField/VariableValueFormModel';
import { MetaTreeNode } from '@nocobase/flow-engine';

const VARIABLE_REGEX = /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/;

interface VariableValueProps {
  /** 当前值 */
  value?: any;
  /** 值改变回调 */
  onChange?: (value: any) => void;
  /** 变量选择器变化回调 */
  variableChange?: (value: string[], optionPath?: any[]) => void;
  /** 变量选择器的当前值 */
  variableValue?: string[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义变量元数据树，支持函数形式 */
  propertyMetaTree?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
}

export const VariableValue = connect((props: VariableValueProps) => {
  const { value, onChange, variableChange, variableValue, disabled, propertyMetaTree } = props;
  const ctx = useFlowSettingsContext<FieldModel>();
  const isUpdatingRef = useRef(false);

  const model = useMemo(() => {
    const fieldPath = ctx.model.fieldPath;

    // 获取原始组件信息
    const originalComponent = ctx.model['component'];

    // 始终使用 VariableFieldModel，让它内部智能切换
    const options = {
      use: 'VariableValueFormModel',
      uid: ctx.model.uid + 'form-var',
      subModels: {
        fields: [
          {
            ...ctx.model.serialize(),
            use: 'VariableFieldModel',
            uid: ctx.model.uid + '-var',
            parentId: null,
            subKey: null,
            subType: null,
          },
        ],
      },
    };
    const model = ctx.engine.createModel(options as any) as VariableValueFormModel;
    model.invalidateAutoFlowCache(true);
    // 设置 VariableFieldModel 的原始组件信息
    const variableFieldModel = model.subModels['fields'][0];
    if (variableFieldModel && originalComponent) {
      if (Array.isArray(originalComponent)) {
        variableFieldModel.originalComponent = originalComponent[0];
        variableFieldModel.originalComponentProps = originalComponent[1] || {};
      } else {
        variableFieldModel.originalComponent = originalComponent;
        variableFieldModel.originalComponentProps = {};
      }
    }

    const handleValueChange = (values: any) => {
      // 防止循环调用
      if (isUpdatingRef.current) {
        return;
      }

      // 只有当值真的发生变化时才调用 onChange
      if (values[fieldPath] !== value) {
        isUpdatingRef.current = true;
        onChange?.(values[fieldPath]);

        // 在下一个 tick 重置标志
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    };

    model.onChange = handleValueChange;

    // 设置 VariableFieldModel 的变量选择器相关属性
    if (variableFieldModel) {
      variableFieldModel.variableChange = variableChange;
      variableFieldModel.variableValue = variableValue;
      variableFieldModel.propertyMetaTree = propertyMetaTree;
    }

    model.form.setValues({ [fieldPath]: value });

    return model;
  }, [ctx.model.uid, ctx.model.fieldPath, variableChange, variableValue, disabled, propertyMetaTree]);

  // 使用 useEffect 来同步值变化，但不重建模型
  useEffect(() => {
    if (isUpdatingRef.current) {
      return;
    }

    const fieldPath = ctx.model.fieldPath;

    // 更新 VariableFieldModel 的变量选择器相关属性
    const variableFieldModel = model.subModels['fields'][0];
    if (variableFieldModel) {
      variableFieldModel.variableChange = variableChange;
      variableFieldModel.variableValue = variableValue;
      variableFieldModel.propertyMetaTree = propertyMetaTree;
    }

    if (model.form.values[fieldPath] !== value) {
      // 直接设置值
      model.form.setValues({ [fieldPath]: value });

      // 手动调用 handleValueChange
      if (model.onChange) {
        model.onChange({ [fieldPath]: value });
      }
    }
  }, [value, model, variableChange, variableValue, disabled, propertyMetaTree]);

  return (
    <div>
      <FlowModelRenderer model={model} showFlowSettings={false} />
    </div>
  );
});

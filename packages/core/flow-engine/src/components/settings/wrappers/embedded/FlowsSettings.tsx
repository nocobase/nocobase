/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert } from 'antd';
import { useFlowModelById } from '../../../../hooks';
import { observer } from '@formily/react';
import FlowsSettingsContent from './FlowsSettingsContent';

// 简单的流程设置组件接口
interface ModelProvidedProps {
  model: any;
  expandAll?: boolean; // 是否展开所有Collapse，默认为false
  children?: React.ReactNode; // 子组件，如果提供则作为wrapper模式
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  expandAll?: boolean; // 是否展开所有Collapse，默认为false
  children?: React.ReactNode; // 子组件，如果提供则作为wrapper模式
}

type FlowsSettingsProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowsSettingsProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowsSettings组件 - 简单的流程配置界面
 *
 * 功能特性：
 * - 流程配置界面
 * - Wrapper 模式支持
 *
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowsSettings model={myModel} />
 * 2. 通过uid和modelClassName获取model: <FlowsSettings uid="model1" modelClassName="MyModel" />
 *
 * 支持两种模式：
 * 1. 独立设置界面: <FlowsSettings model={myModel} />
 * 2. Wrapper模式: <FlowsSettings model={myModel}>{children}</FlowsSettings>
 *
 * @param props.expandAll 是否展开所有Collapse，默认为false
 * @param props.children 子组件，如果提供则作为wrapper模式
 */
const FlowsSettings: React.FC<FlowsSettingsProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowsSettingsWithModelById {...props} />;
  } else {
    return <FlowsSettingsWithModel {...props} />;
  }
};

// 使用传入的model
const FlowsSettingsWithModel: React.FC<ModelProvidedProps> = observer(({ model, expandAll = false, children }) => {
  if (!model) {
    return <Alert message="提供的模型无效" type="error" />;
  }

  const settingsContent = <FlowsSettingsContent model={model} expandAll={expandAll} />;

  // 如果有children，作为wrapper模式
  if (children) {
    return (
      <div>
        {settingsContent}
        {children}
      </div>
    );
  }

  // 如果没有children，返回设置内容
  return settingsContent;
});

// 通过useModelById hook获取model
const FlowsSettingsWithModelById: React.FC<ModelByIdProps> = observer(
  ({ uid, modelClassName, expandAll = false, children }) => {
    const model = useFlowModelById(uid, modelClassName);

    if (!model) {
      return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
    }

    const settingsContent = <FlowsSettingsContent model={model} expandAll={expandAll} />;

    // 如果有children，作为wrapper模式
    if (children) {
      return (
        <div>
          {settingsContent}
          {children}
        </div>
      );
    }

    // 如果没有children，返回设置内容
    return settingsContent;
  },
);

export { FlowsSettings };

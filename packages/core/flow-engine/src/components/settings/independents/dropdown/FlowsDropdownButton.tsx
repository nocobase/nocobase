/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Space, Dropdown, Alert } from 'antd';
import { SettingOutlined, DownOutlined } from '@ant-design/icons';
import { FlowModel } from '../../../../models';
import { useFlowModel } from '../../../../hooks';
import { observer } from '@formily/react';
import { FlowSettingsModal } from '../../wrappers/contextual';

// 支持两种使用方式的接口定义
interface ModelProvidedProps {
  model: FlowModel;
  text?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  disabled?: boolean;
  showDropdownIcon?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  text?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  disabled?: boolean;
  showDropdownIcon?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

type FlowsDropdownButtonProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowsDropdownButtonProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * 可自定义的下拉菜单触发按钮组件
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowsDropdownButton model={myModel} />
 * 2. 通过uid和modelClassName获取model: <FlowsDropdownButton uid="model1" modelClassName="MyModel" />
 */
export const FlowsDropdownButton: React.FC<FlowsDropdownButtonProps> = (props) => {
  if (isModelByIdProps(props)) {
    const { uid, modelClassName, ...restProps } = props;
    return <FlowsDropdownButtonWithModelById uid={uid} modelClassName={modelClassName} {...restProps} />;
  } else {
    const { model, ...restProps } = props;
    return <FlowsDropdownButtonWithModel model={model} {...restProps} />;
  }
};

// 使用传入的model
const FlowsDropdownButtonWithModel: React.FC<ModelProvidedProps> = observer(
  ({
    model,
    text = '流程配置',
    icon = <SettingOutlined />,
    size = 'middle',
    type = 'default',
    disabled = false,
    showDropdownIcon = true,
    onClick,
    style,
    className,
  }) => {
    const [selectedFlowKey, setSelectedFlowKey] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const handleClick = () => {
      onClick?.();
    };

    const handleMenuClick = useCallback(({ key }: { key: string }) => {
      setSelectedFlowKey(key);
      setModalVisible(true);
    }, []);

    const handleModalClose = useCallback(() => {
      setModalVisible(false);
      setSelectedFlowKey(null);
    }, []);

    if (!model) {
      return <Alert message="提供的模型无效" type="error" />;
    }

    // 获取可配置的flows
    const getConfigurableFlows = useCallback(() => {
      try {
        const ModelClass = model.constructor as typeof FlowModel;
        const flows = ModelClass.getFlows();

        const flowsArray = Array.from(flows.values());

        return flowsArray.filter((flow) => {
          const configurableSteps = Object.entries(flow.steps)
            .map(([stepKey, stepDefinition]) => {
              const actionStep = stepDefinition;

              // 从step获取uiSchema（如果存在）
              const stepUiSchema = actionStep.uiSchema || {};

              // 如果step使用了action，也获取action的uiSchema
              let actionUiSchema = {};
              if (actionStep.use) {
                const action = model.flowEngine?.getAction?.(actionStep.use);
                if (action && action.uiSchema) {
                  actionUiSchema = action.uiSchema;
                }
              }

              // 合并uiSchema，确保step的uiSchema优先级更高
              const mergedUiSchema = { ...actionUiSchema };

              // 将stepUiSchema中的字段合并到mergedUiSchema
              Object.entries(stepUiSchema).forEach(([fieldKey, schema]) => {
                if (mergedUiSchema[fieldKey]) {
                  mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
                } else {
                  mergedUiSchema[fieldKey] = schema;
                }
              });

              // 如果没有可配置的UI Schema，返回null
              if (Object.keys(mergedUiSchema).length === 0) {
                return null;
              }

              return { stepKey, step: actionStep, uiSchema: mergedUiSchema };
            })
            .filter(Boolean);

          return configurableSteps.length > 0;
        });
      } catch (error) {
        console.warn('[FlowsDropdownButton] 获取可配置flows失败:', error);
        return [];
      }
    }, [model]);

    const configurableFlows = getConfigurableFlows();

    // 构建菜单项
    const menuItems = configurableFlows.map((flow) => ({
      key: flow.key,
      icon: <SettingOutlined />,
      label: flow.title || flow.key,
    }));

    const button = (
      <Button
        type={type}
        size={size}
        disabled={disabled}
        icon={icon}
        onClick={handleClick}
        style={style}
        className={className}
      >
        <Space>
          {text}
          {showDropdownIcon && <DownOutlined />}
        </Space>
      </Button>
    );

    // 如果没有可配置的flows，返回普通按钮
    if (configurableFlows.length === 0) {
      return button;
    }

    return (
      <>
        <Dropdown
          menu={{
            items: menuItems,
            onClick: handleMenuClick,
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          {button}
        </Dropdown>

        {/* 设置弹窗 */}
        {selectedFlowKey && (
          <FlowSettingsModal
            model={model}
            flowKey={selectedFlowKey}
            visible={modalVisible}
            onClose={handleModalClose}
          />
        )}
      </>
    );
  },
);

// 通过useFlowModel hook获取model
const FlowsDropdownButtonWithModelById: React.FC<ModelByIdProps> = observer(
  ({
    uid,
    modelClassName,
    text = '流程配置',
    icon = <SettingOutlined />,
    size = 'middle',
    type = 'default',
    disabled = false,
    showDropdownIcon = true,
    onClick,
    style,
    className,
  }) => {
    const model = useFlowModel(uid, modelClassName);

    if (!model) {
      return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
    }

    return (
      <FlowsDropdownButtonWithModel
        model={model}
        text={text}
        icon={icon}
        size={size}
        type={type}
        disabled={disabled}
        showDropdownIcon={showDropdownIcon}
        onClick={onClick}
        style={style}
        className={className}
      />
    );
  },
);

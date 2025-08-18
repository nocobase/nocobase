/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, SettingOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { Alert, Button, Dropdown, Space } from 'antd';
import React, { useCallback } from 'react';
import { useFlowModelById } from '../../../../hooks';
import { FlowModel } from '../../../../models';

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
 *
 * 菜单结构：按flow分组显示steps
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
    const handleClick = () => {
      onClick?.();
    };

    const handleMenuClick = useCallback(
      ({ key }: { key: string }) => {
        // key格式为 "flowKey:stepKey"
        const [flowKey, stepKey] = key.split(':');

        try {
          model.openFlowSettings({
            flowKey,
            stepKey,
          });
        } catch (error) {
          // 用户取消或出错
          console.log('配置弹窗已取消或出错:', error);
        }
      },
      [model],
    );

    if (!model) {
      return <Alert message="提供的模型无效" type="error" />;
    }

    // 获取可配置的flows和steps
    const getConfigurableFlowsAndSteps = useCallback(() => {
      try {
        // const ModelClass = model.constructor as typeof FlowModel;
        const flows = model.getFlows();

        const flowsArray = Array.from(flows.values());

        return flowsArray
          .map((flow) => {
            const configurableSteps = Object.entries(flow.steps)
              .map(([stepKey, stepDefinition]) => {
                const actionStep = stepDefinition;

                // 如果步骤设置了 hideInSettings: true，则跳过此步骤
                if (actionStep.hideInSettings) {
                  return null;
                }

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

                return {
                  stepKey,
                  step: actionStep,
                  uiSchema: mergedUiSchema,
                  title: actionStep.title || stepKey,
                };
              })
              .filter(Boolean);

            return configurableSteps.length > 0 ? { flow, steps: configurableSteps } : null;
          })
          .filter(Boolean);
      } catch (error) {
        console.warn('[FlowsDropdownButton] 获取可配置flows失败:', error);
        return [];
      }
    }, [model]);

    const configurableFlowsAndSteps = getConfigurableFlowsAndSteps();

    // 构建菜单项
    const buildMenuItems = () => {
      const items = [];

      configurableFlowsAndSteps.forEach(({ flow, steps }) => {
        // 始终按flow分组显示
        items.push({
          key: `flow-group-${flow.key}`,
          label: flow.title || flow.key,
          type: 'group',
        });

        steps.forEach((stepInfo) => {
          items.push({
            key: `${flow.key}:${stepInfo.stepKey}`,
            icon: <SettingOutlined />,
            label: stepInfo.title,
          });
        });
      });

      return items;
    };

    const menuItems = buildMenuItems();

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
    if (configurableFlowsAndSteps.length === 0) {
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
      </>
    );
  },
);

// 通过useFlowModelById hook获取model
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
    const model = useFlowModelById(uid, modelClassName);

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

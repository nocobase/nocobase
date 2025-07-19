/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { Dropdown, Alert, Modal } from 'antd';
import type { MenuProps } from 'antd';
import { SettingOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { FlowModel } from '../../../../models';
import { useFlowModelById } from '../../../../hooks';
import { openStepSettingsDialog } from './StepSettingsDialog';
import { getT } from '../../../../utils';

// 右键菜单组件接口
interface ModelProvidedProps {
  model: any;
  children?: React.ReactNode; // 子组件，如果提供则作为wrapper模式
  enabled?: boolean; // 是否启用右键菜单，默认为true
  position?: 'right' | 'left'; // 右键菜单位置，默认为right
  showDeleteButton?: boolean; // 是否显示删除按钮，默认为true
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  children?: React.ReactNode; // 子组件，如果提供则作为wrapper模式
  enabled?: boolean; // 是否启用右键菜单，默认为true
  position?: 'right' | 'left'; // 右键菜单位置，默认为right
  showDeleteButton?: boolean; // 是否显示删除按钮，默认为true
}

type FlowsContextMenuProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowsContextMenuProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowsContextMenu组件 - 右键菜单组件
 *
 * 功能特性：
 * - 右键菜单
 * - Wrapper 模式支持
 * - 删除功能
 * - 按flow分组显示steps
 *
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowsContextMenu model={myModel}>{children}</FlowsContextMenu>
 * 2. 通过uid和modelClassName获取model: <FlowsContextMenu uid="model1" modelClassName="MyModel">{children}</FlowsContextMenu>
 *
 * @param props.children 子组件，必须提供
 * @param props.enabled 是否启用右键菜单，默认为true
 * @param props.position 右键菜单位置，默认为right
 * @param props.showDeleteButton 是否显示删除按钮，默认为true
 */
const FlowsContextMenu: React.FC<FlowsContextMenuProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowsContextMenuWithModelById {...props} />;
  } else {
    return <FlowsContextMenuWithModel {...props} />;
  }
};

// 使用传入的model
const FlowsContextMenuWithModel: React.FC<ModelProvidedProps> = observer(
  ({ model, children, enabled = true, position = 'right', showDeleteButton = true }) => {
    const t = getT(model);
    const handleMenuClick = useCallback(
      ({ key }: { key: string }) => {
        if (key === 'delete') {
          // 处理删除操作
          Modal.confirm({
            title: t('Confirm delete'),
            icon: <ExclamationCircleOutlined />,
            content: t('Are you sure you want to delete this item? This action cannot be undone.'),
            okText: t('Confirm Delete'),
            okType: 'danger',
            cancelText: t('Cancel'),
            onOk() {
              try {
                model.dispatchEvent('remove');
              } catch (error) {
                console.error(t('Delete operation failed'), ':', error);
                Modal.error({
                  title: t('Delete failed'),
                  content: t('Delete operation failed, please check the console for details.'),
                });
              }
            },
          });
        } else {
          // 处理step配置，key格式为 "flowKey:stepKey"
          const [flowKey, stepKey] = key.split(':');
          try {
            openStepSettingsDialog({
              model,
              flowKey,
              stepKey,
            });
          } catch (error) {
            // 用户取消或出错，静默处理
            console.log('配置弹窗已取消或出错:', error);
          }
        }
      },
      [model],
    );

    if (!model) {
      return <Alert message="提供的模型无效" type="error" />;
    }

    // 如果未启用或没有children，直接返回children
    if (!enabled || !children) {
      return <>{children}</>;
    }

    // 获取可配置的flows和steps
    const getConfigurableFlowsAndSteps = useCallback(() => {
      try {
        const ModelClass = model.constructor as typeof FlowModel;
        const flows = ModelClass.getFlows();

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
        console.warn('[FlowsContextMenu] 获取可配置flows失败:', error);
        return [];
      }
    }, [model]);

    const configurableFlowsAndSteps = getConfigurableFlowsAndSteps();

    // 如果没有可配置的flows且不显示删除按钮，直接返回children
    if (configurableFlowsAndSteps.length === 0 && !showDeleteButton) {
      return <>{children}</>;
    }

    // 构建右键菜单项
    const menuItems: MenuProps['items'] = [];

    // 添加flows和steps配置项
    if (configurableFlowsAndSteps.length > 0) {
      configurableFlowsAndSteps.forEach(({ flow, steps }) => {
        // 始终按flow分组显示
        menuItems.push({
          key: `flow-group-${flow.key}`,
          label: flow.title || flow.key,
          type: 'group',
        });

        steps.forEach((stepInfo) => {
          menuItems.push({
            key: `${flow.key}:${stepInfo.stepKey}`,
            icon: <SettingOutlined />,
            label: stepInfo.title,
          });
        });
      });
    }

    // 添加分割线和删除按钮
    if (showDeleteButton) {
      // 如果有flows配置项，添加分割线
      if (configurableFlowsAndSteps.length > 0) {
        menuItems.push({
          type: 'divider' as const,
        });
      }

      // 添加删除按钮
      menuItems.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
      });
    }

    return (
      <>
        <Dropdown
          menu={{
            items: menuItems,
            onClick: handleMenuClick,
          }}
          trigger={['contextMenu']}
          placement={position === 'left' ? 'bottomLeft' : 'bottomRight'}
        >
          <div style={{ display: 'inline-block', width: '100%' }}>{children}</div>
        </Dropdown>
      </>
    );
  },
);

// 通过useModelById hook获取model
const FlowsContextMenuWithModelById: React.FC<ModelByIdProps> = observer(
  ({ uid, modelClassName, children, enabled = true, position = 'right', showDeleteButton = true }) => {
    const model = useFlowModelById(uid, modelClassName);

    if (!model) {
      return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
    }

    return (
      <FlowsContextMenuWithModel
        model={model}
        enabled={enabled}
        position={position}
        showDeleteButton={showDeleteButton}
      >
        {children}
      </FlowsContextMenuWithModel>
    );
  },
);

export { FlowsContextMenu };

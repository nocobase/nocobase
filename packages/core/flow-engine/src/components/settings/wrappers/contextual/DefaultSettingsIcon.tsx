/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { Dropdown, Modal, App } from 'antd';
import type { MenuProps } from 'antd';
import {
  SettingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  MenuOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { FlowModel } from '../../../../models';
import { ActionStepDefinition } from '../../../../types';
import { openStepSettings } from './StepSettings';

/**
 * 默认的设置菜单图标组件
 * 提供原有的配置菜单功能
 */
export const DefaultSettingsIcon: React.FC<{
  model: FlowModel;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  [key: string]: any; // 允许额外的 props
}> = ({ model, showDeleteButton = true, showCopyUidButton = true }) => {
  const { message } = App.useApp();

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === 'copy-uid') {
        // 处理复制 uid 操作
        navigator.clipboard
          .writeText(model.uid)
          .then(() => {
            message.success('UID 已复制到剪贴板');
          })
          .catch((error) => {
            console.error('复制失败:', error);
            message.error('复制失败，请重试');
          });
      } else if (key === 'delete') {
        // 处理删除操作
        Modal.confirm({
          title: '确认删除',
          icon: <ExclamationCircleOutlined />,
          content: '确定要删除此项吗？此操作不可撤销。',
          okText: '确认删除',
          okType: 'primary',
          cancelText: '取消',
          async onOk() {
            try {
              await model.destroy();
            } catch (error) {
              console.error('删除操作失败:', error);
              Modal.error({
                title: '删除失败',
                content: '删除操作失败，请检查控制台获取详细信息。',
              });
            }
          },
        });
      } else {
        // 处理step配置，key格式为 "flowKey:stepKey"
        const [flowKey, stepKey] = key.split(':');
        try {
          openStepSettings({
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
    [model, message],
  );

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
              const actionStep = stepDefinition as ActionStepDefinition;

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
      console.warn('[DefaultSettingsIcon] 获取可配置flows失败:', error);
      return [];
    }
  }, [model]);

  const configurableFlowsAndSteps = getConfigurableFlowsAndSteps();

  // 如果没有可配置的flows且不显示删除按钮和复制UID按钮，不显示菜单
  if (configurableFlowsAndSteps.length === 0 && !showDeleteButton && !showCopyUidButton) {
    return null;
  }

  // 构建菜单项
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

  // 添加分割线、复制 uid 和删除按钮
  if (showCopyUidButton || showDeleteButton) {
    // 如果有flows配置项，添加分割线
    if (configurableFlowsAndSteps.length > 0) {
      menuItems.push({
        type: 'divider' as const,
      });
    }

    // 添加复制 uid 按钮
    if (showCopyUidButton) {
      menuItems.push({
        key: 'copy-uid',
        icon: <CopyOutlined />,
        label: '复制 UID',
      });
    }

    // 添加删除按钮
    if (showDeleteButton) {
      menuItems.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
      });
    }
  }

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: handleMenuClick,
      }}
      trigger={['hover']}
      placement="bottomRight"
    >
      <MenuOutlined role="button" aria-label="flows-settings" style={{ cursor: 'pointer', fontSize: 12 }} />
    </Dropdown>
  );
};

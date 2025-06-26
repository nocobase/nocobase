/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
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
import { StepDefinition } from '../../../../types';
import { openStepSettings } from './StepSettings';

// Type definitions for better type safety
interface StepInfo {
  stepKey: string;
  step: StepDefinition;
  uiSchema: Record<string, any>;
  title: string;
  modelKey?: string;
}

interface FlowInfo {
  flow: any;
  steps: StepInfo[];
  modelKey?: string;
}

interface MenuConfig {
  maxDepth?: number;
  enablePerformanceOptimization?: boolean;
}

/**
 * Find sub-model by key with validation
 * Supports formats: subKey or subKey[index]
 */
const findSubModelByKey = (model: FlowModel, subModelKey: string): FlowModel | null => {
  // Input validation
  if (!model || !subModelKey || typeof subModelKey !== 'string') {
    console.warn('Invalid input parameters');
    return null;
  }

  // Parse subKey[index] format
  const match = subModelKey.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\[(\d+)\])?$/);
  if (!match) {
    console.warn(`Invalid subModelKey format: ${subModelKey}`);
    return null;
  }

  const [, subKey, indexStr] = match;
  const subModel = model.subModels?.[subKey];

  if (!subModel) {
    console.warn(`SubModel '${subKey}' not found`);
    return null;
  }

  if (indexStr !== undefined) {
    // Array type sub-model
    const index = parseInt(indexStr, 10);
    if (!Array.isArray(subModel)) {
      console.warn(`Expected array for '${subKey}', got ${typeof subModel}`);
      return null;
    }
    if (index < 0 || index >= subModel.length) {
      console.warn(`Array index ${index} out of bounds for '${subKey}'`);
      return null;
    }
    return subModel[index] instanceof FlowModel ? subModel[index] : null;
  } else {
    // Object type sub-model
    if (Array.isArray(subModel)) {
      console.warn(`Expected object for '${subKey}', got array`);
      return null;
    }
    return subModel instanceof FlowModel ? subModel : null;
  }
};

/**
 * 默认的设置菜单图标组件
 * 提供原有的配置菜单功能
 */
interface DefaultSettingsIconProps {
  model: FlowModel;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  menuLevels?: number; // Menu levels: 1=current model only (default), 2=include sub-models
  flattenSubMenus?: boolean; // Whether to flatten sub-menus: false=group by model (default), true=flatten all
  [key: string]: any; // Allow additional props
}

export const DefaultSettingsIcon: React.FC<DefaultSettingsIconProps> = ({
  model,
  showDeleteButton = true,
  showCopyUidButton = true,
  menuLevels = 1, // 默认一级菜单
  flattenSubMenus = true,
}) => {
  const { message } = App.useApp();

  // 分离处理函数以便更好的代码组织
  const handleCopyUid = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(model.uid);
      message.success('UID 已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败，请重试');
    }
  }, [model.uid, message]);

  const handleDelete = useCallback(() => {
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
  }, [model]);

  const handleStepConfiguration = useCallback(
    (key: string) => {
      const keyParts = key.split(':');

      if (keyParts.length < 2 || keyParts.length > 3) {
        console.error('Invalid configuration key format:', key);
        return;
      }

      let targetModel = model;
      let flowKey: string;
      let stepKey: string;

      if (keyParts.length === 3) {
        // Sub-model configuration: subModelKey:flowKey:stepKey
        const [subModelKey, subFlowKey, subStepKey] = keyParts;
        flowKey = subFlowKey;
        stepKey = subStepKey;

        const subModel = findSubModelByKey(model, subModelKey);
        if (!subModel) {
          console.error(`Sub-model '${subModelKey}' not found`);
          return;
        }
        targetModel = subModel;
      } else {
        // Current model configuration: flowKey:stepKey
        [flowKey, stepKey] = keyParts;
      }

      try {
        openStepSettings({
          model: targetModel,
          flowKey,
          stepKey,
        });
      } catch (error) {
        console.log('配置弹窗已取消或出错:', error);
      }
    },
    [model],
  );

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      // Handle duplicate key suffixes (e.g., "key-1" -> "key")
      const cleanKey = key.includes('-') && /^(.+)-\d+$/.test(key) ? key.replace(/-\d+$/, '') : key;

      switch (cleanKey) {
        case 'copy-uid':
          handleCopyUid();
          break;
        case 'delete':
          handleDelete();
          break;
        default:
          handleStepConfiguration(cleanKey);
          break;
      }
    },
    [handleCopyUid, handleDelete, handleStepConfiguration],
  );

  // 获取单个模型的可配置flows和steps
  const getModelConfigurableFlowsAndSteps = useCallback((targetModel: FlowModel, modelKey?: string): FlowInfo[] => {
    try {
      const ModelClass = targetModel.constructor as typeof FlowModel;
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
                try {
                  const action = targetModel.flowEngine?.getAction?.(actionStep.use);
                  if (action && action.uiSchema) {
                    actionUiSchema = action.uiSchema;
                  }
                } catch (error) {
                  console.warn(`获取action '${actionStep.use}' 失败:`, error);
                }
              }

              // 合并uiSchema，确保step的uiSchema优先级更高
              const mergedUiSchema = { ...actionUiSchema };

              // 将stepUiSchema中的字段合并到mergedUiSchema
              try {
                Object.entries(stepUiSchema).forEach(([fieldKey, schema]) => {
                  if (typeof fieldKey === 'string' && schema) {
                    if (mergedUiSchema[fieldKey]) {
                      mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
                    } else {
                      mergedUiSchema[fieldKey] = schema;
                    }
                  }
                });
              } catch (error) {
                console.warn(`合并步骤 '${stepKey}' 的uiSchema时出错:`, error);
              }

              // 如果没有可配置的UI Schema，返回null
              if (Object.keys(mergedUiSchema).length === 0) {
                return null;
              }

              return {
                stepKey,
                step: actionStep,
                uiSchema: mergedUiSchema,
                title: actionStep.title || stepKey,
                modelKey, // 添加模型标识
              };
            })
            .filter(Boolean);

          return configurableSteps.length > 0 ? ({ flow, steps: configurableSteps, modelKey } as FlowInfo) : null;
        })
        .filter(Boolean);
    } catch (error) {
      console.error(`获取模型 '${targetModel?.uid || 'unknown'}' 的可配置flows失败:`, error);
      return [];
    }
  }, []);

  // 获取可配置的flows和steps
  const getConfigurableFlowsAndSteps = useCallback((): FlowInfo[] => {
    const result: FlowInfo[] = [];
    const processedModels = new Set<string>(); // 防止循环引用

    const processModel = (targetModel: FlowModel, depth: number, modelKey?: string) => {
      // 限制递归深度为menuLevels
      if (depth > menuLevels) {
        return;
      }

      // 防止循环引用
      const modelId = targetModel.uid || `temp-${Date.now()}`;
      if (processedModels.has(modelId)) {
        return;
      }
      processedModels.add(modelId);

      try {
        const modelFlows = getModelConfigurableFlowsAndSteps(targetModel, modelKey);
        result.push(...modelFlows);

        // 如果需要，处理子模型
        if (depth < menuLevels && targetModel.subModels) {
          Object.entries(targetModel.subModels).forEach(([subKey, subModelValue]) => {
            if (Array.isArray(subModelValue)) {
              subModelValue.forEach((subModel, index) => {
                if (subModel instanceof FlowModel && index < 50) {
                  // 合理的限制
                  processModel(subModel, depth + 1, `${subKey}[${index}]`);
                }
              });
            } else if (subModelValue instanceof FlowModel) {
              processModel(subModelValue, depth + 1, subKey);
            }
          });
        }
      } finally {
        processedModels.delete(modelId);
      }
    };

    processModel(model, 1);
    return result;
  }, [model, menuLevels, getModelConfigurableFlowsAndSteps]);

  const configurableFlowsAndSteps = getConfigurableFlowsAndSteps();

  // 构建菜单项，包含错误处理和记忆化
  const menuItems = useMemo((): NonNullable<MenuProps['items']> => {
    const items: NonNullable<MenuProps['items']> = [];
    const keyCounter = new Map<string, number>(); // 跟踪重复的key

    // 生成唯一key的辅助函数
    const generateUniqueKey = (baseKey: string): string => {
      const count = keyCounter.get(baseKey) || 0;
      keyCounter.set(baseKey, count + 1);
      return count === 0 ? baseKey : `${baseKey}-${count}`;
    };

    // 添加flows和steps配置项
    if (configurableFlowsAndSteps.length > 0) {
      if (flattenSubMenus) {
        // 平铺模式：只有流程分组，没有模型层级
        configurableFlowsAndSteps.forEach(({ flow, steps, modelKey }: FlowInfo) => {
          const groupKey = generateUniqueKey(`flow-group-${modelKey ? `${modelKey}-` : ''}${flow.key}`);

          // 在平铺模式下始终按流程分组
          items.push({
            key: groupKey,
            label: flow.title || flow.key,
            type: 'group',
          });

          steps.forEach((stepInfo: StepInfo) => {
            // 构建菜单项key，为子模型包含modelKey
            const baseMenuKey = modelKey
              ? `${modelKey}:${flow.key}:${stepInfo.stepKey}`
              : `${flow.key}:${stepInfo.stepKey}`;

            const uniqueKey = generateUniqueKey(baseMenuKey);

            items.push({
              key: uniqueKey,
              icon: <SettingOutlined />,
              label: stepInfo.title,
            });
          });
        });
      } else {
        // 层级模式：真正的子菜单结构
        const modelGroups = new Map<string, FlowInfo[]>();

        // 按模型分组flows
        configurableFlowsAndSteps.forEach((flowInfo) => {
          const modelKey = flowInfo.modelKey || 'current';
          if (!modelGroups.has(modelKey)) {
            modelGroups.set(modelKey, []);
          }
          const group = modelGroups.get(modelKey);
          if (group) {
            group.push(flowInfo);
          }
        });

        // 构建层级菜单结构
        modelGroups.forEach((flows, modelKey) => {
          if (modelKey === 'current') {
            // 直接添加当前模型的flows
            flows.forEach(({ flow, steps }: FlowInfo) => {
              const groupKey = generateUniqueKey(`flow-group-${flow.key}`);

              items.push({
                key: groupKey,
                label: flow.title || flow.key,
                type: 'group',
              });

              steps.forEach((stepInfo: StepInfo) => {
                const uniqueKey = generateUniqueKey(`${flow.key}:${stepInfo.stepKey}`);

                items.push({
                  key: uniqueKey,
                  icon: <SettingOutlined />,
                  label: stepInfo.title,
                });
              });
            });
          } else {
            // 为子模型创建子菜单
            const subMenuKey = generateUniqueKey(`sub-menu-${modelKey}`);
            const subMenuChildren: any[] = [];

            flows.forEach(({ flow, steps }: FlowInfo) => {
              steps.forEach((stepInfo: StepInfo) => {
                const uniqueKey = generateUniqueKey(`${modelKey}:${flow.key}:${stepInfo.stepKey}`);

                subMenuChildren.push({
                  key: uniqueKey,
                  icon: <SettingOutlined />,
                  label: stepInfo.title,
                });
              });
            });

            items.push({
              key: subMenuKey,
              label: modelKey,
              children: subMenuChildren,
            });
          }
        });
      }
    }

    return items;
  }, [configurableFlowsAndSteps, flattenSubMenus]);

  // 向菜单项添加额外按钮
  const finalMenuItems = useMemo((): NonNullable<MenuProps['items']> => {
    const items = [...menuItems];

    if (showCopyUidButton || showDeleteButton) {
      // 如果有flows配置项，添加分割线
      if (configurableFlowsAndSteps.length > 0) {
        items.push({
          type: 'divider' as const,
        });
      }

      // 添加复制uid按钮
      if (showCopyUidButton && model.uid) {
        items.push({
          key: 'copy-uid',
          icon: <CopyOutlined />,
          label: '复制 UID',
        });
      }

      // 添加删除按钮
      if (showDeleteButton && typeof model.destroy === 'function') {
        items.push({
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
        });
      }
    }

    return items;
  }, [menuItems, showCopyUidButton, showDeleteButton, configurableFlowsAndSteps.length, model.uid, model.destroy]);

  // 如果没有可配置的flows且不显示删除按钮和复制UID按钮，不显示菜单
  if (configurableFlowsAndSteps.length === 0 && !showDeleteButton && !showCopyUidButton) {
    return null;
  }

  // 渲染前验证模型
  if (!model || !model.uid) {
    console.warn('提供的模型无效');
    return null;
  }

  return (
    <Dropdown
      menu={{
        items: finalMenuItems,
        onClick: handleMenuClick,
      }}
      trigger={['hover']}
      placement="bottomRight"
    >
      <MenuOutlined role="button" aria-label="flows-settings" style={{ cursor: 'pointer', fontSize: 12 }} />
    </Dropdown>
  );
};

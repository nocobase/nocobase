/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleOutlined, MenuOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { App, Dropdown, Modal } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlowModel } from '../../../../models';
import { StepDefinition } from '../../../../types';
import { getT, resolveStepUiSchema } from '../../../../utils';
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
  const t = getT(model);

  // 分离处理函数以便更好的代码组织
  const handleCopyUid = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(model.uid);
      message.success(t('UID copied to clipboard'));
    } catch (error) {
      console.error(t('Copy failed'), ':', error);
      message.error(t('Copy failed, please try again'));
    }
  }, [model.uid, message]);

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: t('Confirm delete'),
      icon: <ExclamationCircleOutlined />,
      content: t('Are you sure you want to delete this item? This action cannot be undone.'),
      okText: t('Confirm'),
      okType: 'primary',
      cancelText: t('Cancel'),
      async onOk() {
        try {
          await model.destroy();
        } catch (error) {
          console.error(t('Delete operation failed'), ':', error);
          Modal.error({
            title: t('Delete failed'),
            content: t('Delete operation failed, please check the console for details.'),
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
        targetModel.openFlowSettings({
          flowKey,
          stepKey,
        });
      } catch (error) {
        console.log(t('Configuration popup cancelled or error'), ':', error);
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
  const getModelConfigurableFlowsAndSteps = useCallback(
    async (targetModel: FlowModel, modelKey?: string): Promise<FlowInfo[]> => {
      try {
        const flows = targetModel.getFlows();

        const flowsArray = Array.from(flows.values());

        const flowsWithSteps = await Promise.all(
          flowsArray.map(async (flow) => {
            const configurableSteps = await Promise.all(
              Object.entries(flow.steps).map(async ([stepKey, stepDefinition]) => {
                const actionStep = stepDefinition;

                // 如果步骤设置了 hideInSettings: true，则跳过此步骤
                if (actionStep.hideInSettings) {
                  return null;
                }

                // 检查是否有uiSchema（静态或动态）
                const hasStepUiSchema = actionStep.uiSchema != null;

                // 如果step使用了action，检查action是否有uiSchema
                let hasActionUiSchema = false;
                let stepTitle = actionStep.title;
                if (actionStep.use) {
                  try {
                    const action = targetModel.flowEngine?.getAction?.(actionStep.use);
                    hasActionUiSchema = action && action.uiSchema != null;
                    stepTitle = stepTitle || action.title;
                  } catch (error) {
                    console.warn(t('Failed to get action {{action}}', { action: actionStep.use }), ':', error);
                  }
                }

                // 如果都没有uiSchema（静态或动态），返回null
                if (!hasStepUiSchema && !hasActionUiSchema) {
                  return null;
                }

                // 对于动态uiSchema，需要实际解析以确定是否有内容
                let mergedUiSchema = {};

                try {
                  // 使用提取的工具函数解析并合并uiSchema
                  const resolvedSchema = await resolveStepUiSchema(targetModel, flow, actionStep);

                  // 如果解析后没有可配置的UI Schema，跳过此步骤
                  if (!resolvedSchema) {
                    return null;
                  }

                  mergedUiSchema = resolvedSchema;
                } catch (error) {
                  console.warn(t('Failed to resolve uiSchema for step {{stepKey}}', { stepKey }), ':', error);
                  return null;
                }

                return {
                  stepKey,
                  step: actionStep,
                  uiSchema: mergedUiSchema,
                  title: t(stepTitle) || stepKey,
                  modelKey, // 添加模型标识
                };
              }),
            ).then((steps) => steps.filter(Boolean));

            return configurableSteps.length > 0 ? ({ flow, steps: configurableSteps, modelKey } as FlowInfo) : null;
          }),
        ).then((flows) => flows.filter(Boolean));

        return flowsWithSteps;
      } catch (error) {
        console.error(
          t('Failed to get configurable flows for model {{model}}', { model: targetModel?.uid || 'unknown' }),
          ':',
          error,
        );
        return [];
      }
    },
    [],
  );

  // 获取可配置的flows和steps
  const getConfigurableFlowsAndSteps = useCallback(async (): Promise<FlowInfo[]> => {
    const result: FlowInfo[] = [];
    const processedModels = new Set<string>(); // 防止循环引用

    const processModel = async (targetModel: FlowModel, depth: number, modelKey?: string) => {
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
        const modelFlows = await getModelConfigurableFlowsAndSteps(targetModel, modelKey);
        result.push(...modelFlows);

        // 如果需要，处理子模型
        if (depth < menuLevels && targetModel.subModels) {
          await Promise.all(
            Object.entries(targetModel.subModels).map(async ([subKey, subModelValue]) => {
              if (Array.isArray(subModelValue)) {
                await Promise.all(
                  subModelValue.map(async (subModel, index) => {
                    if (subModel instanceof FlowModel && index < 50) {
                      // 合理的限制
                      await processModel(subModel, depth + 1, `${subKey}[${index}]`);
                    }
                  }),
                );
              } else if (subModelValue instanceof FlowModel) {
                await processModel(subModelValue, depth + 1, subKey);
              }
            }),
          );
        }
      } finally {
        processedModels.delete(modelId);
      }
    };

    await processModel(model, 1);
    return result;
  }, [model, menuLevels, getModelConfigurableFlowsAndSteps]);

  const [configurableFlowsAndSteps, setConfigurableFlowsAndSteps] = useState<FlowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfigurableFlowsAndSteps = async () => {
      setIsLoading(true);
      try {
        const flows = await getConfigurableFlowsAndSteps();
        setConfigurableFlowsAndSteps(flows);
      } catch (error) {
        console.error('Failed to load configurable flows and steps:', error);
        setConfigurableFlowsAndSteps([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigurableFlowsAndSteps();
  }, [getConfigurableFlowsAndSteps]);

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
            label: t(flow.title) || flow.key,
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
              label: t(stepInfo.title),
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
                label: t(flow.title) || flow.key,
                type: 'group',
              });

              steps.forEach((stepInfo: StepInfo) => {
                const uniqueKey = generateUniqueKey(`${flow.key}:${stepInfo.stepKey}`);

                items.push({
                  key: uniqueKey,
                  label: t(stepInfo.title),
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
                  label: t(stepInfo.title),
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
      // 使用分组呈现常用操作（不再使用分割线）
      items.push({
        key: 'common-actions',
        label: t('Common actions'),
        type: 'group' as const,
      });

      // 添加复制uid按钮
      if (showCopyUidButton && model.uid) {
        items.push({
          key: 'copy-uid',
          label: t('Copy UID'),
        });
      }

      // 添加删除按钮
      if (showDeleteButton && typeof model.destroy === 'function') {
        items.push({
          key: 'delete',
          label: t('Delete'),
        });
      }
    }

    return items;
  }, [menuItems, showCopyUidButton, showDeleteButton, model.uid, model.destroy]);

  // 如果正在加载或没有可配置的flows且不显示删除按钮和复制UID按钮，不显示菜单
  if (isLoading || (configurableFlowsAndSteps.length === 0 && !showDeleteButton && !showCopyUidButton)) {
    return null;
  }

  // 渲染前验证模型
  if (!model || !model.uid) {
    console.warn(t('Invalid model provided'));
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

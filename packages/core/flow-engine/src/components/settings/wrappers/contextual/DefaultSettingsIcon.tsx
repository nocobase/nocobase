/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleOutlined, MenuOutlined } from '@ant-design/icons';
import type { DropdownProps, MenuProps } from 'antd';
import { App, Dropdown, Modal } from 'antd';
import React, { startTransition, useCallback, useEffect, useMemo, useState, FC } from 'react';
import { FlowModel } from '../../../../models';
import { StepDefinition, StepUIMode } from '../../../../types';
import {
  getT,
  resolveStepUiSchema,
  shouldHideStepInSettings,
  resolveDefaultParams,
  resolveUiMode,
} from '../../../../utils';
import { useNiceDropdownMaxHeight } from '../../../../hooks';
import { SwitchWithTitle } from '../component/SwitchWithTitle';
import { SelectWithTitle } from '../component/SelectWithTitle';
// Type definitions for better type safety
interface StepInfo {
  stepKey: string;
  step: StepDefinition;
  uiSchema: Record<string, any>;
  title: string;
  modelKey?: string;
  uiMode?: StepUIMode;
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

const componentMap = {
  switch: SwitchWithTitle,
  select: SelectWithTitle,
};

const MenuLabelItem = ({ title, uiMode, itemProps }) => {
  const type = uiMode?.type || uiMode;
  const Component = type ? componentMap[type] : null;

  if (!Component) {
    return <>{title}</>;
  }

  return <Component title={title} {...itemProps} />;
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
  const [visible, setVisible] = useState(false);
  // 当模型发生子模型替换/增删等变化时，强制刷新菜单数据
  const [refreshTick, setRefreshTick] = useState(0);
  const handleOpenChange: DropdownProps['onOpenChange'] = useCallback((nextOpen: boolean, info) => {
    if (info.source === 'trigger' || nextOpen) {
      // 当鼠标快速滑过时，终止菜单的渲染，防止卡顿
      startTransition(() => {
        setVisible(nextOpen);
      });
    }
  }, []);
  const dropdownMaxHeight = useNiceDropdownMaxHeight([visible]);

  // 统一的复制 UID 方法
  const copyUidToClipboard = useCallback(
    async (uid: string) => {
      try {
        await navigator.clipboard.writeText(uid);
        message.success(t('UID copied to clipboard'));
      } catch (error) {
        console.error(t('Copy failed'), ':', error);
        // 如果不是 HTTPS 协议，给出更具体的提示：HTTP 下剪贴板 API 不可用
        const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
        if (!isHttps) {
          message.error(
            t(
              'Copy failed under HTTP. Clipboard API is unavailable on non-HTTPS pages. Please copy [{{uid}}] manually.',
              { uid },
            ),
          );
          return;
        } else {
          message.error(t('Copy failed, please copy [{{uid}}] manually.', { uid }));
        }
      }
    },
    [message, t],
  );

  // 复制当前模型 UID
  const handleCopyUid = useCallback(async () => {
    copyUidToClipboard(model.uid);
  }, [model.uid, copyUidToClipboard]);

  // 复制弹窗对应模型的 UID（根据菜单 key 判断是否为子模型）
  const handleCopyPopupUid = useCallback(
    (menuKey: string) => {
      try {
        const originalKey = menuKey.replace(/^copy-pop-uid:/, '');
        const keyParts = originalKey.split(':');

        let targetModel: FlowModel | null = model;
        if (keyParts.length === 3) {
          const [subModelKey] = keyParts;
          targetModel = findSubModelByKey(model, subModelKey) || model;
        } else if (keyParts.length !== 2) {
          console.error('Invalid copy-pop-uid key format:', menuKey);
          return;
        }

        copyUidToClipboard(targetModel.uid);
      } catch (error) {
        console.error('handleCopyPopupUid error:', error);
      }
    },
    [model, copyUidToClipboard],
  );

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: t('Confirm delete'),
      icon: <ExclamationCircleOutlined />,
      content: t('Are you sure you want to delete this item? This action cannot be undone.'),
      okText: t('Confirm'),
      okType: 'primary',
      cancelText: t('Cancel'),
      zIndex: 999999,
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

      if (cleanKey.startsWith('copy-pop-uid:')) {
        handleCopyPopupUid(cleanKey);
        return;
      }

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
    [handleCopyUid, handleDelete, handleStepConfiguration, handleCopyPopupUid],
  );

  // 获取单个模型的可配置flows和steps
  const getModelConfigurableFlowsAndSteps = useCallback(
    async (targetModel: FlowModel, modelKey?: string): Promise<FlowInfo[]> => {
      try {
        // 仅使用静态流（类级全局注册的 flows）
        const flowsMap = new Map((targetModel.constructor as typeof FlowModel).globalFlowRegistry.getFlows());

        const flows = flowsMap;

        const flowsArray = Array.from(flows.values());

        const flowsWithSteps = await Promise.all(
          flowsArray.map(async (flow) => {
            const configurableSteps = await Promise.all(
              Object.entries(flow.steps).map(async ([stepKey, stepDefinition]) => {
                const actionStep = stepDefinition;
                let step = actionStep;
                // 支持静态与动态 hideInSettings
                if (await shouldHideStepInSettings(targetModel, flow, actionStep)) {
                  return null;
                }
                let uiMode: any = await resolveUiMode(actionStep.uiMode, (targetModel as any).context);
                // 检查是否有uiSchema（静态或动态）
                const hasStepUiSchema = actionStep.uiSchema != null;

                // 如果step使用了action，检查action是否有uiSchema
                let hasActionUiSchema = false;
                let stepTitle = actionStep.title;
                if (actionStep.use) {
                  try {
                    const action = targetModel.getAction?.(actionStep.use);
                    step = { ...(action || {}), ...actionStep };
                    uiMode = await resolveUiMode(action?.uiMode || uiMode, (targetModel as any).context);
                    hasActionUiSchema = action && action.uiSchema != null;
                    stepTitle = stepTitle || action?.title;
                  } catch (error) {
                    console.warn(t('Failed to get action {{action}}', { action: actionStep.use }), ':', error);
                  }
                }
                const selectOrSwitchMode = ['select', 'switch'].includes(uiMode?.type || uiMode);

                // 如果都没有uiSchema（静态或动态），返回null
                if (!selectOrSwitchMode && !hasStepUiSchema && !hasActionUiSchema) {
                  return null;
                }

                // 对于动态uiSchema，需要实际解析以确定是否有内容
                let mergedUiSchema = {};

                try {
                  // 使用提取的工具函数解析并合并uiSchema
                  const resolvedSchema = await resolveStepUiSchema(targetModel, flow, actionStep);

                  // 如果解析后没有可配置的UI Schema，跳过此步骤
                  if (!resolvedSchema && !selectOrSwitchMode) {
                    return null;
                  }

                  mergedUiSchema = resolvedSchema;
                } catch (error) {
                  console.warn(t('Failed to resolve uiSchema for step {{stepKey}}', { stepKey }), ':', error);
                  return null;
                }
                return {
                  stepKey,
                  step,
                  uiSchema: mergedUiSchema,
                  title: t(stepTitle) || stepKey,
                  modelKey, // 添加模型标识
                  uiMode,
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
    const triggerRebuild = () => {
      setRefreshTick((v) => v + 1);
    };

    const visited = new Set<FlowModel>();
    const cleanups: Array<() => void> = [];

    const registerListeners = (targetModel?: FlowModel | null, depth = 1) => {
      if (!targetModel || visited.has(targetModel) || depth > menuLevels) {
        return;
      }
      visited.add(targetModel);

      const eventNames = ['onStepParamsChanged'];
      if (depth === 1) {
        eventNames.push('onSubModelAdded', 'onSubModelRemoved', 'onSubModelReplaced');
      }

      eventNames.forEach((eventName) => {
        targetModel.emitter?.on(eventName, triggerRebuild);
        cleanups.push(() => targetModel.emitter?.off(eventName, triggerRebuild));
      });

      if (depth >= menuLevels) {
        return;
      }

      Object.values(targetModel.subModels || {}).forEach((subModel) => {
        if (Array.isArray(subModel)) {
          subModel.forEach((item) => {
            if (item instanceof FlowModel) {
              registerListeners(item, depth + 1);
            }
          });
        } else if (subModel instanceof FlowModel) {
          registerListeners(subModel, depth + 1);
        }
      });
    };

    registerListeners(model);

    return () => {
      cleanups.forEach((dispose) => dispose());
    };
  }, [model, menuLevels, refreshTick]);

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
  }, [getConfigurableFlowsAndSteps, refreshTick]);

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
          if (flow.options.divider === 'top') {
            items.push({
              type: 'divider',
            });
          }
          // 在平铺模式下始终按流程分组
          if (flow.options.enableTitle) {
            items.push({
              key: groupKey,
              label: t(flow.title) || flow.key,
              type: 'group',
            });
          }

          steps.forEach((stepInfo: StepInfo) => {
            // 构建菜单项key，为子模型包含modelKey
            const baseMenuKey = modelKey
              ? `${modelKey}:${flow.key}:${stepInfo.stepKey}`
              : `${flow.key}:${stepInfo.stepKey}`;

            const uniqueKey = generateUniqueKey(baseMenuKey);
            const uiMode = stepInfo.uiMode;
            const subModel: any = findSubModelByKey(model, stepInfo.modelKey);
            const targetModel = subModel || model;
            const stepParams = targetModel.getStepParams(flow.key, stepInfo.stepKey) || {};
            const itemProps = {
              getDefaultValue: async () => {
                let defaultParams = await resolveDefaultParams(stepInfo.step.defaultParams, targetModel.context);
                if (stepInfo.step.use) {
                  const action = targetModel.getAction?.(stepInfo.step.use);
                  defaultParams = await resolveDefaultParams(action.defaultParams, targetModel.context);
                }
                return { ...defaultParams, ...stepParams };
              },
              onChange: async (val) => {
                targetModel.setStepParams(flow.key, stepInfo.stepKey, val);
                if (typeof stepInfo.step.beforeParamsSave === 'function') {
                  await stepInfo.step.beforeParamsSave(targetModel.context, val, stepParams);
                }
                await targetModel.saveStepParams();
                message?.success?.(t('Configuration saved'));
                if (typeof stepInfo.step.afterParamsSave === 'function') {
                  await stepInfo.step.afterParamsSave(targetModel.context, val, stepParams);
                }
              },
              ...((uiMode as any)?.props || {}),
              itemKey: (uiMode as any)?.key,
            };
            items.push({
              key: uniqueKey,
              label: <MenuLabelItem title={t(stepInfo.title)} uiMode={uiMode} itemProps={itemProps} />,
            });
            // add per-step copy popup uid under each configurable step
            if (flow.key === 'popupSettings' && baseMenuKey.includes('openView')) {
              const copyKey = generateUniqueKey(`copy-pop-uid:${baseMenuKey}`);
              items.push({
                key: copyKey,
                label: t('Copy popup UID'),
              });
            }
          });
          if (flow.options.divider === 'bottom') {
            items.push({
              type: 'divider',
            });
          }
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

                if (flow.key === 'popupSettings') {
                  const copyKey = generateUniqueKey(`copy-pop-uid:${flow.key}:${stepInfo.stepKey}`);
                  items.push({
                    key: copyKey,
                    label: t('Copy popup UID'),
                  });
                }
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

                if (flow.key === 'popupSettings') {
                  const copyKey = generateUniqueKey(`copy-pop-uid:${modelKey}:${flow.key}:${stepInfo.stepKey}`);
                  subMenuChildren.push({
                    key: copyKey,
                    label: t('Copy popup UID'),
                  });
                }
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
  }, [configurableFlowsAndSteps, flattenSubMenus, t]);

  // 向菜单项添加额外按钮
  const finalMenuItems = useMemo((): NonNullable<MenuProps['items']> => {
    const items = [...menuItems];

    if (showCopyUidButton || showDeleteButton) {
      items.push({
        type: 'divider',
      });
      // 使用分组呈现常用操作（不再使用分割线）

      // items.push({
      //   key: 'common-actions',
      //   label: t('Common actions'),
      //   type: 'group' as const,
      // });

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
  }, [menuItems, showCopyUidButton, showDeleteButton, model.uid, model.destroy, t]);

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
      onOpenChange={handleOpenChange}
      open={visible}
      menu={{
        items: finalMenuItems,
        onClick: handleMenuClick,
        style: { maxHeight: dropdownMaxHeight, overflowY: 'auto' },
      }}
      trigger={['hover']}
      placement="bottomRight"
    >
      <MenuOutlined role="button" aria-label="flows-settings" style={{ cursor: 'pointer', fontSize: 12 }} />
    </Dropdown>
  );
};

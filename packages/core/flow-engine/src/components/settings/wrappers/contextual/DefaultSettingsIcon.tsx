/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CheckOutlined,
  ExclamationCircleOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import type { DropdownProps, MenuProps } from 'antd';
import { App, Dropdown, Input, Modal, Tooltip, theme } from 'antd';
import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState, FC } from 'react';
import { FlowModel } from '../../../../models';
import type { FlowModelExtraMenuItem } from '../../../../models';
import type {
  ParamObject,
  StepCascadeMenuItem,
  StepCascadeMenuUIMode,
  StepDefinition,
  StepUIMode,
} from '../../../../types';
import {
  getT,
  resolveStepUiSchema,
  resolveStepDisabledInSettings,
  shouldHideStepInSettings,
  resolveDefaultParams,
  resolveUiMode,
  createFlowWithSettingSteps,
  getFlowSettingSteps,
} from '../../../../utils';
import { useNiceDropdownMaxHeight } from '../../../../hooks';
import { SwitchWithTitle } from '../component/SwitchWithTitle';
import { SelectWithTitle } from '../component/SelectWithTitle';
import type { FlowSettingsContext } from '../../../../flowContext';

const findExtraMenuItemByKey = (
  items: FlowModelExtraMenuItem[],
  targetKey: string,
): FlowModelExtraMenuItem | undefined => {
  for (const item of items) {
    const itemKey = String(item?.key ?? '');
    if (itemKey === targetKey) {
      return item;
    }
    if (item.children?.length) {
      const matched = findExtraMenuItemByKey(item.children, targetKey);
      if (matched) {
        return matched;
      }
    }
  }
  return undefined;
};

// Type definitions for better type safety
interface StepInfo {
  stepKey: string;
  step: StepDefinition;
  uiSchema: Record<string, any>;
  title: string;
  modelKey?: string;
  uiMode?: StepUIMode;
  disabled?: boolean;
  disabledReason?: string;
}

interface FlowInfo {
  flow: any;
  steps: StepInfo[];
  modelKey?: string;
}

const walkSubModels = (rootModel, options, cb) => {
  const maxDepth = options.maxDepth;
  const arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : Number.POSITIVE_INFINITY;
  const mode = options.mode ?? 'stack';

  const visited = new Set();
  const stackIds = new Set();

  const walk = (model, depth, modelKey?) => {
    if (!model || depth > maxDepth) return;

    const run = () => {
      cb(model, { depth, modelKey });
      if (depth >= maxDepth) return;

      Object.entries(model.subModels || {}).forEach(([subKey, subModelValue]) => {
        if (Array.isArray(subModelValue)) {
          const limit = Number.isFinite(arrayLimit) ? Math.min(subModelValue.length, arrayLimit) : subModelValue.length;
          for (let index = 0; index < limit; index++) {
            const subModel = subModelValue[index];
            if (subModel instanceof FlowModel) {
              walk(subModel, depth + 1, `${subKey}[${index}]`);
            }
          }
          return;
        }

        if (subModelValue instanceof FlowModel) {
          walk(subModelValue, depth + 1, subKey);
        }
      });
    };

    if (mode === 'visited') {
      if (visited.has(model)) return;
      visited.add(model);
      run();
      return;
    }

    const modelId = model.uid || `temp-${Date.now()}`;
    if (stackIds.has(modelId)) return;
    stackIds.add(modelId);
    try {
      run();
    } finally {
      stackIds.delete(modelId);
    }
  };

  walk(rootModel, 1);
};

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

type CascadeMenuState = {
  loading: boolean;
  loaded: boolean;
  error?: string | null;
  items: StepCascadeMenuItem[];
  search: string;
};

const isCascadeMenuUIMode = (uiMode: StepUIMode | undefined): uiMode is StepCascadeMenuUIMode =>
  typeof uiMode === 'object' && uiMode?.type === 'cascadeMenu';

const toParamObject = (value: unknown): ParamObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as ParamObject) : {};

const CASCADE_MENU_SEARCH_KEY = '__flow-cascade-search__';
const CASCADE_MENU_LEAF_KEY = '__flow-cascade-leaf__';

const toMenuText = (value: React.ReactNode): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
};

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const matchesCascadeSearch = (item: StepCascadeMenuItem, search: string): boolean => {
  if (!search) {
    return true;
  }
  const haystack = [item.searchText, toMenuText(item.label), item.key].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(search);
};

const filterCascadeMenuItems = (items: StepCascadeMenuItem[], searchValue: string): StepCascadeMenuItem[] => {
  const search = normalizeSearchText(searchValue);
  if (!search) {
    return items;
  }

  return items
    .map((item) => {
      const children = item.children ? filterCascadeMenuItems(item.children, searchValue) : undefined;
      if (matchesCascadeSearch(item, search) || children?.length) {
        return {
          ...item,
          children,
        };
      }
      return null;
    })
    .filter(Boolean) as StepCascadeMenuItem[];
};

const getCascadeMenuItemKey = (baseKey: string, path: string[]) =>
  `${CASCADE_MENU_LEAF_KEY}:${encodeURIComponent(baseKey)}:${path.map((item) => encodeURIComponent(item)).join('/')}`;

const getSearchMenuItemKey = (baseKey: string) => `${CASCADE_MENU_SEARCH_KEY}:${encodeURIComponent(baseKey)}`;

const CascadeMenuLabel = ({ title, displayLabel }: { title: React.ReactNode; displayLabel?: React.ReactNode }) => (
  <span
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, minWidth: 220 }}
  >
    <span style={{ whiteSpace: 'nowrap' }}>{title}</span>
    {displayLabel ? (
      <span
        style={{
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'rgba(0, 0, 0, 0.65)',
        }}
      >
        {displayLabel}
      </span>
    ) : null}
  </span>
);

const CascadeLeafLabel = ({ item }: { item: StepCascadeMenuItem }) => (
  <span
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 180 }}
  >
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
    {item.selected ? <CheckOutlined style={{ color: '#1677ff' }} /> : null}
  </span>
);

const MenuLabelItem = ({ title, uiMode, itemProps }) => {
  const type = uiMode?.type || uiMode;
  const Component = type ? componentMap[type] : null;
  const disabled = !!itemProps?.disabled;
  const disabledReason = itemProps?.disabledReason;
  const disabledIconColor = itemProps?.disabledIconColor;

  const content = (() => {
    if (!Component) {
      return <>{title}</>;
    }
    return <Component title={title} {...itemProps} />;
  })();

  if (!disabled) {
    return content;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {content}
      <Tooltip title={disabledReason} placement="right" destroyTooltipOnHide>
        <QuestionCircleOutlined style={{ color: disabledIconColor }} />
      </Tooltip>
    </span>
  );
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
  onDropdownVisibleChange?: (open: boolean) => void;
  getPopupContainer?: DropdownProps['getPopupContainer'];
  [key: string]: any; // Allow additional props
}

const TOOLBAR_ICONS_SELECTOR = '.nb-toolbar-container-icons';
const TOOLBAR_CONTAINER_SELECTOR = '.nb-toolbar-container';
const TOOLBAR_DROPDOWN_OVERLAY_CLASS = css`
  width: max-content;
  min-width: max-content;

  .ant-dropdown-menu {
    width: max-content;
    min-width: max-content;
  }
`;

const getToolbarPopupContainer = (triggerNode?: HTMLElement | null) => {
  if (!triggerNode) {
    return null;
  }

  return (
    (triggerNode.closest(TOOLBAR_ICONS_SELECTOR) as HTMLElement | null) ||
    (triggerNode.closest(TOOLBAR_CONTAINER_SELECTOR) as HTMLElement | null)
  );
};

const removeExtraMenuItemClickHandlers = (item: FlowModelExtraMenuItem): FlowModelExtraMenuItem => {
  const { onClick: _onClick, children, ...rest } = item;

  return {
    ...rest,
    children: children?.length ? children.map(removeExtraMenuItemClickHandlers) : undefined,
  };
};

export const DefaultSettingsIcon: React.FC<DefaultSettingsIconProps> = ({
  model,
  showDeleteButton = true,
  showCopyUidButton = true,
  menuLevels = 1, // 默认一级菜单
  flattenSubMenus = true,
  onDropdownVisibleChange,
  getPopupContainer,
}) => {
  const { message } = App.useApp();
  const t = useMemo(() => getT(model), [model]);
  const { token } = theme.useToken();
  const disabledIconColor = token?.colorTextTertiary || token?.colorTextDescription || token?.colorTextSecondary;
  const [visible, setVisible] = useState(false);
  // 当模型发生子模型替换/增删等变化时，强制刷新菜单数据
  const [refreshTick, setRefreshTick] = useState(0);
  const [extraMenuItems, setExtraMenuItems] = useState<FlowModelExtraMenuItem[]>([]);
  const [extraMenuItemsLoaded, setExtraMenuItemsLoaded] = useState(false);
  const [configurableFlowsAndSteps, setConfigurableFlowsAndSteps] = useState<FlowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>([]);
  const [cascadeMenuStates, setCascadeMenuStates] = useState<Record<string, CascadeMenuState>>({});
  const cascadeMenuLoadersRef = useRef(new Map<string, () => Promise<StepCascadeMenuItem[]>>());
  const cascadeMenuHandlersRef = useRef(new Map<string, () => Promise<void>>());
  const commonExtras = useMemo(
    () => extraMenuItems.filter((it) => it.group === 'common-actions').sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [extraMenuItems],
  );
  const hasCommonActions = showCopyUidButton || showDeleteButton || commonExtras.length > 0;
  const shouldDeferConfigLoading = flattenSubMenus && menuLevels > 1 && hasCommonActions;
  const shouldWaitForCommonActionProbe =
    flattenSubMenus && menuLevels > 1 && !showCopyUidButton && !showDeleteButton && !extraMenuItemsLoaded;
  const canRenderIcon = hasCommonActions || (!isLoading && configurableFlowsAndSteps.length > 0);
  const closeDropdown = useCallback(() => {
    setVisible(false);
    onDropdownVisibleChange?.(false);
  }, [onDropdownVisibleChange]);
  const resolvePopupContainer = useCallback<NonNullable<DropdownProps['getPopupContainer']>>(
    (triggerNode) => {
      // 工具栏自身容器必须优先，保证鼠标从 icon 移到菜单时仍处于同一 hover 树。
      // 弹窗场景的裁剪问题由 useFloatToolbarPortal 负责把 toolbar 挂到正确的 popup host。
      return (
        getToolbarPopupContainer(triggerNode) ||
        getPopupContainer?.(triggerNode) ||
        triggerNode?.parentElement ||
        document.body
      );
    },
    [getPopupContainer],
  );
  const handleOpenChange: DropdownProps['onOpenChange'] = useCallback(
    (nextOpen: boolean, info) => {
      if (info.source === 'trigger' || nextOpen) {
        // 当鼠标快速滑过时，终止菜单的渲染，防止卡顿
        startTransition(() => {
          setVisible(nextOpen);
        });
        onDropdownVisibleChange?.(nextOpen);
      }
    },
    [onDropdownVisibleChange],
  );
  useEffect(() => {
    return () => {
      onDropdownVisibleChange?.(false);
    };
  }, [onDropdownVisibleChange]);
  const dropdownMaxHeight = useNiceDropdownMaxHeight([visible]);
  useEffect(() => {
    if (!visible) {
      setCascadeMenuStates({});
      setMenuOpenKeys([]);
    }
  }, [visible]);
  useEffect(() => {
    let mounted = true;
    const loadExtras = async () => {
      setExtraMenuItemsLoaded(false);
      try {
        const allExtras: FlowModelExtraMenuItem[] = [];
        const modelsToProcess: Array<{ model: FlowModel; modelKey?: string }> = [];
        walkSubModels(model, { maxDepth: menuLevels, arrayLimit: 50, mode: 'stack' }, (targetModel, { modelKey }) => {
          modelsToProcess.push({ model: targetModel, modelKey });
        });

        for (const { model: targetModel, modelKey } of modelsToProcess) {
          const Cls = targetModel.constructor as typeof FlowModel;
          const extras = await Cls.getExtraMenuItems?.(targetModel, t);
          if (extras?.length) {
            allExtras.push(
              ...extras.map((item) => ({
                ...item,
                key: modelKey ? `${modelKey}:${item.key}` : item.key,
              })),
            );
          }
        }

        if (!mounted) {
          return;
        }
        const seen = new Set<string>();
        const dedupedExtras = allExtras.filter((item) => {
          if (seen.has(`${item.key}`)) {
            return false;
          }
          seen.add(`${item.key}`);
          return true;
        });
        setExtraMenuItems(dedupedExtras);
      } catch (error) {
        console.error('Failed to load extra menu items:', error);
        if (mounted) {
          setExtraMenuItems([]);
        }
      } finally {
        if (mounted) {
          setExtraMenuItemsLoaded(true);
        }
      }
    };
    loadExtras();
    return () => {
      mounted = false;
    };
  }, [model, menuLevels, t, refreshTick]);

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
    closeDropdown();
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
  }, [closeDropdown, model, t]);

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
        closeDropdown();
        targetModel.openFlowSettings({
          flowKey,
          stepKey,
        });
      } catch (error) {
        console.log(t('Configuration popup cancelled or error'), ':', error);
      }
    },
    [closeDropdown, model, t],
  );

  const isStepMenuItemDisabled = useCallback(
    (key: string) => {
      const cleanKey = key.includes('-') && /^(.+)-\d+$/.test(key) ? key.replace(/-\d+$/, '') : key;
      const keys = cleanKey.split(':');
      let modelKey: string | undefined;
      let flowKey: string | undefined;
      let stepKey: string | undefined;

      if (keys.length === 3) {
        [modelKey, flowKey, stepKey] = keys;
      } else if (keys.length === 2) {
        [flowKey, stepKey] = keys;
      } else {
        return false;
      }

      return configurableFlowsAndSteps.some(({ flow, steps, modelKey: flowModelKey }: FlowInfo) => {
        const sameModel = (flowModelKey || undefined) === modelKey;
        if (!sameModel || flow.key !== flowKey) return false;
        return steps.some((stepInfo: StepInfo) => stepInfo.stepKey === stepKey && !!stepInfo.disabled);
      });
    },
    [configurableFlowsAndSteps],
  );

  const saveStepParamsFromMenu = useCallback(
    async (input: {
      targetModel: FlowModel;
      flowKey: string;
      stepKey: string;
      step: StepDefinition;
      params: ParamObject;
      previousParams: ParamObject;
    }) => {
      const { targetModel, flowKey, stepKey, step, params, previousParams } = input;
      if (step.persistParams !== false) {
        targetModel.setStepParams(flowKey, stepKey, params);
      }
      if (typeof step.beforeParamsSave === 'function') {
        await step.beforeParamsSave(targetModel.context as FlowSettingsContext, params, previousParams);
      }
      await targetModel.saveStepParams();
      message?.success?.(t('Configuration saved'));
      if (typeof step.afterParamsSave === 'function') {
        await step.afterParamsSave(targetModel.context as FlowSettingsContext, params, previousParams);
      }
    },
    [message, t],
  );

  const loadCascadeMenu = useCallback(
    async (key: string) => {
      const loader = cascadeMenuLoadersRef.current.get(key);
      if (!loader) {
        return;
      }

      const current = cascadeMenuStates[key];
      if (current?.loaded || current?.loading) {
        return;
      }
      setCascadeMenuStates((prev) => ({
        ...prev,
        [key]: {
          loading: true,
          loaded: false,
          error: null,
          items: current?.items || [],
          search: current?.search || '',
        },
      }));

      try {
        const items = await loader();
        setCascadeMenuStates((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            loaded: true,
            error: null,
            items,
            search: prev[key]?.search || '',
          },
        }));
      } catch (error) {
        console.error('Failed to load cascade menu items:', error);
        const messageText = error instanceof Error ? error.message : t('Failed to load options');
        setCascadeMenuStates((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            loaded: true,
            error: messageText,
            items: [],
            search: prev[key]?.search || '',
          },
        }));
      }
    },
    [cascadeMenuStates, t],
  );

  const handleCascadeMenuOpenChange = useCallback(
    (openKeys: string[]) => {
      setMenuOpenKeys(openKeys);
      openKeys.forEach((key) => {
        loadCascadeMenu(key);
      });
    },
    [loadCascadeMenu],
  );

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      const originalKey = key;
      // Handle duplicate key suffixes (e.g., "key-1" -> "key")
      const cleanKey = key.includes('-') && /^(.+)-\d+$/.test(key) ? key.replace(/-\d+$/, '') : key;

      if (originalKey.startsWith(CASCADE_MENU_SEARCH_KEY) || cleanKey.startsWith(CASCADE_MENU_SEARCH_KEY)) {
        return;
      }

      const cascadeHandler =
        cascadeMenuHandlersRef.current.get(originalKey) || cascadeMenuHandlersRef.current.get(cleanKey);
      if (cascadeHandler) {
        cascadeHandler();
        return;
      }

      if (cleanKey.startsWith('copy-pop-uid:')) {
        closeDropdown();
        handleCopyPopupUid(cleanKey);
        return;
      }

      const extra =
        findExtraMenuItemByKey(extraMenuItems, originalKey) || findExtraMenuItemByKey(extraMenuItems, cleanKey);
      if (extra?.disabled) {
        return;
      }
      if (extra?.onClick) {
        closeDropdown();
        extra.onClick();
        return;
      }

      if (isStepMenuItemDisabled(cleanKey)) {
        return;
      }

      switch (cleanKey) {
        case 'copy-uid':
          closeDropdown();
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
    [
      closeDropdown,
      handleCopyUid,
      handleDelete,
      handleStepConfiguration,
      handleCopyPopupUid,
      extraMenuItems,
      isStepMenuItemDisabled,
    ],
  );

  // 获取单个模型的可配置flows和steps
  const getModelConfigurableFlowsAndSteps = useCallback(
    async (targetModel: FlowModel, modelKey?: string): Promise<FlowInfo[]> => {
      try {
        // 仅使用静态流（类级全局注册的 flows）
        const flowsMap = new Map((targetModel.constructor as typeof FlowModel).globalFlowRegistry.getFlows());

        const flows = flowsMap;

        const flowsArray = Array.from(flows.entries());

        const flowsWithSteps = await Promise.all(
          flowsArray.map(async ([flowKey, flow]) => {
            const flowSteps = await getFlowSettingSteps(targetModel, flow as any, flowKey);
            const flowForSettings = createFlowWithSettingSteps(flow as any, flowSteps, flowKey);
            const configurableSteps = await Promise.all(
              Object.entries(flowSteps).map(async ([stepKey, stepDefinition]) => {
                const actionStep = stepDefinition;
                let step = actionStep;
                // 支持静态与动态 hideInSettings
                if (await shouldHideStepInSettings(targetModel, flowForSettings, actionStep)) {
                  return null;
                }
                const disabledState = await resolveStepDisabledInSettings(
                  targetModel,
                  flowForSettings,
                  actionStep as any,
                );
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
                const inlineMenuMode = ['select', 'switch', 'cascadeMenu'].includes(uiMode?.type || uiMode);

                // 如果都没有uiSchema（静态或动态），返回null
                if (!inlineMenuMode && !hasStepUiSchema && !hasActionUiSchema) {
                  return null;
                }

                // 对于动态uiSchema，需要实际解析以确定是否有内容
                let mergedUiSchema = {};

                try {
                  // 使用提取的工具函数解析并合并uiSchema
                  const resolvedSchema = await resolveStepUiSchema(targetModel, flowForSettings, actionStep);

                  // 如果解析后没有可配置的UI Schema，跳过此步骤
                  if (!resolvedSchema && !inlineMenuMode) {
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
                  disabled: disabledState.disabled,
                  disabledReason: disabledState.reason,
                };
              }),
            ).then((steps) => steps.filter(Boolean));

            return configurableSteps.length > 0
              ? ({ flow: flowForSettings, steps: configurableSteps, modelKey } as FlowInfo)
              : null;
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
    [t],
  );

  // 获取可配置的flows和steps
  const getConfigurableFlowsAndSteps = useCallback(async (): Promise<FlowInfo[]> => {
    const result: FlowInfo[] = [];
    const modelsToProcess: Array<{ model: FlowModel; modelKey?: string }> = [];
    walkSubModels(model, { maxDepth: menuLevels, arrayLimit: 50, mode: 'stack' }, (targetModel, { modelKey }) => {
      modelsToProcess.push({ model: targetModel, modelKey });
    });

    for (const { model: targetModel, modelKey } of modelsToProcess) {
      const modelFlows = await getModelConfigurableFlowsAndSteps(targetModel, modelKey);
      result.push(...modelFlows);
    }
    return result;
  }, [model, menuLevels, getModelConfigurableFlowsAndSteps]);

  useEffect(() => {
    const triggerRebuild = () => {
      setRefreshTick((v) => v + 1);
    };

    const cleanups: Array<() => void> = [];

    walkSubModels(model, { maxDepth: menuLevels, mode: 'visited' }, (targetModel, { depth }) => {
      const eventNames = ['onStepParamsChanged'];
      if (depth === 1) {
        eventNames.push('onSubModelAdded', 'onSubModelRemoved', 'onSubModelReplaced');
      }

      eventNames.forEach((eventName) => {
        targetModel.emitter?.on(eventName, triggerRebuild);
        cleanups.push(() => targetModel.emitter?.off(eventName, triggerRebuild));
      });
    });

    return () => {
      cleanups.forEach((dispose) => dispose());
    };
  }, [model, menuLevels, refreshTick]);

  useEffect(() => {
    let mounted = true;
    const loadConfigurableFlowsAndSteps = async () => {
      setIsLoading(true);
      if (shouldDeferConfigLoading) {
        setConfigurableFlowsAndSteps([]);
      }
      try {
        const flows = await getConfigurableFlowsAndSteps();
        if (mounted) {
          setConfigurableFlowsAndSteps(flows);
        }
      } catch (error) {
        console.error('Failed to load configurable flows and steps:', error);
        if (mounted) {
          setConfigurableFlowsAndSteps([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (shouldWaitForCommonActionProbe) {
      setConfigurableFlowsAndSteps([]);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (!visible && shouldDeferConfigLoading) {
      setConfigurableFlowsAndSteps([]);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    loadConfigurableFlowsAndSteps();
    return () => {
      mounted = false;
    };
  }, [getConfigurableFlowsAndSteps, refreshTick, shouldDeferConfigLoading, shouldWaitForCommonActionProbe, visible]);

  // 构建菜单项，包含错误处理和记忆化
  const menuItems = useMemo((): NonNullable<MenuProps['items']> => {
    cascadeMenuLoadersRef.current.clear();
    cascadeMenuHandlersRef.current.clear();
    const items: NonNullable<MenuProps['items']> = [];
    const keyCounter = new Map<string, number>(); // 跟踪重复的key

    // 生成唯一key的辅助函数
    const generateUniqueKey = (baseKey: string): string => {
      const count = keyCounter.get(baseKey) || 0;
      keyCounter.set(baseKey, count + 1);
      return count === 0 ? baseKey : `${baseKey}-${count}`;
    };

    const createCascadeSearchItem = (
      baseKey: string,
      state: CascadeMenuState,
      placeholder: string,
    ): NonNullable<MenuProps['items']>[number] => ({
      key: getSearchMenuItemKey(baseKey),
      label: (
        <Input
          allowClear
          size="small"
          prefix={<SearchOutlined />}
          placeholder={placeholder}
          value={state.search}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const nextSearch = event.target.value;
            setCascadeMenuStates((prev) => ({
              ...prev,
              [baseKey]: {
                ...(prev[baseKey] || {
                  loading: false,
                  loaded: false,
                  error: null,
                  items: [],
                  search: '',
                }),
                search: nextSearch,
              },
            }));
          }}
        />
      ),
    });

    const buildCascadeChildren = (input: {
      baseKey: string;
      state: CascadeMenuState | undefined;
      searchPlaceholder: string;
      loadingLabel: string;
      emptyLabel: string;
      errorLabel: string;
      targetModel: FlowModel;
      flowKey: string;
      stepKey: string;
      step: StepDefinition;
      stepParams: ParamObject;
      getDefaultParams: () => Promise<ParamObject>;
      showSearch: boolean;
    }): NonNullable<MenuProps['items']> => {
      const {
        baseKey,
        state = { loading: false, loaded: false, error: null, items: [], search: '' },
        searchPlaceholder,
        loadingLabel,
        emptyLabel,
        errorLabel,
        targetModel,
        flowKey,
        stepKey,
        step,
        stepParams,
        getDefaultParams,
        showSearch,
      } = input;
      const children: NonNullable<MenuProps['items']> = [];

      if (showSearch) {
        children.push(createCascadeSearchItem(baseKey, state, searchPlaceholder));
      }

      if (state.loading || !state.loaded) {
        children.push({
          key: `${baseKey}:loading`,
          label: state.error ? errorLabel : loadingLabel,
          disabled: true,
        });
        return children;
      }

      if (state.error) {
        children.push({
          key: `${baseKey}:error`,
          label: state.error || errorLabel,
          disabled: true,
        });
        return children;
      }

      const convertItems = (sourceItems: StepCascadeMenuItem[], path: string[] = []): NonNullable<MenuProps['items']> =>
        sourceItems.map((item) => {
          const itemPath = [...path, item.key];
          const menuKey = getCascadeMenuItemKey(baseKey, itemPath);
          if (typeof item.onSelect === 'function') {
            cascadeMenuHandlersRef.current.set(menuKey, async () => {
              try {
                const defaultParams = await getDefaultParams();
                const currentParams = { ...defaultParams, ...stepParams };
                const nextParams = await item.onSelect?.({
                  model: targetModel,
                  flowKey,
                  stepKey,
                  params: currentParams,
                  defaultParams,
                  t,
                });
                if (nextParams) {
                  await saveStepParamsFromMenu({
                    targetModel,
                    flowKey,
                    stepKey,
                    step,
                    params: nextParams,
                    previousParams: stepParams,
                  });
                }
                closeDropdown();
              } catch (error) {
                console.error('Failed to save cascade menu selection:', error);
              }
            });
          }

          return {
            key: menuKey,
            label: <CascadeLeafLabel item={item} />,
            disabled: item.disabled,
            children: item.children?.length ? convertItems(item.children, itemPath) : undefined,
          };
        });

      const filteredItems = filterCascadeMenuItems(state.items, state.search);
      if (!filteredItems.length) {
        children.push({
          key: `${baseKey}:empty`,
          label: emptyLabel,
          disabled: true,
        });
        return children;
      }

      children.push(...convertItems(filteredItems));
      return children;
    };

    const createCascadeMenuStepItem = (input: {
      menuKey: string;
      targetModel: FlowModel;
      flowKey: string;
      stepInfo: StepInfo;
      stepParams: ParamObject;
      showDisabledReason: boolean;
    }): NonNullable<MenuProps['items']>[number] | null => {
      const { menuKey, targetModel, flowKey, stepInfo, stepParams, showDisabledReason } = input;
      if (!isCascadeMenuUIMode(stepInfo.uiMode)) {
        return null;
      }

      const modeProps = stepInfo.uiMode.props || {};
      const getDefaultParams = async (): Promise<ParamObject> => {
        let defaultParams = await resolveDefaultParams(stepInfo.step.defaultParams, targetModel.context);
        if (stepInfo.step.use) {
          const action = targetModel.getAction?.(stepInfo.step.use);
          defaultParams = await resolveDefaultParams(action.defaultParams, targetModel.context);
        }
        return toParamObject(defaultParams);
      };

      cascadeMenuLoadersRef.current.set(menuKey, async () => {
        if (!modeProps.loadItems) {
          return [];
        }
        const defaultParams = await getDefaultParams();
        return (
          (await modeProps.loadItems({
            model: targetModel,
            flowKey,
            stepKey: stepInfo.stepKey,
            params: { ...defaultParams, ...stepParams },
            defaultParams,
            t,
          })) || []
        );
      });

      const displayLabel = modeProps.getDisplayLabel?.({
        model: targetModel,
        flowKey,
        stepKey: stepInfo.stepKey,
        params: stepParams,
        t,
      });
      const label = <CascadeMenuLabel title={stepInfo.title} displayLabel={displayLabel} />;

      return {
        key: menuKey,
        label:
          stepInfo.disabled && showDisabledReason ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {label}
              <Tooltip title={stepInfo.disabledReason} placement="right" destroyTooltipOnHide>
                <QuestionCircleOutlined style={{ color: disabledIconColor }} />
              </Tooltip>
            </span>
          ) : (
            label
          ),
        disabled: !!stepInfo.disabled,
        children: stepInfo.disabled
          ? undefined
          : buildCascadeChildren({
              baseKey: menuKey,
              state: cascadeMenuStates[menuKey],
              searchPlaceholder: t(modeProps.searchPlaceholder || 'Search'),
              loadingLabel: t(modeProps.loadingLabel || 'Loading'),
              emptyLabel: t(modeProps.emptyLabel || 'No options'),
              errorLabel: t(modeProps.errorLabel || 'Failed to load options'),
              targetModel,
              flowKey,
              stepKey: stepInfo.stepKey,
              step: stepInfo.step,
              stepParams,
              getDefaultParams,
              showSearch: modeProps.showSearch !== false,
            }),
      };
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
            const subModel = stepInfo.modelKey ? findSubModelByKey(model, stepInfo.modelKey) : null;
            const targetModel = subModel || model;
            const stepParams = toParamObject(targetModel.getStepParams(flow.key, stepInfo.stepKey));
            const getDefaultParams = async () => {
              let defaultParams = await resolveDefaultParams(stepInfo.step.defaultParams, targetModel.context);
              if (stepInfo.step.use) {
                const action = targetModel.getAction?.(stepInfo.step.use);
                defaultParams = await resolveDefaultParams(action.defaultParams, targetModel.context);
              }
              return defaultParams || {};
            };
            const getMergedParams = async () => ({ ...(await getDefaultParams()), ...stepParams });
            const uiModeConfig = typeof uiMode === 'object' ? uiMode : undefined;
            const itemProps = {
              getDefaultValue: getMergedParams,
              onChange: async (val) => {
                await saveStepParamsFromMenu({
                  targetModel,
                  flowKey: flow.key,
                  stepKey: stepInfo.stepKey,
                  step: stepInfo.step,
                  params: val,
                  previousParams: stepParams,
                });
              },
              ...(uiModeConfig?.props || {}),
              itemKey: uiModeConfig?.key,
              disabled: !!stepInfo.disabled,
              disabledReason: stepInfo.disabledReason,
              disabledIconColor,
            };
            const cascadeMenuItem = createCascadeMenuStepItem({
              menuKey: uniqueKey,
              targetModel,
              flowKey: flow.key,
              stepInfo,
              stepParams,
              showDisabledReason: false,
            });
            if (cascadeMenuItem) {
              items.push(cascadeMenuItem);
              return;
            }
            items.push({
              key: uniqueKey,
              label: <MenuLabelItem title={stepInfo.title} uiMode={uiMode} itemProps={itemProps} />,
              disabled: !!stepInfo.disabled,
            });
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
                const stepParams = toParamObject(model.getStepParams(flow.key, stepInfo.stepKey));
                const cascadeMenuItem = createCascadeMenuStepItem({
                  menuKey: uniqueKey,
                  targetModel: model,
                  flowKey: flow.key,
                  stepInfo,
                  stepParams,
                  showDisabledReason: true,
                });
                if (cascadeMenuItem) {
                  items.push(cascadeMenuItem);
                  return;
                }

                items.push({
                  key: uniqueKey,
                  label: stepInfo.disabled ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {stepInfo.title}
                      <Tooltip title={stepInfo.disabledReason} placement="right" destroyTooltipOnHide>
                        <QuestionCircleOutlined style={{ color: disabledIconColor }} />
                      </Tooltip>
                    </span>
                  ) : (
                    stepInfo.title
                  ),
                  disabled: !!stepInfo.disabled,
                });
              });
            });
          } else {
            // 为子模型创建子菜单
            const subMenuKey = generateUniqueKey(`sub-menu-${modelKey}`);
            const subMenuChildren: NonNullable<MenuProps['items']> = [];

            flows.forEach(({ flow, steps }: FlowInfo) => {
              steps.forEach((stepInfo: StepInfo) => {
                const uniqueKey = generateUniqueKey(`${modelKey}:${flow.key}:${stepInfo.stepKey}`);
                const subModel = findSubModelByKey(model, modelKey);
                const targetModel = subModel || model;
                const stepParams = toParamObject(targetModel.getStepParams(flow.key, stepInfo.stepKey));
                const cascadeMenuItem = createCascadeMenuStepItem({
                  menuKey: uniqueKey,
                  targetModel,
                  flowKey: flow.key,
                  stepInfo,
                  stepParams,
                  showDisabledReason: true,
                });
                if (cascadeMenuItem) {
                  subMenuChildren.push(cascadeMenuItem);
                  return;
                }

                subMenuChildren.push({
                  key: uniqueKey,
                  label: stepInfo.disabled ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {stepInfo.title}
                      <Tooltip title={stepInfo.disabledReason} placement="right" destroyTooltipOnHide>
                        <QuestionCircleOutlined style={{ color: disabledIconColor }} />
                      </Tooltip>
                    </span>
                  ) : (
                    stepInfo.title
                  ),
                  disabled: !!stepInfo.disabled,
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
  }, [
    cascadeMenuStates,
    closeDropdown,
    configurableFlowsAndSteps,
    disabledIconColor,
    flattenSubMenus,
    model,
    saveStepParamsFromMenu,
    t,
  ]);

  // 向菜单项添加额外按钮
  const finalMenuItems = useMemo((): NonNullable<MenuProps['items']> => {
    const items = [...menuItems];

    if (showCopyUidButton || showDeleteButton || commonExtras.length > 0) {
      items.push({
        type: 'divider',
      });
      // 使用分组呈现常用操作（不再使用分割线）

      // items.push({
      //   key: 'common-actions',
      //   label: t('Common actions'),
      //   type: 'group' as const,
      // });

      if (commonExtras.length > 0) {
        // Antd Menu 会同时触发 item.onClick 和 menu.onClick，这里统一交给 handleMenuClick 执行。
        items.push(...(commonExtras.map(removeExtraMenuItemClickHandlers) as MenuProps['items']));
      }

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
  }, [menuItems, showCopyUidButton, showDeleteButton, commonExtras, model.uid, model.destroy, t]);

  if (!canRenderIcon) {
    return null;
  }

  // 渲染前验证模型
  if (!model || !model.uid) {
    console.warn(t('Invalid model provided'));
    return null;
  }

  return (
    <Dropdown
      getPopupContainer={resolvePopupContainer}
      overlayClassName={TOOLBAR_DROPDOWN_OVERLAY_CLASS}
      overlayStyle={{ width: 'max-content', minWidth: 'max-content' }}
      onOpenChange={handleOpenChange}
      open={visible}
      destroyPopupOnHide
      menu={{
        items: finalMenuItems,
        onClick: handleMenuClick,
        openKeys: menuOpenKeys,
        onOpenChange: handleCascadeMenuOpenChange,
        triggerSubMenuAction: 'click',
        style: { maxHeight: dropdownMaxHeight, overflowY: 'auto' },
      }}
      trigger={['hover', 'click']}
      placement="bottomRight"
    >
      <MenuOutlined role="button" aria-label="flows-settings" style={{ cursor: 'pointer', fontSize: 12 }} />
    </Dropdown>
  );
};

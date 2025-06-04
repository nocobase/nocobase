/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Modal, Space, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { SettingOutlined, DeleteOutlined, ExclamationCircleOutlined, MenuOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { css } from '@emotion/css';
import { FlowModel } from '../../../../models';
import { ActionStepDefinition } from '../../../../types';
import { useFlowModel } from '../../../../hooks';
import { openStepSettingsDialog } from './StepSettingsDialog';

// 检测DOM中直接子元素是否包含button元素的辅助函数
const detectButtonInDOM = (container: HTMLElement): boolean => {
  if (!container) return false;

  // 只检测直接子元素中的button
  const directChildren = container.children;
  for (let i = 0; i < directChildren.length; i++) {
    const child = directChildren[i];
    // 检查是否是button元素或具有button特征的元素
    if (child.tagName === 'BUTTON' || child.getAttribute('role') === 'button' || child.classList.contains('ant-btn')) {
      return true;
    }
  }

  return false;
};

// 使用与 NocoBase 一致的悬浮工具栏样式
const floatContainerStyles = css`
  position: relative;
  display: inline;

  /* 当检测到button时使用inline-block */
  &.has-button-child {
    display: inline-block;
  }

  /* 正常的hover行为 */
  &:hover > .general-schema-designer {
    display: block;
  }

  /* 当有.hide-parent-menu类时隐藏菜单 */
  &.hide-parent-menu > .general-schema-designer {
    display: none !important;
  }

  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--colorBgSettingsHover);
    border: 2px solid var(--colorBorderSettingsHover);
    pointer-events: none;

    &.nb-in-template {
      background: var(--colorTemplateBgSettingsHover);
    }

    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;

      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        height: 16px;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
`;

// 悬浮右键菜单组件接口
interface ModelProvidedProps {
  model: any;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  containerStyle?: React.CSSProperties;
  className?: string;
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  containerStyle?: React.CSSProperties;
  className?: string;
}

type FlowsFloatContextMenuProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowsFloatContextMenuProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowsFloatContextMenu组件 - 悬浮配置图标组件
 *
 * 功能特性：
 * - 鼠标悬浮显示右上角配置图标
 * - 点击图标显示配置菜单
 * - 支持删除功能
 * - Wrapper 模式支持
 * - 使用与 NocoBase x-settings 一致的样式
 * - 按flow分组显示steps
 *
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowsFloatContextMenu model={myModel}>{children}</FlowsFloatContextMenu>
 * 2. 通过uid和modelClassName获取model: <FlowsFloatContextMenu uid="model1" modelClassName="MyModel">{children}</FlowsFloatContextMenu>
 *
 * @param props.children 子组件，必须提供
 * @param props.enabled 是否启用悬浮菜单，默认为true
 * @param props.showDeleteButton 是否显示删除按钮，默认为true
 * @param props.containerStyle 容器自定义样式
 * @param props.className 容器自定义类名
 */
const FlowsFloatContextMenu: React.FC<FlowsFloatContextMenuProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowsFloatContextMenuWithModelById {...props} />;
  } else {
    return <FlowsFloatContextMenuWithModel {...props} />;
  }
};

// 使用传入的model
const FlowsFloatContextMenuWithModel: React.FC<ModelProvidedProps> = observer(
  ({ model, children, enabled = true, showDeleteButton = true, containerStyle, className }) => {
    const [hideMenu, setHideMenu] = useState<boolean>(false);
    const [hasButton, setHasButton] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 检测DOM中是否包含button元素
    useEffect(() => {
      if (containerRef.current) {
        const hasButtonElement = detectButtonInDOM(containerRef.current);
        setHasButton(hasButtonElement);
      }
    }, [children]); // 当children变化时重新检测

    // 使用MutationObserver监听DOM变化
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new MutationObserver(() => {
        if (containerRef.current) {
          const hasButtonElement = detectButtonInDOM(containerRef.current);
          setHasButton(hasButtonElement);
        }
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'role'],
      });

      return () => {
        observer.disconnect();
      };
    }, []);

    const handleChildHover = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const childWithMenu = target.closest('[data-has-float-menu]');

      // 如果悬浮的是子元素（且不是当前容器），则隐藏当前菜单
      if (childWithMenu && childWithMenu !== containerRef.current) {
        setHideMenu(true);
      } else {
        setHideMenu(false);
      }
    }, []);

    const handleMenuClick = useCallback(
      ({ key }: { key: string }) => {
        if (key === 'delete') {
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
                const actionStep = stepDefinition as ActionStepDefinition;

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
        console.warn('[FlowsFloatContextMenu] 获取可配置flows失败:', error);
        return [];
      }
    }, [model]);

    const configurableFlowsAndSteps = getConfigurableFlowsAndSteps();

    // 如果没有可配置的flows且不显示删除按钮，直接返回children
    if (configurableFlowsAndSteps.length === 0 && !showDeleteButton) {
      return <>{children}</>;
    }

    // 构建菜单项 - 使用与 FlowsContextMenu 相同的逻辑
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
        <div
          ref={containerRef}
          className={`${floatContainerStyles} ${hideMenu ? 'hide-parent-menu' : ''} ${
            hasButton ? 'has-button-child' : ''
          } ${className || ''}`}
          style={containerStyle}
          data-has-float-menu="true"
          onMouseMove={handleChildHover}
        >
          {children}

          {/* 悬浮工具栏 - 使用与 NocoBase 一致的结构 */}
          <div className="general-schema-designer">
            <div className="general-schema-designer-icons">
              <Space size={3} align="center">
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
              </Space>
            </div>
          </div>
        </div>
      </>
    );
  },
);

// 通过useModelById hook获取model
const FlowsFloatContextMenuWithModelById: React.FC<ModelByIdProps> = observer(
  ({ uid, modelClassName, children, enabled = true, showDeleteButton = true, containerStyle, className }) => {
    const model = useFlowModel(uid, modelClassName);

    if (!model) {
      return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
    }

    return (
      <FlowsFloatContextMenuWithModel
        model={model}
        enabled={enabled}
        showDeleteButton={showDeleteButton}
        containerStyle={containerStyle}
        className={className}
      >
        {children}
      </FlowsFloatContextMenuWithModel>
    );
  },
);

export { FlowsFloatContextMenu };

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ApiOutlined, HighlightOutlined, SettingOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { FlowModel, observer, tExpr, useFlowEngine } from '@nocobase/flow-engine';
import { Button, Dropdown, theme, Tooltip, type ButtonProps, type MenuProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useACLRoleContext } from '../../../acl';
import type { PluginSettingsPageType } from '../../../PluginSettingsManager';
import { useApp } from '../../../hooks/useApp';
import {
  filterRenderableSettings,
  filterVisibleSettings,
  getMenuItems,
  PLUGIN_MANAGER_SETTING_NAME,
  sortTopLevelSettings,
} from '../../../settings-center/utils';
import type { CustomToken } from '../../../theme';
import { writeFlowSettingsPreference } from '../../admin-shell/admin-layout/flowSettingsPreference';

const topbarActionButtonClassName = css`
  &.ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    padding: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: none;
    color: var(--nb-topbar-action-color);
    vertical-align: middle;
  }

  &.ant-btn .anticon,
  &.ant-btn .ant-badge,
  &.ant-btn .ant-badge .anticon {
    color: var(--nb-topbar-action-color);
  }

  &.ant-btn:hover,
  &.ant-btn:focus,
  &.ant-btn:active {
    background: var(--nb-topbar-action-hover-bg) !important;
    color: var(--nb-topbar-action-color);
  }
`;

const topbarActionTriggerClassName = css`
  display: inline-flex;
  align-items: center;
  height: 100%;
`;

type TopbarSettingsAppLike = {
  router?: {
    basename?: string;
    getBasename?: () => string | undefined;
  };
  getPublicPath?: () => string;
};

const normalizeTopbarPath = (pathname?: string) => {
  const trimmed = pathname?.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return `/${trimmed.replace(/^\/+/, '')}`;
};

const normalizeTopbarBasePath = (pathname?: string) => {
  const normalized = normalizeTopbarPath(pathname).replace(/\/+$/, '');
  return normalized === '' || normalized === '/' ? '' : normalized;
};

const getTopbarRouterBasePath = (app: TopbarSettingsAppLike | undefined) => {
  return app?.router?.getBasename?.() || app?.router?.basename || app?.getPublicPath?.() || '';
};

const stripTopbarRouterBasePath = (pathname: string, basename?: string) => {
  const normalizedPath = normalizeTopbarPath(pathname);
  const normalizedBase = normalizeTopbarBasePath(basename);

  if (!normalizedBase) {
    return normalizedPath;
  }

  if (normalizedPath === normalizedBase) {
    return '/';
  }

  if (normalizedPath.startsWith(`${normalizedBase}/`)) {
    return normalizeTopbarPath(normalizedPath.slice(normalizedBase.length));
  }

  return normalizedPath;
};

const isAdminRuntimePath = (pathname: string) => {
  return pathname === '/admin' || pathname.startsWith('/admin/');
};

const buildTopbarDocumentHref = (targetPath: string, basename?: string) => {
  const normalizedTarget = normalizeTopbarPath(targetPath);
  const normalizedBase = normalizeTopbarBasePath(basename);

  if (!normalizedBase || normalizedTarget === normalizedBase || normalizedTarget.startsWith(`${normalizedBase}/`)) {
    return normalizedTarget;
  }

  return `${normalizedBase}${normalizedTarget}`;
};

function TopbarExternalSettingsLabel(props: { title: React.ReactNode; link: string }) {
  return (
    <div
      onClick={() => {
        window.open(props.link, '_blank', 'noopener,noreferrer');
      }}
    >
      {props.title}
    </div>
  );
}

function TopbarInternalSettingsLabel(props: { title: React.ReactNode; path?: string }) {
  const app = useApp<TopbarSettingsAppLike>();
  const location = useLocation();
  const targetPath = props.path || '/admin/settings';
  const basename = getTopbarRouterBasePath(app);
  const currentPath = stripTopbarRouterBasePath(location.pathname, basename);

  if (isAdminRuntimePath(currentPath)) {
    return <Link to={targetPath}>{props.title}</Link>;
  }

  return (
    <a href={buildTopbarDocumentHref(targetPath, basename)} target="_blank" rel="noopener noreferrer">
      {props.title}
    </a>
  );
}

/**
 * 将 settings 顶部菜单转换成右上角 dropdown items。
 *
 * @param {PluginSettingsPageType[]} settings 当前可访问的 settings 列表
 * @param {boolean} canManagePlugins 是否允许访问插件管理
 * @param {(key: string) => string} t 国际化函数
 * @returns {NonNullable<MenuProps['items']>} dropdown items
 */
export function getTopbarPluginSettingsItems(options: {
  settings: PluginSettingsPageType[];
  canManagePlugins: boolean;
  t: (key: string) => string;
}): NonNullable<MenuProps['items']> {
  const { settings, canManagePlugins, t } = options;
  const topLevelSettings = filterVisibleSettings(filterRenderableSettings(settings));
  const pluginManagerSetting = topLevelSettings.find((item) => item.name === PLUGIN_MANAGER_SETTING_NAME);
  const settingsByKey = new Map<string, PluginSettingsPageType>();
  const normalSettings = sortTopLevelSettings(
    topLevelSettings
      .filter((item) => item.name !== PLUGIN_MANAGER_SETTING_NAME)
      .map((item) => ({
        ...item,
        children: undefined,
      })),
  );

  normalSettings.forEach((item) => {
    settingsByKey.set(item.key, item);
  });

  const orderedSettings = (getMenuItems(normalSettings) || []).map((item: any) => {
    if (item?.type === 'divider') {
      return item;
    }

    const matchedSetting = settingsByKey.get(String(item.key));
    const targetPath = matchedSetting?.path;
    const targetLink = matchedSetting?.link;
    const targetTitle = matchedSetting?.title || item.title;

    return {
      key: item.key,
      name: matchedSetting?.name,
      path: matchedSetting?.path,
      link: targetLink,
      title: targetTitle,
      icon: item.icon,
      label: targetLink ? (
        <TopbarExternalSettingsLabel title={targetTitle} link={targetLink} />
      ) : (
        <TopbarInternalSettingsLabel title={targetTitle} path={targetPath} />
      ),
    };
  });

  const items: NonNullable<MenuProps['items']> = [];

  if (canManagePlugins && pluginManagerSetting) {
    items.push({
      key: pluginManagerSetting.key,
      icon: pluginManagerSetting.icon || <ApiOutlined />,
      label: (
        <TopbarInternalSettingsLabel
          title={pluginManagerSetting.title || t('Plugin manager')}
          path={pluginManagerSetting.path}
        />
      ),
    });
  }

  if (canManagePlugins && orderedSettings.length) {
    items.push({ type: 'divider' });
  }

  items.push(...orderedSettings);

  return items;
}

/**
 * 右上角动作基类。
 *
 * 该基类只负责单个按钮的稳定协议，
 * 统一的列表聚合、分隔线和 Help 由 TopbarActionsBar 负责。
 */
export class TopbarActionModel extends FlowModel {
  declare props: ButtonProps;
  declare icon: React.ReactNode;
  declare tooltip: string;
  declare aclSnippet?: string;
  declare actionId?: string;
  declare testId?: string;

  sort = 0;

  /**
   * 获取稳定动作标识。
   *
   * @returns {string} 动作标识
   */
  getActionId() {
    return this.actionId || this.uid || this.constructor.name;
  }

  /**
   * 获取稳定测试标识。
   *
   * @returns {string} data-testid
   */
  getTestId() {
    return this.testId || `topbar-action-${this.getActionId()}`;
  }

  /**
   * 判断当前动作是否被显式隐藏。
   *
   * @returns {boolean} 是否隐藏
   */
  isHidden() {
    return !!this.hidden;
  }

  /**
   * 计算按钮视觉样式。
   *
   * @param {CustomToken} _token 当前主题 token
   * @returns {React.CSSProperties | undefined} 按钮样式
   */
  getButtonStyle(_token: CustomToken): React.CSSProperties | undefined {
    return undefined;
  }

  /**
   * 点击动作默认实现。
   *
   * @param {React.MouseEvent<HTMLElement>} _event 点击事件
   * @returns {void}
   */
  onClick(_event?: React.MouseEvent<HTMLElement>) {}

  /**
   * 渲染按钮外壳。
   *
   * @returns {React.ReactNode} 按钮节点
   */
  renderButton() {
    return <TopbarActionButton model={this} />;
  }

  /**
   * 包装按钮节点，例如 tooltip 或 dropdown。
   *
   * @param {React.ReactNode} node 按钮节点
   * @returns {React.ReactNode} 包装后的节点
   */
  renderWrapper(node: React.ReactNode) {
    if (!this.tooltip) {
      return node;
    }

    return (
      <Tooltip title={this.context.t(this.tooltip)}>
        <span className={topbarActionTriggerClassName}>{node}</span>
      </Tooltip>
    );
  }

  /**
   * 渲染最终动作节点。
   *
   * @returns {React.ReactNode} 最终节点
   */
  render() {
    return this.renderWrapper(this.renderButton());
  }
}

const getTopbarActionButtonVars = (token: CustomToken) => {
  return {
    '--nb-topbar-action-color': token.colorTextHeaderMenu || 'rgba(255, 255, 255, 0.65)',
    '--nb-topbar-action-hover-bg': token.colorBgHeaderMenuHover || 'rgba(255, 255, 255, 0.1)',
  } as React.CSSProperties;
};

const TopbarActionButton = observer(
  (props: { model: TopbarActionModel; style?: React.CSSProperties; className?: string }) => {
    const { model, style, className } = props;
    const { token } = theme.useToken();
    const customToken = token as CustomToken;

    return (
      <Button
        {...model.props}
        type="text"
        icon={model.icon}
        data-testid={model.getTestId()}
        onClick={model.onClick.bind(model)}
        className={cx(topbarActionButtonClassName, className, model.props?.className)}
        style={{
          ...getTopbarActionButtonVars(customToken),
          ...model.getButtonStyle(customToken),
          ...model.props?.style,
          ...style,
        }}
      />
    );
  },
  { displayName: 'TopbarActionButton' },
);

const UIEditorTopbarAction = observer(
  (props: { model: UIEditorTopbarActionModel }) => {
    const { model } = props;
    const flowEngine = useFlowEngine();
    const { token } = theme.useToken();
    const customToken = token as CustomToken;
    const designable = !!flowEngine.context.flowSettingsEnabled;
    const isMobileLayout = !!model.context.isMobileLayout;

    useHotkeys(
      'ctrl+shift+u',
      () => {
        if (isMobileLayout) {
          return;
        }

        if (designable) {
          flowEngine.flowSettings.disable();
          return;
        }

        flowEngine.flowSettings.enable();
      },
      [designable, flowEngine, isMobileLayout],
    );

    if (isMobileLayout) {
      return null;
    }

    return model.renderWrapper(
      <TopbarActionButton
        model={model}
        style={
          designable
            ? ({
                backgroundColor: customToken.colorSettings,
                '--nb-topbar-action-hover-bg': customToken.colorSettings,
              } as any)
            : undefined
        }
      />,
    );
  },
  { displayName: 'UIEditorTopbarAction' },
);

const PluginSettingsTopbarAction = observer(
  (props: { model: PluginSettingsTopbarActionModel }) => {
    const { model } = props;
    const app = useApp();
    const { snippets = [] } = useACLRoleContext();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const items = useMemo(() => {
      return getTopbarPluginSettingsItems({
        settings: app.pluginSettingsManager.getList(true) as PluginSettingsPageType[],
        canManagePlugins: snippets.includes('pm'),
        t,
      });
    }, [app, snippets, t]);

    useEffect(() => {
      return () => {
        app.pluginSettingsManager.clearCache();
      };
    }, [app]);

    if (!items.length) {
      return null;
    }

    return (
      <Dropdown
        open={open}
        trigger={['hover']}
        placement="bottomRight"
        mouseEnterDelay={0}
        mouseLeaveDelay={0.1}
        onOpenChange={setOpen}
        menu={{
          style: {
            maxHeight: '70vh',
            overflow: 'auto',
          },
          items,
        }}
      >
        <span className={topbarActionTriggerClassName} onMouseEnter={() => setOpen(true)}>
          <TopbarActionButton model={model} />
        </span>
      </Dropdown>
    );
  },
  { displayName: 'PluginSettingsTopbarAction' },
);

export class UIEditorTopbarActionModel extends TopbarActionModel {
  sort = 0;
  actionId = 'ui-editor';
  testId = 'ui-editor-button';
  aclSnippet = 'ui.*';
  icon = (<HighlightOutlined />);
  tooltip = tExpr('UI Editor');

  /**
   * 切换 UI 编辑器开关。
   *
   * @returns {Promise<void>} 异步切换结果
   */
  async onClick() {
    const flowSettings = this.context.engine.flowSettings;
    if (flowSettings.enabled) {
      writeFlowSettingsPreference(false);
      await flowSettings.disable();
      return;
    }

    writeFlowSettingsPreference(true);
    await flowSettings.enable();
  }

  render() {
    return <UIEditorTopbarAction model={this} />;
  }
}

export class PluginSettingsTopbarActionModel extends TopbarActionModel {
  sort = 100;
  actionId = 'plugin-settings';
  testId = 'plugin-settings-button';
  icon = (<SettingOutlined />);

  render() {
    return <PluginSettingsTopbarAction model={this} />;
  }
}

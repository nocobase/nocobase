/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer } from '@nocobase/flow-engine';
import { ConfigProvider, Layout, theme as antdTheme, type ThemeConfig } from 'antd';
import React, { useMemo, type FC } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpLite } from '../flow/admin-shell/admin-layout/HelpLite';
import {
  USER_CENTER_ACTION_ID,
  type UserCenterTopbarActionModel,
} from '../flow/models/topbar/UserCenterTopbarActionModel';
import { useApp } from '../hooks/useApp';
import { useCurrentUserAuthStatus } from '../nocobase-buildin-plugin/currentUserAuthStatus';
import { SettingsBrand } from './SettingsBrand';
import { SettingsGroupNav } from './SettingsGroupNav';
import { SettingsSearch } from './SettingsSearch';
import {
  buildSettingsGlobalCss,
  buildSettingsNeutralTheme,
  getSettingsHeaderColors,
  withSettingsHeaderTheme,
} from './settingsTheme';
import { useSettingsThemeConfig } from './useSettingsThemeConfig';

const rootStyle: React.CSSProperties = {
  height: '100vh',
  minWidth: 0,
  overflow: 'hidden',
};

const headerContentStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 24,
  height: '100%',
  justifyContent: 'space-between',
};

const actionsStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexShrink: 0,
  gap: 8,
  height: '100%',
};

const workspaceStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
};

const embedContainerStyle: React.CSSProperties = {
  flexShrink: 0,
  height: '100%',
  position: 'relative',
  width: 'fit-content',
};

export const SettingsShell: FC = ({ children }) => {
  const app = useApp();
  const location = useLocation();
  const { token } = antdTheme.useToken();
  // 设置中心的外观由主题编辑器里那条「简约」主题记录约束；读不到才用代码里的中性配色兜底。
  const storedThemeConfig = useSettingsThemeConfig();
  // 顶栏和补丁样式要按**设置中心自己这套主题**算色，不能直接用上面那个 `token`——
  // 这个组件在自己的 ConfigProvider 外面，`token` 是业务端主题的。用它的话，业务端一切暗黑，
  // 顶栏就跟着变黑，而内容区还是简约的白，一半黑一半白。
  const settingsToken = useMemo(
    () => (storedThemeConfig ? antdTheme.getDesignToken(storedThemeConfig) : token),
    [storedThemeConfig, token],
  );
  const settingsShellTheme = useMemo<ThemeConfig>(
    () =>
      storedThemeConfig ? withSettingsHeaderTheme(storedThemeConfig, settingsToken) : buildSettingsNeutralTheme(token),
    [settingsToken, storedThemeConfig, token],
  );
  const headerColors = useMemo(() => getSettingsHeaderColors(settingsToken), [settingsToken]);
  const settingsGlobalCss = useMemo(() => buildSettingsGlobalCss(settingsToken), [settingsToken]);
  const authStatus = useCurrentUserAuthStatus(app);
  const isAuthenticationRoute = (app.router.matchRoutes(location.pathname) || []).some((match) => {
    const routeId = match.route.id;
    return routeId === 'auth' || routeId?.startsWith('auth.') || routeId === '2fa' || routeId?.startsWith('2fa.');
  });

  if (isAuthenticationRoute) {
    return <>{children}</>;
  }

  const shouldShowHeader = authStatus === 'authenticated';
  const hasUserCenterModel = Boolean(app.flowEngine.getModelClass('UserCenterTopbarActionModel'));
  const userCenter = hasUserCenterModel
    ? app.flowEngine.getModel<UserCenterTopbarActionModel>(`topbar-action-${USER_CENTER_ACTION_ID}`) ||
      app.flowEngine.createModel<UserCenterTopbarActionModel>({
        use: 'UserCenterTopbarActionModel',
        uid: `topbar-action-${USER_CENTER_ACTION_ID}`,
      })
    : null;

  return (
    <ConfigProvider theme={settingsShellTheme}>
      <style>{settingsGlobalCss}</style>
      <Layout className="nb-settings-shell" style={rootStyle}>
        <Layout.Header
          style={
            {
              // 深色顶栏自带层次，只有浅色顶栏才需要一条分割线把它和内容区分开。
              borderBottom: headerColors.dark
                ? 'none'
                : `${settingsToken.lineWidth}px solid ${settingsToken.colorBorderSecondary}`,
              display: shouldShowHeader ? undefined : 'none',
              height: 46,
              lineHeight: '46px',
              paddingInline: settingsToken.paddingLG,
              // 顶栏子组件里有一部分直接读 CSS 变量而不是 antd token，一起覆盖掉。
              '--colorTextHeaderMenu': headerColors.text,
              '--nb-topbar-action-color': headerColors.text,
            } as React.CSSProperties
          }
        >
          <div style={headerContentStyle}>
            <SettingsBrand />
            <SettingsGroupNav />
            <div style={actionsStyle}>
              <SettingsSearch />
              <HelpLite />
              {userCenter ? <FlowModelRenderer model={userCenter} /> : null}
            </div>
          </div>
        </Layout.Header>
        <div style={workspaceStyle}>
          <Layout.Content style={contentStyle}>{children}</Layout.Content>
          <div id="nocobase-embed-container" style={embedContainerStyle} />
        </div>
      </Layout>
    </ConfigProvider>
  );
};

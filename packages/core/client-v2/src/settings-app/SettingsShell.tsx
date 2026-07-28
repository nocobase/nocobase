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
import { HelpLite } from '../flow/admin-shell/admin-layout/HelpLite';
import {
  USER_CENTER_ACTION_ID,
  type UserCenterTopbarActionModel,
} from '../flow/models/topbar/UserCenterTopbarActionModel';
import { useApp } from '../hooks/useApp';
import { SettingsBrand } from './SettingsBrand';
import { SettingsGroupNav } from './SettingsGroupNav';
import { buildSettingsNeutralTheme } from './settingsTheme';

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
  height: '100%',
};

const contentStyle: React.CSSProperties = {
  minHeight: 0,
  overflow: 'hidden',
};

const embedContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: 'fit-content',
};

export const SettingsShell: FC = ({ children }) => {
  const app = useApp();
  const { token } = antdTheme.useToken();
  const settingsShellTheme = useMemo<ThemeConfig>(() => buildSettingsNeutralTheme(token), [token]);
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
      <Layout style={rootStyle}>
        <Layout.Header
          style={
            {
              borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
              height: 46,
              lineHeight: '46px',
              paddingInline: token.paddingLG,
              // 顶栏子组件里有一部分直接读 CSS 变量而不是 antd token，一起覆盖掉。
              '--colorTextHeaderMenu': token.colorText,
              '--nb-topbar-action-color': token.colorText,
            } as React.CSSProperties
          }
        >
          <div style={headerContentStyle}>
            <SettingsBrand />
            <SettingsGroupNav />
            <div style={actionsStyle}>
              <HelpLite />
              {userCenter ? <FlowModelRenderer model={userCenter} /> : null}
            </div>
          </div>
        </Layout.Header>
        <Layout.Content style={contentStyle}>{children}</Layout.Content>
        <div id="nocobase-embed-container" style={embedContainerStyle} />
      </Layout>
    </ConfigProvider>
  );
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer } from '@nocobase/flow-engine';
import { Layout, theme as antdTheme } from 'antd';
import React, { type FC } from 'react';
import { HelpLite } from '../flow/admin-shell/admin-layout/HelpLite';
import { NocoBaseLogo } from '../flow/admin-shell/admin-layout/NocoBaseLogo';
import {
  USER_CENTER_ACTION_ID,
  type UserCenterTopbarActionModel,
} from '../flow/models/topbar/UserCenterTopbarActionModel';
import { useApp } from '../hooks/useApp';

const rootStyle: React.CSSProperties = {
  height: '100vh',
  minWidth: 0,
  overflow: 'hidden',
};

const headerContentStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  height: '100%',
  justifyContent: 'space-between',
};

const actionsStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
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
  const hasUserCenterModel = Boolean(app.flowEngine.getModelClass('UserCenterTopbarActionModel'));
  const userCenter = hasUserCenterModel
    ? app.flowEngine.getModel<UserCenterTopbarActionModel>(`topbar-action-${USER_CENTER_ACTION_ID}`) ||
      app.flowEngine.createModel<UserCenterTopbarActionModel>({
        use: 'UserCenterTopbarActionModel',
        uid: `topbar-action-${USER_CENTER_ACTION_ID}`,
      })
    : null;

  return (
    <Layout style={rootStyle}>
      <Layout.Header
        style={{
          background: token.colorPrimary,
          height: 46,
          lineHeight: '46px',
          paddingInline: token.paddingLG,
        }}
      >
        <div style={headerContentStyle}>
          <NocoBaseLogo />
          <div style={actionsStyle}>
            <HelpLite />
            {userCenter ? <FlowModelRenderer model={userCenter} /> : null}
          </div>
        </div>
      </Layout.Header>
      <Layout.Content style={contentStyle}>{children}</Layout.Content>
      <div id="nocobase-embed-container" style={embedContainerStyle} />
    </Layout>
  );
};

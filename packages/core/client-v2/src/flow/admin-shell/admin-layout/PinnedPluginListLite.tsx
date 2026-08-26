/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { SchemaOptionsContext } from '@formily/react';
import { ConfigProvider, Divider } from 'antd';
import get from 'lodash/get';
import React, { useContext } from 'react';
import { useAclSnippets } from '../../../acl';
import { useApp } from '../../../flow-compat';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { getPinnedPluginListKeys, PinnedPluginListContext } from '../../../PinnedPluginListContext';
import { HelpLite } from './HelpLite';
import { USER_CENTER_ACTION_ID, UserCenterTopbarActionModel } from '../../models/topbar/UserCenterTopbarActionModel';

const pinnedPluginListClassName = css`
  display: inline-flex;
  align-items: center;
  color: var(--colorTextHeaderMenu);

  .anticon {
    color: var(--colorTextHeaderMenu);
  }

  .ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 46px;
    width: 46px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: none;
    color: rgba(255, 255, 255, 0.65);
    vertical-align: middle;

    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .ant-badge {
      color: rgba(255, 255, 255, 0.65);
      .anticon {
        display: inline-block;
        vertical-align: middle;
        line-height: 1em;
        font-size: initial;
      }
      > sup {
        height: 10px;
        line-height: 10px;
        font-size: 8px;
      }
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }
  }

  .ant-btn-default {
    box-shadow: none;
  }
`;

const dividerTheme = {
  token: {
    colorSplit: 'rgba(255, 255, 255, 0.1)',
  },
};

/**
 * 仅保留 header actions 与 Help，去掉 UserCenter。
 */
export const PinnedPluginListLite = React.memo((props: { onClick?: () => void }) => {
  const app = useApp();
  const { allow } = useAclSnippets();
  const ctx = useContext(PinnedPluginListContext);
  const { components } = useContext(SchemaOptionsContext);
  const hasUserCenterModel = !!app.flowEngine.getModelClass('UserCenterTopbarActionModel');
  const userCenter = hasUserCenterModel
    ? app.flowEngine.getModel<UserCenterTopbarActionModel>(`topbar-action-${USER_CENTER_ACTION_ID}`) ||
      app.flowEngine.createModel<UserCenterTopbarActionModel>({
        use: 'UserCenterTopbarActionModel',
        uid: `topbar-action-${USER_CENTER_ACTION_ID}`,
      })
    : null;

  return (
    <div className={pinnedPluginListClassName}>
      <div onClick={props.onClick}>
        {getPinnedPluginListKeys(ctx.items)
          .filter((key) => allow(ctx.items[key]?.snippet))
          .map((key) => {
            const component = ctx.items[key]?.component;
            if (!component) {
              return null;
            }

            if (typeof component !== 'string') {
              const Action = component;
              return <Action key={key} />;
            }

            const Action = get(components, component);
            return Action ? <Action key={key} /> : null;
          })}
      </div>
      <ConfigProvider theme={dividerTheme}>
        <Divider type="vertical" />
      </ConfigProvider>
      <HelpLite key="help" />
      {userCenter ? <FlowModelRenderer model={userCenter} /> : null}
    </div>
  );
});

PinnedPluginListLite.displayName = 'PinnedPluginListLite';

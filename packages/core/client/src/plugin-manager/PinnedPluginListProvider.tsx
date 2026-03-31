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
import { get } from 'lodash';
import React, { useContext } from 'react';
import { useACLRoleContext } from '../acl/ACLProvider';
import { UserCenter } from '../route-switch/antd/admin-layout/UserCenterButton';
import { Help } from '../user/Help';
import { PinnedPluginListContext } from './context';

export const PinnedPluginListProvider: React.FC<{ items: any }> = (props) => {
  const { children, items } = props;
  const ctx = useContext(PinnedPluginListContext);
  return (
    <PinnedPluginListContext.Provider value={{ items: { ...ctx.items, ...items } }}>
      {children}
    </PinnedPluginListContext.Provider>
  );
};

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

export const PinnedPluginList = React.memo((props: { onClick?: () => void }) => {
  const { allowAll, snippets } = useACLRoleContext();
  const getSnippetsAllow = (aclKey) => {
    return allowAll || aclKey === '*' || snippets?.includes(aclKey);
  };
  const ctx = useContext(PinnedPluginListContext);
  const { components } = useContext(SchemaOptionsContext);

  return (
    <div className={pinnedPluginListClassName}>
      <div onClick={props.onClick}>
        {Object.keys(ctx.items)
          .sort((a, b) => ctx.items[a].order - ctx.items[b].order)
          .filter((key) => getSnippetsAllow(ctx.items[key].snippet))
          .map((key) => {
            const Action = get(components, ctx.items[key].component);
            return Action ? <Action key={key} /> : null;
          })}
      </div>
      <ConfigProvider theme={dividerTheme}>
        <Divider type="vertical" />
      </ConfigProvider>
      <Help key="help" />
      <UserCenter />
    </div>
  );
});

PinnedPluginList.displayName = 'PinnedPluginList';

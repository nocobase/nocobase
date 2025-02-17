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
import { CurrentUser } from '../user/CurrentUser';
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

  .ant-btn {
    border: 0;
    height: 46px;
    width: 46px;
    border-radius: 0;
    background: none;
    color: rgba(255, 255, 255, 0.65);
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

export const PinnedPluginList = React.memo(() => {
  const { allowAll, snippets } = useACLRoleContext();
  const getSnippetsAllow = (aclKey) => {
    return allowAll || aclKey === '*' || snippets?.includes(aclKey);
  };
  const ctx = useContext(PinnedPluginListContext);
  const { components } = useContext(SchemaOptionsContext);

  return (
    <div className={pinnedPluginListClassName}>
      {Object.keys(ctx.items)
        .sort((a, b) => ctx.items[a].order - ctx.items[b].order)
        .filter((key) => getSnippetsAllow(ctx.items[key].snippet))
        .map((key) => {
          const Action = get(components, ctx.items[key].component);
          return Action ? <Action key={key} /> : null;
        })}
      <ConfigProvider theme={dividerTheme}>
        <Divider type="vertical" />
      </ConfigProvider>
      <Help key="help" />
      <CurrentUser key="current-user" />
    </div>
  );
});

PinnedPluginList.displayName = 'PinnedPluginList';

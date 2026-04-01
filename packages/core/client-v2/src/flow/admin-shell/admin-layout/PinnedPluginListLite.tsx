/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ConfigProvider, Divider } from 'antd';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../../flow-compat';
import { HeaderActionRendererLite, type HeaderActionItemLite } from './HeaderActionRendererLite';
import { HelpLite } from './HelpLite';

const HEADER_ACTIONS_MANAGER_CHANGED = 'header-actions-manager:changed';

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
  const [, setVersion] = useState(0);

  useEffect(() => {
    const handleChange = () => {
      setVersion((current) => current + 1);
    };

    app.eventBus.addEventListener(HEADER_ACTIONS_MANAGER_CHANGED, handleChange);

    return () => {
      app.eventBus.removeEventListener(HEADER_ACTIONS_MANAGER_CHANGED, handleChange);
    };
  }, [app]);

  const items = app.headerActionsManager.getItems() as HeaderActionItemLite[];

  return (
    <div className={pinnedPluginListClassName}>
      <div onClick={props.onClick}>
        {items.map((item) => (
          <HeaderActionRendererLite key={item.name} item={item} />
        ))}
      </div>
      <ConfigProvider theme={dividerTheme}>
        <Divider type="vertical" />
      </ConfigProvider>
      <HelpLite key="help" />
    </div>
  );
});

PinnedPluginListLite.displayName = 'PinnedPluginListLite';

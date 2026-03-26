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
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useACLRoleContext } from '../acl/ACLProvider';
import { HEADER_ACTIONS_MANAGER_CHANGED, HeaderActionItem } from '../application/HeaderActionsManager';
import { type ComponentTypeAndString } from '../application/RouterManager';
import { useApp } from '../application/hooks';
import { UserCenter } from '../route-switch/antd/admin-layout/UserCenterButton';
import { Help } from '../user/Help';
import { HeaderActionRenderer } from './headerActions';

type LegacyPinnedPluginItem = {
  component: ComponentTypeAndString;
  order?: number;
  pin?: boolean;
  snippet?: string;
};

type LegacyPinnedPluginItems = Record<string, LegacyPinnedPluginItem>;

const PinnedPluginListCompatibilityContext = createContext(0);
PinnedPluginListCompatibilityContext.displayName = 'PinnedPluginListCompatibilityContext';

const normalizeLegacyPinnedPluginItems = (items: LegacyPinnedPluginItems = {}): HeaderActionItem[] => {
  return Object.entries(items)
    .filter(([, item]) => !!item?.component)
    .map(([name, item]) => ({
      name,
      order: item.order,
      pin: item.pin,
      snippet: item.snippet,
      componentLoader: () => Promise.resolve(item.component),
    }));
};

export const PinnedPluginListProvider: React.FC<{ items: LegacyPinnedPluginItems }> = (props) => {
  const app = useApp();
  const parentPriority = useContext(PinnedPluginListCompatibilityContext);
  const priority = parentPriority + 1;
  const sourceIdRef = useRef(`pinned-plugin-list:${Math.random().toString(36).slice(2)}`);
  const headerActionItems = useMemo(() => normalizeLegacyPinnedPluginItems(props.items), [props.items]);

  useEffect(() => {
    const sourceId = sourceIdRef.current;

    app.headerActionsManager.unregisterBySource(sourceId);

    if (headerActionItems.length) {
      app.headerActionsManager.register(
        headerActionItems.map((item) => ({
          ...item,
          priority,
          sourceId,
        })),
      );
    }

    return () => {
      app.headerActionsManager.unregisterBySource(sourceId);
    };
  }, [app, headerActionItems, priority]);

  return (
    <PinnedPluginListCompatibilityContext.Provider value={priority}>
      {props.children}
    </PinnedPluginListCompatibilityContext.Provider>
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
  const app = useApp();
  const { allowAll, snippets } = useACLRoleContext();
  const [, setVersion] = useState(0);

  const getSnippetsAllow = (aclKey) => {
    return allowAll || aclKey === '*' || snippets?.includes(aclKey);
  };

  useEffect(() => {
    const handleChange = () => {
      setVersion((current) => current + 1);
    };

    app.eventBus.addEventListener(HEADER_ACTIONS_MANAGER_CHANGED, handleChange);

    return () => {
      app.eventBus.removeEventListener(HEADER_ACTIONS_MANAGER_CHANGED, handleChange);
    };
  }, [app]);

  const items = app.headerActionsManager.resolveVisibleItems(getSnippetsAllow);

  return (
    <div className={pinnedPluginListClassName}>
      <div onClick={props.onClick}>
        {items.map((item) => (
          <HeaderActionRenderer key={item.name} item={item} />
        ))}
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

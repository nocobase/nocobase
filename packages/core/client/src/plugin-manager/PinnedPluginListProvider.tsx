import { css } from '@emotion/css';
import { SchemaOptionsContext } from '@formily/react';
import { get } from 'lodash';
import React, { useContext } from 'react';
import { useACLRoleContext } from '../acl/ACLProvider';
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

export const PinnedPluginList = () => {
  const { allowAll, snippets } = useACLRoleContext();
  const getSnippetsAllow = (aclKey) => {
    return allowAll || snippets?.includes(aclKey);
  };
  const ctx = useContext(PinnedPluginListContext);
  const { components } = useContext(SchemaOptionsContext);
  return (
    <div
      className={css`
        .ant-btn {
          border: 0;
          height: 46px;
          width: 46px;
          border-radius: 0;
          background: none;
          color: rgba(255, 255, 255, 0.65);
          &:hover {
            background: rgba(255, 255, 255, 0.1);
          }
        }
      `}
      style={{ display: 'inline-block' }}
    >
      {Object.values<any>(ctx.items)
        .sort((a, b) => a.order - b.order)
        .filter((v) => getSnippetsAllow(v.snippet))
        .map((item) => {
          const Action = get(components, item.component);
          return Action ? <Action /> : null;
        })}
    </div>
  );
};

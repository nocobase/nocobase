/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EllipsisOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { ConfigProvider, Divider, Popover, theme } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAclSnippets } from '../../../acl/useAclSnippets';
import type { CustomToken } from '../../../theme';
import { TopbarActionModel } from '../../models/topbar/TopbarActionModel';
import { USER_CENTER_ACTION_ID } from '../../models/topbar/UserCenterTopbarActionModel';
import { HelpLite } from './HelpLite';

const topbarActionsBarClassName = css`
  display: inline-flex;
  align-items: center;
  color: var(--nb-topbar-action-color);

  .nb-topbar-actions-list {
    display: inline-flex;
    align-items: center;
    height: 100%;
  }

  .ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: none;
    color: var(--nb-topbar-action-color);
    vertical-align: middle;
  }

  .ant-btn .anticon,
  .ant-btn .ant-badge,
  .ant-btn .ant-badge .anticon {
    color: var(--nb-topbar-action-color);
  }

  .ant-btn:hover,
  .ant-btn:focus,
  .ant-btn:active {
    background: var(--nb-topbar-action-hover-bg) !important;
  }

  .ant-btn-default {
    box-shadow: none;
  }
`;

const popoverStyle = css`
  .ant-popover-inner {
    padding: 0;
    overflow: hidden;
  }
`;

const dividerTheme = {
  token: {
    colorSplit: 'rgba(255, 255, 255, 0.1)',
  },
};

/**
 * 过滤并稳定排序 topbar actions。
 *
 * @param {TopbarActionModel[]} actions 原始 actions
 * @param {(snippet: string) => boolean} allow ACL 判定函数
 * @returns {TopbarActionModel[]} 可见 actions
 */
export function getVisibleTopbarActions(
  actions: TopbarActionModel[],
  allow: (snippet: string) => boolean,
): TopbarActionModel[] {
  return actions
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => {
      if (action.isHidden()) {
        return false;
      }

      if (!action.aclSnippet) {
        return true;
      }

      return allow(action.aclSnippet);
    })
    .sort((left, right) => {
      if ((left.action.sort || 0) !== (right.action.sort || 0)) {
        return (left.action.sort || 0) - (right.action.sort || 0);
      }

      return left.index - right.index;
    })
    .map(({ action }) => action);
}

const getTopbarActionsBarVars = (token: CustomToken) => {
  return {
    '--nb-topbar-action-color': token.colorTextHeaderMenu || 'rgba(255, 255, 255, 0.65)',
    '--nb-topbar-action-hover-bg': token.colorBgHeaderMenuHover || 'rgba(255, 255, 255, 0.1)',
  } as React.CSSProperties;
};

const TopbarActionErrorFallback = () => {
  return null;
};

const getTopbarActionId = (action: TopbarActionModel) => {
  if (typeof action?.getActionId === 'function') {
    return action.getActionId();
  }

  return action?.actionId || action?.uid || '';
};

const TopbarActionsContent = React.memo((props: { actions: TopbarActionModel[]; onActionClick?: () => void }) => {
  const { allow } = useAclSnippets();
  const { token } = theme.useToken();
  const customToken = token as CustomToken;
  const actions = useMemo(() => getVisibleTopbarActions(props.actions, allow), [allow, props.actions]);
  const mainActions = actions.filter((action) => getTopbarActionId(action) !== USER_CENTER_ACTION_ID);
  const userCenterAction = actions.find((action) => getTopbarActionId(action) === USER_CENTER_ACTION_ID);

  return (
    <div className={topbarActionsBarClassName} style={getTopbarActionsBarVars(customToken)}>
      <div className="nb-topbar-actions-list" onClick={props.onActionClick}>
        {mainActions.map((action) => (
          <ErrorBoundary
            key={action.uid}
            FallbackComponent={TopbarActionErrorFallback}
            onError={(error) => {
              console.error('[NocoBase] Topbar action render failed.', error);
            }}
          >
            <FlowModelRenderer model={action} />
          </ErrorBoundary>
        ))}
      </div>
      <ConfigProvider theme={dividerTheme}>
        <Divider type="vertical" />
      </ConfigProvider>
      <HelpLite />
      {userCenterAction ? (
        <ErrorBoundary
          key={userCenterAction.uid}
          FallbackComponent={TopbarActionErrorFallback}
          onError={(error) => {
            console.error('[NocoBase] Topbar action render failed.', error);
          }}
        >
          <FlowModelRenderer model={userCenterAction} />
        </ErrorBoundary>
      ) : null}
    </div>
  );
});

TopbarActionsContent.displayName = 'TopbarActionsContent';

/**
 * 统一的 v2 顶部动作容器。
 */
export const TopbarActionsBar = React.memo((props: { actions: TopbarActionModel[]; isMobile?: boolean }) => {
  const { token } = theme.useToken();
  const customToken = token as CustomToken;
  const [open, setOpen] = useState(false);

  const handleContentClick = useCallback(() => {
    setOpen(false);
  }, []);

  if (props.isMobile) {
    return (
      <Popover
        rootClassName={popoverStyle}
        content={<TopbarActionsContent actions={props.actions} onActionClick={handleContentClick} />}
        color={customToken.colorBgHeader}
        trigger="click"
        open={open}
        onOpenChange={setOpen}
      >
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', height: '100%', marginRight: -16 }}>
          <EllipsisOutlined
            style={{
              color: customToken.colorTextHeaderMenu,
              fontSize: 20,
            }}
          />
        </div>
      </Popover>
    );
  }

  return <TopbarActionsContent actions={props.actions} />;
});

TopbarActionsBar.displayName = 'TopbarActionsBar';

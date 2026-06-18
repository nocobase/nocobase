/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect } from 'react';
import { Card, Grid, theme } from 'antd';
import { useApp } from '@nocobase/client-v2';
import { ChatBox } from './ChatBox';
import { ChatButton } from './ChatButton';
import { DebugPanel } from './DebugPanel';
import { ToolModal } from './ToolModal';
import { AISelection } from '../../AISelection';
import { AISelectionControl } from '../../AISelectionControl';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatToolsStore } from '../stores/chat-tools';
import { useChatConversationActions } from '../hooks/useChatConversationActions';

export const ChatBoxLayout: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const app = useApp();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const open = useChatBoxStore.use.open();
  const expanded = useChatBoxStore.use.expanded();
  const showDebugPanel = useChatBoxStore.use.showDebugPanel();
  const setOpen = useChatBoxStore.use.setOpen();
  const activeTool = useChatToolsStore.use.activeTool();
  const { loadUnreadCounts } = useChatConversationActions();

  const refreshUnreadCounts = useCallback(() => {
    loadUnreadCounts().catch(console.error);
  }, [loadUnreadCounts]);

  useEffect(() => {
    refreshUnreadCounts();
    app.eventBus.addEventListener('ws:message:ai-employee-tasks:status', refreshUnreadCounts);
    app.eventBus.addEventListener('ws:message:ai-conversations:read', refreshUnreadCounts);
    return () => {
      app.eventBus.removeEventListener('ws:message:ai-employee-tasks:status', refreshUnreadCounts);
      app.eventBus.removeEventListener('ws:message:ai-conversations:read', refreshUnreadCounts);
    };
  }, [app.eventBus, refreshUnreadCounts]);

  const panelWidth = 450;
  const zIndex = 1100;
  const isMobile = !screens.md;

  return (
    <>
      {children}
      <ChatButton />
      {open && !expanded && !isMobile ? (
        <style>
          {`
html {
  padding-left: 450px;
}
html body {
  position: relative;
  overflow: hidden;
  transform: translateX(-450px);
}
.ant-dropdown-placement-topLeft,
.ant-dropdown-placement-bottomLeft,
.ant-dropdown-menu-submenu-placement-rightTop,
.ant-dropdown-menu-submenu-placement-rightBottom {
  transform: translateX(450px) !important;
}
`}
        </style>
      ) : null}
      {open ? (
        <ChatBoxWrapper
          expanded={expanded}
          isMobile={isMobile}
          panelWidth={panelWidth}
          zIndex={zIndex}
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
      {activeTool ? <ToolModal /> : null}
      <AISelection />
      <AISelectionControl />
      {showDebugPanel ? <DebugPanel /> : null}
    </>
  );
};

const ChatBoxWrapper: React.FC<{
  expanded: boolean;
  isMobile: boolean;
  panelWidth: number;
  zIndex: number;
  onClose: () => void;
}> = ({ expanded, isMobile, panelWidth, zIndex, onClose }) => {
  const { token } = theme.useToken();

  if (isMobile) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex,
          background: token.colorBgContainer,
        }}
      >
        <ChatBox />
      </div>
    );
  }

  if (expanded) {
    return (
      <Card
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
          width: '95%',
          height: '95%',
          zIndex,
        }}
        styles={{
          body: {
            height: '100%',
            padding: 0,
          },
        }}
      >
        <ChatBox />
      </Card>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        right: -panelWidth,
        top: 0,
        width: panelWidth,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 1,
        borderInlineStart: '1px solid rgba(5, 5, 5, 0.06)',
        background: token.colorBgContainer,
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <ChatBox />
    </div>
  );
};

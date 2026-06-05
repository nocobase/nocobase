/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useMobileLayout } from '@nocobase/client';
import { ChatBoxWrapper } from './ChatBox';
import { Helmet } from 'react-helmet';
import { ChatButton } from './ChatButton';
import { useChatBoxEffect } from './hooks/useChatBoxEffect';
import { useChatBoxStore } from './stores/chat-box';
import { ToolModal } from './generative-ui/ToolModal';
import { useChatToolsStore } from './stores/chat-tools';
// [AI_DEBUG]
import { DebugPanel } from './DebugPanel';

export const ChatBoxLayout: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const open = useChatBoxStore.use.open();
  const expanded = useChatBoxStore.use.expanded();
  const activeTool = useChatToolsStore.use.activeTool();
  // [AI_DEBUG]
  const showDebugPanel = useChatBoxStore.use.showDebugPanel();
  const { isMobileLayout } = useMobileLayout();

  useChatBoxEffect();

  return (
    <>
      {props.children}
      <ChatButton />
      {open && !expanded && !isMobileLayout ? (
        <Helmet>
          <style type="text/css">
            {`
html {
  padding-left: 450px;
}
html body {
  position: relative;
  overflow: hidden;
  transform: translateX(-450px);
}
.ant-dropdown-placement-topLeft {
  transform: translateX(450px) !important;
}
.ant-dropdown-placement-bottomLeft {
  transform: translateX(450px) !important;
}
.ant-dropdown-menu-submenu-placement-rightTop {
  transform: translateX(450px) !important;
}
.ant-dropdown-menu-submenu-placement-rightBottom {
  transform: translateX(450px) !important;
}
`}
          </style>
        </Helmet>
      ) : null}
      {open ? <ChatBoxWrapper /> : null}
      {activeTool && <ToolModal />}
      {/* [AI_DEBUG] Debug Panel */}
      {showDebugPanel && <DebugPanel />}
    </>
  );
};

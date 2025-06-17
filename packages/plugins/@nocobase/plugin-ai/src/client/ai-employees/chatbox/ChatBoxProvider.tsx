/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { CurrentUserContext } from '@nocobase/client';
import { ChatBoxWrapper } from './ChatBox';
import { ChatBoxContext, useSetChatBoxContext } from './ChatBoxContext';
import { Helmet } from 'react-helmet';
import { ChatButton } from './ChatButton';

export const ChatBoxProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const currentUserCtx = useContext(CurrentUserContext);
  const chatBoxCtx = useSetChatBoxContext();
  const { open, expanded } = chatBoxCtx;

  if (!currentUserCtx?.data?.data) {
    return <>{props.children}</>;
  }
  return (
    <ChatBoxContext.Provider value={chatBoxCtx}>
      {props.children}
      <ChatButton />
      {open && !expanded ? (
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

`}
          </style>
        </Helmet>
      ) : null}
      {open ? <ChatBoxWrapper /> : null}
    </ChatBoxContext.Provider>
  );
};

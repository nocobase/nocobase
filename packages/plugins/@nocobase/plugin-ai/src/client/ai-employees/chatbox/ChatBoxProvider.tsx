/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { FloatButton, Avatar } from 'antd';
import { CurrentUserContext } from '@nocobase/client';
import { ChatBox } from './ChatBox';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { ChatBoxContext, useSetChatBoxContext } from './ChatBoxContext';

export const ChatBoxProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const currentUserCtx = useContext(CurrentUserContext);
  const chatBoxCtx = useSetChatBoxContext();
  const { open, setOpen } = chatBoxCtx;

  if (!currentUserCtx?.data?.data) {
    return <>{props.children}</>;
  }
  return (
    <ChatBoxContext.Provider value={chatBoxCtx}>
      {props.children}
      {!open && (
        <div
          className={css`
            .ant-float-btn {
              width: 40px;
            }
            .ant-float-btn .ant-float-btn-body .ant-float-btn-content {
              padding: 0;
            }
            .ant-float-btn .ant-float-btn-body .ant-float-btn-content .ant-float-btn-icon {
              width: 40px;
            }
          `}
        >
          <FloatButton
            icon={
              <Avatar
                src={icon}
                size={40}
                style={{
                  marginBottom: '4px',
                }}
              />
            }
            onClick={() => {
              setOpen(true);
            }}
            shape="square"
          />
        </div>
      )}
      {open ? <ChatBox /> : null}
    </ChatBoxContext.Provider>
  );
};

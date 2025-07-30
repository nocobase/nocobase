/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Layout, Card, Button, Divider, Tooltip } from 'antd';
import {
  CloseOutlined,
  ExpandOutlined,
  EditOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import { useToken } from '@nocobase/client';
const { Header, Footer, Sider } = Layout;
import { Conversations } from './Conversations';
import { Messages } from './Messages';
import { Sender } from './Sender';
import { css } from '@emotion/css';
import { useT } from '../../locale';
import { UserPrompt } from './UserPrompt';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { aiSelection } from '../stores/ai-selection';
import { observer } from '@formily/react';

export const ChatBox: React.FC = () => {
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const setChatBoxRef = useChatBoxStore.use.setChatBoxRef();
  const setOpen = useChatBoxStore.use.setOpen();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const expanded = useChatBoxStore.use.expanded();
  const setExpanded = useChatBoxStore.use.setExpanded();
  const showConversations = useChatBoxStore.use.showConversations();
  const setShowConversations = useChatBoxStore.use.setShowConversations();

  const { startNewConversation } = useChatBoxActions();

  const { token } = useToken();
  const t = useT();

  useEffect(() => {
    setChatBoxRef(chatBoxRef);
  }, []);

  return (
    <Layout style={{ height: '100%' }} ref={chatBoxRef}>
      <Sider
        width={!expanded ? '350px' : '20%'}
        style={{
          display: showConversations ? 'block' : 'none',
          backgroundColor: token.colorBgContainer,
          marginRight: '5px',
        }}
      >
        <Conversations />
      </Sider>
      <Layout
        style={{
          padding: '0 16px 16px',
        }}
        className={
          showConversations && !expanded
            ? css`
                position: relative;
                &::after {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  background-color: rgba(0, 0, 0, 0.5);
                  width: 100%;
                  height: 100%;
                  cursor: pointer;
                }
              `
            : ''
        }
        onClick={() => {
          if (showConversations && !expanded) {
            setShowConversations(false);
          }
        }}
      >
        <Header
          style={{
            backgroundColor: token.colorBgContainer,
            height: '48px',
            lineHeight: '48px',
            padding: 0,
            borderBottom: `1px solid ${token.colorBorder}`,
          }}
        >
          <div
            style={{
              float: 'left',
            }}
          >
            <Button
              icon={showConversations ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              type="text"
              onClick={() => setShowConversations(!showConversations)}
            />
          </div>
          <div
            style={{
              float: 'right',
            }}
          >
            {currentEmployee ? (
              <>
                <Tooltip arrow={false} title={t('New conversation')}>
                  <Button icon={<EditOutlined />} type="text" onClick={startNewConversation} />
                </Tooltip>
                <UserPrompt />
                <Divider type="vertical" />
              </>
            ) : null}
            <Button
              icon={!expanded ? <ExpandOutlined /> : <ShrinkOutlined />}
              type="text"
              onClick={() => setExpanded(!expanded)}
            />
            <Button icon={<CloseOutlined />} type="text" onClick={() => setOpen(false)} />
          </div>
        </Header>
        <Messages />
        <Footer
          style={{
            backgroundColor: token.colorBgContainer,
            padding: 0,
          }}
        >
          <Sender />
        </Footer>
      </Layout>
    </Layout>
  );
};

const ExpandChatBox: React.FC = observer(() => {
  const selectable = aiSelection.selectable;
  return (
    <Card
      style={{
        position: 'fixed',
        transform: 'translate(-50%, -50%)',
        left: '50%',
        top: '50%',
        width: '95%',
        height: '95%',
        zIndex: selectable ? -1 : 1100,
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
});

export const ChatBoxWrapper: React.FC = () => {
  const expanded = useChatBoxStore.use.expanded();
  const showConversations = useChatBoxStore.use.showConversations();

  return expanded ? (
    <ExpandChatBox />
  ) : (
    <div
      style={{
        position: 'fixed',
        transform: 'translateX(0px) !important',
        right: showConversations ? '-800px' : '-450px',
        zIndex: 1,
        top: 0,
        width: showConversations ? '800px' : '450px',
        height: '100vh',
        overflow: 'hidden',
        borderInlineStart: '1px solid rgba(5, 5, 5, 0.06)',
      }}
    >
      <ChatBox />
    </div>
  );
};

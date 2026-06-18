/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { Button, Divider, Layout, theme, Tooltip, Typography } from 'antd';
import {
  BugOutlined,
  CloseOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useT } from '../../../locale';
import { Conversations } from './Conversations';
import { Messages } from './Messages';
import { Sender } from './Sender';
import { UserPrompt } from './UserPrompt';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatBoxEffect } from '../hooks/useChatBoxEffect';
import { useChatBoxStore } from '../stores/chat-box';

const { Header, Footer, Sider } = Layout;

export const ChatBox: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const setChatBoxRef = useChatBoxStore.use.setChatBoxRef();
  const setOpen = useChatBoxStore.use.setOpen();
  const expanded = useChatBoxStore.use.expanded();
  const setExpanded = useChatBoxStore.use.setExpanded();
  const showConversations = useChatBoxStore.use.showConversations();
  const setShowConversations = useChatBoxStore.use.setShowConversations();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const showDebugPanel = useChatBoxStore.use.showDebugPanel();
  const setShowDebugPanel = useChatBoxStore.use.setShowDebugPanel();
  const { startNewConversation } = useChatBoxActions();
  useChatBoxEffect();

  useEffect(() => {
    setChatBoxRef(chatBoxRef);
    return () => {
      setChatBoxRef(null);
    };
  }, [setChatBoxRef]);

  const conversationPanelWidth = 300;
  const headerHeight = 48;

  return (
    <Layout ref={chatBoxRef} style={{ height: '100%', position: 'relative' }}>
      {showConversations && !expanded ? (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label={t('Close conversation list')}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              cursor: 'pointer',
            }}
            onClick={() => {
              setShowConversations(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                setShowConversations(false);
              }
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: conversationPanelWidth,
              height: '100%',
              backgroundColor: token.colorBgContainer,
              zIndex: 11,
              borderRight: `1px solid ${token.colorBorder}`,
              overflow: 'hidden',
            }}
          >
            <Conversations />
          </div>
        </>
      ) : null}
      {showConversations && expanded ? (
        <Sider
          width={conversationPanelWidth}
          theme="light"
          style={{
            backgroundColor: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorder}`,
            overflow: 'hidden',
          }}
        >
          <Conversations />
        </Sider>
      ) : null}
      <Layout>
        <Header
          style={{
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            height: headerHeight,
            lineHeight: `${headerHeight}px`,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Tooltip title={t('Conversation list')}>
              <Button
                aria-label={t('Conversation list')}
                icon={showConversations ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                type="text"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowConversations(!showConversations);
                }}
              />
            </Tooltip>
          </div>
          <div>
            {currentEmployee ? (
              <>
                <Tooltip title={t('New conversation')}>
                  <Button
                    aria-label={t('New conversation')}
                    icon={<PlusCircleOutlined />}
                    type="text"
                    onClick={startNewConversation}
                  />
                </Tooltip>
                <UserPrompt />
                {!expanded ? (
                  <Tooltip arrow={false} title={t('Debug Panel')}>
                    <Button
                      aria-label={t('Debug Panel')}
                      icon={<BugOutlined />}
                      type="text"
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                    />
                  </Tooltip>
                ) : null}
                <Divider type="vertical" />
              </>
            ) : null}
            <Tooltip title={expanded ? t('Collapse panel') : t('Expand panel')}>
              <Button
                aria-label={expanded ? t('Collapse panel') : t('Expand panel')}
                icon={expanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                type="text"
                onClick={() => {
                  if (!expanded) {
                    setShowDebugPanel(false);
                  }
                  setExpanded(!expanded);
                }}
              />
            </Tooltip>
            <Tooltip title={t('Close')}>
              <Button
                aria-label={t('Close')}
                icon={<CloseOutlined />}
                type="text"
                onClick={() => {
                  setOpen(false);
                }}
              />
            </Tooltip>
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
          <Typography.Text
            type="secondary"
            style={{
              display: 'block',
              textAlign: 'center',
              margin: '10px 0',
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
            }}
          >
            {t('AI disclaimer')}
          </Typography.Text>
        </Footer>
      </Layout>
    </Layout>
  );
};

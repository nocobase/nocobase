/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { Badge, Button, Divider, Layout, theme, Tooltip, Typography } from 'antd';
import {
  BugOutlined,
  CloseOutlined,
  CompressOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useMobileLayout } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import { Conversations } from './Conversations';
import { Messages } from './Messages';
import { Sender } from './Sender';
import { UserPrompt } from './UserPrompt';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatBoxEffect } from '../hooks/useChatBoxEffect';
import { useChatConversationActions } from '../hooks/useChatConversationActions';
import { useWorkflowTasks } from '../hooks/useWorkflowTasks';
import { observer } from '@nocobase/flow-engine';
import { useChatBoxRuntime } from '../stores/runtime';

const { Header, Footer, Sider } = Layout;

export const ChatBox: React.FC<{
  onClose?: () => void;
}> = observer(({ onClose }) => {
  const t = useT();
  const { token } = theme.useToken();
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const { chatBoxModel } = useChatBoxRuntime();
  const expanded = chatBoxModel.expanded;
  const showConversations = chatBoxModel.showConversations;
  const currentEmployee = chatBoxModel.currentEmployee;
  const showDebugPanel = chatBoxModel.showDebugPanel;
  const { startNewConversation } = useChatBoxActions();
  const { unreadCount: unreadConversationCount } = useChatConversationActions();
  const { unreadCount: unreadWorkflowTaskCount } = useWorkflowTasks();
  const unreadCount = unreadConversationCount + unreadWorkflowTaskCount;
  const { isMobileLayout } = useMobileLayout();
  useChatBoxEffect();

  useEffect(() => {
    chatBoxModel.setChatBoxRef(chatBoxRef);
    return () => {
      chatBoxModel.setChatBoxRef(null);
    };
  }, [chatBoxModel]);

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
              chatBoxModel.setShowConversations(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                chatBoxModel.setShowConversations(false);
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
              <Badge dot={unreadCount > 0} offset={[-4, 4]}>
                <Button
                  aria-label={t('Conversation list')}
                  icon={showConversations ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    chatBoxModel.setShowConversations(!showConversations);
                  }}
                />
              </Badge>
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
                      onClick={() => chatBoxModel.setShowDebugPanel(!showDebugPanel)}
                    />
                  </Tooltip>
                ) : null}
                <Divider type="vertical" />
              </>
            ) : null}
            {isMobileLayout ? (
              <Tooltip title={t('Minimize')}>
                <Button
                  aria-label={t('Minimize')}
                  icon={<CompressOutlined />}
                  type="text"
                  onClick={() => {
                    chatBoxModel.setMinimize(true);
                  }}
                />
              </Tooltip>
            ) : (
              <Tooltip title={expanded ? t('Collapse panel') : t('Expand panel')}>
                <Button
                  aria-label={expanded ? t('Collapse panel') : t('Expand panel')}
                  icon={expanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  type="text"
                  onClick={() => {
                    if (!expanded) {
                      chatBoxModel.setShowDebugPanel(false);
                    }
                    chatBoxModel.setExpanded(!expanded);
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title={t('Close')}>
              <Button
                aria-label={t('Close')}
                icon={<CloseOutlined />}
                type="text"
                onClick={() => {
                  if (onClose) {
                    onClose();
                    return;
                  }
                  chatBoxModel.setOpen(false);
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
});

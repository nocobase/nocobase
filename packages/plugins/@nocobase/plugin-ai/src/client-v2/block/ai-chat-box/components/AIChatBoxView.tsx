/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '@nocobase/client-v2';
import {
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  observer,
  useFlowContext,
  type FlowModelContext,
  type FlowModel,
} from '@nocobase/flow-engine';
import { Badge, Empty, Button, Flex, Layout, Tooltip, theme, Typography } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, MessageOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useT } from '../../../locale';
import {
  Conversations,
  Messages,
  registerMountedChatBox,
  useChat,
  useChatBoxActions,
  useChatBoxRuntime,
  useChatConversationActions,
  useChatMessageActions,
} from '../../../ai-employees/chatbox';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { isAIChatBoxCoreModel } from '../sub-models';
import { getAIChatBoxConversationScope, getAIChatBoxCreateScope, getAIChatBoxSettings } from '../utils';

const { Header } = Layout;

export const AI_CHAT_BOX_CORE_MIN_WIDTH = 400;
export const AI_CHAT_BOX_CORE_MIN_HEIGHT = 420;

const compactHeaderClassName = css`
  .ant-btn {
    padding-inline: 4px;
  }

  .ant-btn-icon-only {
    width: 28px;
  }
`;

const headerActionsClassName = css`
  height: 100%;
  flex-shrink: 0;
`;

const headerActionItemsClassName = css`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  min-width: 0;

  > div {
    display: flex;
    align-items: center;
    height: 40px;
    line-height: normal;
  }
`;

const itemsClassName = css`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const blockItemClassName = css`
  flex: 0 0 auto;
  min-height: 0;
`;

const chatBoxFlexContentStyles = `
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const chatBoxItemClassName = css`
  flex: 1 0 auto;
  min-height: ${AI_CHAT_BOX_CORE_MIN_HEIGHT}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  > div,
  > div > div {
    ${chatBoxFlexContentStyles}
  }

  .ant-layout {
    min-height: 0;
  }
`;

const chatBoxRendererClassName = css`
  ${chatBoxFlexContentStyles}

  > div,
  > div > div {
    ${chatBoxFlexContentStyles}
  }
`;

const ChatBoxItem: React.FC<{
  model: FlowModel;
}> = ({ model }) => {
  return (
    <div
      className={chatBoxItemClassName}
      style={{ minWidth: AI_CHAT_BOX_CORE_MIN_WIDTH, minHeight: AI_CHAT_BOX_CORE_MIN_HEIGHT }}
    >
      <Droppable model={model}>
        <div className={chatBoxRendererClassName}>
          <FlowModelRenderer model={model} showFlowSettings={false} hideRemoveInSettings extraToolbarItems={[]} />
        </div>
      </Droppable>
    </div>
  );
};

const BlockItem: React.FC<{
  model: FlowModel;
}> = ({ model }) => {
  return (
    <div className={blockItemClassName}>
      <Droppable model={model}>
        <FlowModelRenderer
          model={model}
          showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
          extraToolbarItems={[
            {
              key: 'drag-handler',
              component: DragHandler,
              sort: 1,
            },
          ]}
        />
      </Droppable>
    </div>
  );
};

const ItemsSlot: React.FC<{
  model: AIChatBoxBlockModel;
}> = observer(({ model }) => {
  const t = useT();
  const flowSettingsEnabled = !!model.context.flowSettingsEnabled;
  const nodes = model.mapSubModels('items', (subModel) => {
    return isAIChatBoxCoreModel(subModel) ? (
      <ChatBoxItem key={subModel.uid} model={subModel} />
    ) : (
      <BlockItem key={subModel.uid} model={subModel} />
    );
  });

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DndProvider>
        {flowSettingsEnabled ? (
          <div style={{ padding: '10px 8px 6px', flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            {model.renderConfigureItems()}
          </div>
        ) : null}
        <div className={itemsClassName}>
          {nodes.length ? (
            nodes
          ) : (
            <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No chat blocks')} />
            </Flex>
          )}
        </div>
      </DndProvider>
    </div>
  );
});

const SidePanel: React.FC<{
  title: string;
  children?: React.ReactNode;
}> = ({ title, children }) => {
  const { token } = theme.useToken();
  if (children) {
    return (
      <Flex
        vertical
        style={{
          height: '100%',
          minHeight: 0,
          padding: `0 ${token.paddingSM}px`,
        }}
      >
        {children}
      </Flex>
    );
  }
  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{
        height: '100%',
        padding: token.paddingLG,
      }}
    >
      <Typography.Text type="secondary">{title}</Typography.Text>
    </Flex>
  );
};

export const AIChatBoxView: React.FC = observer(() => {
  const ctx = useFlowContext<FlowModelContext>();
  const model = ctx.model as AIChatBoxBlockModel;
  const app = useApp();
  const t = useT();
  const { token } = theme.useToken();

  const flowSettingsEnabled = !!model.context.flowSettingsEnabled;
  const settings = getAIChatBoxSettings(model.props);
  const heightMode = model.decoratorProps?.heightMode;
  const minWidth = Math.max(settings.minWidth, AI_CHAT_BOX_CORE_MIN_WIDTH);
  const height = heightMode === 'specifyValue' || heightMode === 'fullHeight' ? '100%' : settings.height;
  const conversationPanelWidth = 300;
  const messagesPanelWidth = 350;
  const headerHeight = 48;

  const [showConversations, setShowConversations] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const isSidePanelOpen = showConversations || showMessagesPanel;

  const runtime = useChatBoxRuntime();
  const conversationCreateScope = getAIChatBoxCreateScope(model);
  runtime.scope = getAIChatBoxConversationScope(model);
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const hasUnreadConversations = runtime.chatConversationModel.conversations.some((conversation) => !conversation.read);
  const chat = useChat(currentConversation, runtime);
  const { clear, startNewConversation, triggerTask } = useChatBoxActions(runtime);
  const { refresh: refreshConversations } = useChatConversationActions(runtime);
  const { syncContextAttachments } = useChatMessageActions(runtime);

  const closeSidePanel = () => {
    setShowConversations(false);
    setShowMessagesPanel(false);
  };
  const refreshBlockConversations = useCallback(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    return registerMountedChatBox({
      uid: model.uid,
      runtime,
      triggerTask: (options) => triggerTask({ ...options, scope: conversationCreateScope }),
      clear,
      syncContextItems: (items) => {
        if (!items.length) {
          return;
        }
        chat.addContextItems(items);
        syncContextAttachments(items);
      },
    });
  }, [chat, clear, conversationCreateScope, model.uid, runtime, syncContextAttachments, triggerTask]);

  useEffect(() => {
    refreshBlockConversations();
    app.eventBus.addEventListener('ws:message:ai-conversations:read', refreshBlockConversations);
    return () => {
      app.eventBus.removeEventListener('ws:message:ai-conversations:read', refreshBlockConversations);
    };
  }, [app.eventBus, refreshBlockConversations, runtime.scope]);

  return (
    <Layout
      style={{
        width: '100%',
        minWidth,
        height,
        minHeight: 420,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: token.colorBgContainer,
      }}
    >
      {isSidePanelOpen ? (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label={showConversations ? t('Close conversation list') : t('Messages')}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              cursor: 'pointer',
            }}
            onClick={closeSidePanel}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                closeSidePanel();
              }
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: showMessagesPanel ? undefined : 0,
              right: showMessagesPanel ? 0 : undefined,
              width: showMessagesPanel ? messagesPanelWidth : conversationPanelWidth,
              height: '100%',
              backgroundColor: token.colorBgContainer,
              zIndex: 11,
              borderLeft: showMessagesPanel ? `1px solid ${token.colorBorder}` : undefined,
              borderRight: showMessagesPanel ? undefined : `1px solid ${token.colorBorder}`,
              overflow: 'hidden',
            }}
          >
            <SidePanel title={showConversations ? t('Conversation list') : t('Messages')}>
              {showConversations ? <Conversations onOpen={closeSidePanel} /> : null}
              {showMessagesPanel ? <Messages /> : null}
            </SidePanel>
          </div>
        </>
      ) : null}
      <Layout
        style={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Header
          className={compactHeaderClassName}
          style={{
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            height: headerHeight,
            flex: '0 0 auto',
            lineHeight: `${headerHeight}px`,
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Flex align="center" gap={0}>
            <Tooltip title={t('Conversation list')}>
              <Badge dot={hasUnreadConversations} offset={[-4, 4]}>
                <Button
                  aria-label={t('Conversation list')}
                  icon={showConversations ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowMessagesPanel(false);
                    setShowConversations(!showConversations);
                  }}
                />
              </Badge>
            </Tooltip>
          </Flex>
          <Flex className={headerActionsClassName} align="center" gap={6}>
            <div className={headerActionItemsClassName}>{model.renderActions()}</div>
            {flowSettingsEnabled ? model.renderConfigureActions() : null}
            <Tooltip title={t('New conversation')}>
              <Button
                aria-label={t('New conversation')}
                icon={<PlusCircleOutlined />}
                type="text"
                onClick={(event) => {
                  event.stopPropagation();
                  startNewConversation();
                }}
              />
            </Tooltip>
            {settings.showMessages ? null : (
              <Tooltip title={t('Messages')}>
                <Button
                  aria-label={t('Messages')}
                  icon={<MessageOutlined />}
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowConversations(false);
                    setShowMessagesPanel(!showMessagesPanel);
                  }}
                />
              </Tooltip>
            )}
          </Flex>
        </Header>
        <ItemsSlot model={model} />
      </Layout>
    </Layout>
  );
});
